from decimal import Decimal
from django.utils import timezone
from django.db.models import F, Q
from apps.promotions.models import Promotion, PromotionUsage
from apps.catalog.models import Category

class PromotionService:
    @staticmethod
    def get_effective_discount(product, active_promotions_list, base_price=None):
        """
        Evaluates active automatic promotions for a product.
        Selects the single promotion that yields the lowest effective price (highest discount).
        Returns: { 'effective_price': Decimal, 'discount_percentage': int, 'promotion_badge': str, 'promo_id': str | None, 'discount_amount': Decimal }
        """
        if base_price is None:
            # We assume product.min_price or base_price is passed, but if not we can calculate
            variants = product.variants.filter(is_active=True)
            prices = [v.price for v in variants if v.price is not None]
            base_price = min(prices) if prices else Decimal('0.00')

        if base_price <= 0 or not active_promotions_list:
            return {
                'effective_price': base_price,
                'discount_percentage': 0,
                'promotion_badge': None,
                'promo_id': None,
                'discount_amount': Decimal('0.00')
            }

        best_promo = None
        best_discount_amount = Decimal('0.00')
        best_effective_price = base_price

        for promo in active_promotions_list:
            is_applicable = False
            
            # Check Vendor Scope
            if promo.vendor_id and promo.vendor_id != product.vendor_id:
                continue
                
            if promo.scope_type == Promotion.ScopeType.STORE:
                if promo.vendor_id:
                    is_applicable = (promo.vendor_id == product.vendor_id)
                else:
                    is_applicable = False
            elif promo.scope_type == Promotion.ScopeType.PRODUCT:
                if any(p.id == product.id for p in promo.scope_products.all()):
                    is_applicable = True
            elif promo.scope_type == Promotion.ScopeType.CATEGORY:
                # We should check if product category is in promo.scope_categories or their descendants.
                # In-memory check:
                product_cat = product.category
                promo_cats = promo.scope_categories.all()
                if any(pc.id == product_cat.id or (product_cat.path and pc.path and product_cat.path.startswith(pc.path)) for pc in promo_cats):
                    is_applicable = True

            if is_applicable:
                discount_amount = Decimal('0.00')
                if promo.discount_type == Promotion.DiscountType.PERCENTAGE:
                    discount_amount = base_price * (promo.discount_value / Decimal('100'))
                elif promo.discount_type == Promotion.DiscountType.FIXED:
                    discount_amount = promo.discount_value
                
                # Cap discount at base_price
                discount_amount = min(discount_amount, base_price)
                
                if discount_amount > best_discount_amount:
                    best_discount_amount = discount_amount
                    best_effective_price = base_price - discount_amount
                    best_promo = promo

        if best_promo:
            percentage = 0
            if best_promo.discount_type == Promotion.DiscountType.PERCENTAGE:
                percentage = int(best_promo.discount_value)
            else:
                percentage = int((best_discount_amount / base_price) * 100) if base_price > 0 else 0

            return {
                'effective_price': best_effective_price,
                'discount_percentage': percentage,
                'promotion_badge': best_promo.name,
                'promo_id': str(best_promo.id),
                'discount_amount': best_discount_amount
            }

        return {
            'effective_price': base_price,
            'discount_percentage': 0,
            'promotion_badge': None,
            'promo_id': None,
            'discount_amount': Decimal('0.00')
        }

    @staticmethod
    def validate_coupon(coupon_code, customer=None, sub_order=None, cart_items=None):
        """
        Validates a coupon code.
        Can be used pre-checkout (with cart_items) or during checkout (with sub_order).
        Returns a dict: {'valid': True/False, 'discount_amount': Decimal, 'error': str, 'promotion': Promotion}
        """
        try:
            promotion = Promotion.objects.get(coupon_code=coupon_code, is_coupon_required=True)
        except Promotion.DoesNotExist:
            return {'valid': False, 'error': "Invalid coupon code."}

        if not promotion.is_active:
            return {'valid': False, 'error': "This coupon is no longer active."}

        now = timezone.now()
        if promotion.starts_at and now < promotion.starts_at:
            return {'valid': False, 'error': "This coupon is not yet active."}
        if promotion.expires_at and now > promotion.expires_at:
            return {'valid': False, 'error': "This coupon has expired."}

        if promotion.max_uses and promotion.current_uses >= promotion.max_uses:
            return {'valid': False, 'error': "This coupon has reached its maximum usage limit."}

        if customer and promotion.max_uses_per_customer:
            uses = PromotionUsage.objects.filter(promotion=promotion, customer=customer).count()
            if uses >= promotion.max_uses_per_customer:
                return {'valid': False, 'error': "You have reached the maximum usage limit for this coupon."}

        # Calculate discount
        discount_amount = Decimal('0.00')
        applicable_subtotal = Decimal('0.00')

        if cart_items:
            # Pre-compute expanded categories if needed
            expanded_category_ids = set()
            if promotion.scope_type == Promotion.ScopeType.CATEGORY:
                selected_cat_ids = set(promotion.scope_categories.values_list('id', flat=True))
                expanded_category_ids = set(
                    Category.objects.filter(
                        Q(id__in=selected_cat_ids) | Q(path__startswith=Category.objects.filter(id__in=selected_cat_ids).values_list('path', flat=True).first() or 'NOPATH') # Naive fallback, better to iterate but user provided simple Q
                    ).values_list('id', flat=True)
                )
                # Note: The user's snippet used parent_id. If using django-treebeard, it's better to fetch descendants properly.
                # Let's do it cleanly for treebeard:
                expanded_category_ids = set()
                for cat in promotion.scope_categories.all():
                    expanded_category_ids.add(cat.id)
                    expanded_category_ids.update(cat.get_descendants().values_list('id', flat=True))

            for item in cart_items:
                variant = item.variant
                vendor = variant.product.vendor
                
                # Check vendor scope
                if promotion.vendor and promotion.vendor != vendor:
                    continue

                # Check specific scope
                if promotion.scope_type == Promotion.ScopeType.PRODUCT:
                    if not promotion.scope_products.filter(id=variant.product_id).exists():
                        continue
                elif promotion.scope_type == Promotion.ScopeType.CATEGORY:
                    if variant.product.category_id not in expanded_category_ids:
                        continue

                applicable_subtotal += variant.price * item.quantity

        elif sub_order:
            # Check vendor scope
            if promotion.vendor and promotion.vendor != sub_order.vendor:
                return {'valid': False, 'error': "This coupon cannot be applied to this vendor."}
                
            # Pre-compute expanded categories if needed
            expanded_category_ids = set()
            if promotion.scope_type == Promotion.ScopeType.CATEGORY:
                for cat in promotion.scope_categories.all():
                    expanded_category_ids.add(cat.id)
                    expanded_category_ids.update(cat.get_descendants().values_list('id', flat=True))

            for item in sub_order.items.all():
                variant = item.variant
                # Check specific scope
                if promotion.scope_type == Promotion.ScopeType.PRODUCT:
                    if not promotion.scope_products.filter(id=variant.product_id).exists():
                        continue
                elif promotion.scope_type == Promotion.ScopeType.CATEGORY:
                    if variant.product.category_id not in expanded_category_ids:
                        continue

                applicable_subtotal += item.unit_price * item.quantity

        if applicable_subtotal == Decimal('0.00'):
            return {'valid': False, 'error': "This coupon does not apply to any items in your cart."}

        if promotion.discount_type == Promotion.DiscountType.PERCENTAGE:
            discount_amount = applicable_subtotal * (promotion.discount_value / Decimal('100'))
        else: # FIXED
            discount_amount = min(promotion.discount_value, applicable_subtotal) # Don't discount more than the subtotal

        return {
            'valid': True,
            'discount_amount': discount_amount,
            'promotion': promotion,
            'applicable_subtotal': applicable_subtotal
        }

    @staticmethod
    def apply_discount(coupon_code, customer, order):
        """
        Applies a validated coupon to an order.
        Assumes within a transaction.atomic() block.
        """
        # Validate again, but across the whole order (all sub-orders)
        try:
            # Lock the promotion row
            promotion = Promotion.objects.select_for_update().get(coupon_code=coupon_code, is_coupon_required=True)
        except Promotion.DoesNotExist:
            return False, "Invalid coupon code."

        # Simplified validation for the apply step (assuming pre-validation was done)
        if not promotion.is_active or (promotion.max_uses and promotion.current_uses >= promotion.max_uses):
            return False, "Coupon is no longer valid."

        total_discount_applied = Decimal('0.00')

        for sub_order in order.sub_orders.all():
            val_result = PromotionService.validate_coupon(coupon_code, customer, sub_order=sub_order)
            if val_result['valid']:
                discount = val_result['discount_amount']
                if discount > 0:
                    sub_order.discount_applied = discount
                    sub_order.sub_total -= discount
                    sub_order.coupon_code = coupon_code
                    sub_order.save(update_fields=['discount_applied', 'sub_total', 'coupon_code'])
                    total_discount_applied += discount

        if total_discount_applied > 0:
            order.discount_applied = total_discount_applied
            order.total_amount -= total_discount_applied
            order.coupon_code = coupon_code
            order.save(update_fields=['discount_applied', 'total_amount', 'coupon_code'])

            # Record usage
            PromotionUsage.objects.create(
                promotion=promotion,
                order=order,
                customer=customer,
                discount_applied=total_discount_applied
            )

            promotion.current_uses += 1
            promotion.save(update_fields=['current_uses'])
            
            return True, "Discount applied."

        return False, "Coupon did not apply to any items."
