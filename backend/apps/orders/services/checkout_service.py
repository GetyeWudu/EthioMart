from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string
from apps.carts.models import Cart
from apps.orders.models import Order, VendorSubOrder, OrderItem, OrderPaymentStatus
from apps.inventory.models import WarehouseStock
from apps.promotions.services import PromotionService
from apps.shipping.models import ShippingZone, Shipment, ShipmentEvent, ShipmentStatus
from apps.shipping.services import ShippingCalculator
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification


class CheckoutService:
    @staticmethod
    @transaction.atomic
    def process_checkout(user, cart_id, delivery_method='DOORSTEP', shipping_address=None, coupon_code=None, zone_id=None):
        try:
            cart = Cart.objects.get(id=cart_id)
        except Cart.DoesNotExist:
            raise ValidationError("Cart not found.")

        if user and user.is_authenticated and not user.is_active:
            raise ValidationError("Your purchasing privileges are suspended. Please contact customer support to appeal.")

        if not cart.items.exists():
            raise ValidationError("Cart is empty.")

        zone = None
        if zone_id:
            try:
                zone = ShippingZone.objects.get(id=zone_id, is_active=True)
            except ShippingZone.DoesNotExist:
                raise ValidationError("Invalid shipping zone.")

        # Fetch active automatic promotions to prevent N+1 queries
        from apps.promotions.models import Promotion, PromotionUsage
        from apps.vendors.enums import VendorStatus
        from django.utils import timezone
        now = timezone.now()
        active_promotions = list(Promotion.objects.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True,
            is_coupon_required=False
        ).prefetch_related('scope_products', 'scope_categories'))

        # Create master Order
        order_number = f"ORD-{get_random_string(8).upper()}"
        order = Order.objects.create(
            order_number=order_number,
            customer=user if user.is_authenticated else None,
            delivery_method=delivery_method,
            shipping_address=shipping_address,
            payment_status=OrderPaymentStatus.PENDING
        )

        total_order_amount = Decimal("0.00")
        total_discount_applied = Decimal("0.00")
        total_shipping_fee = Decimal("0.00")
        vendor_sub_orders = {}
        applied_promotions_usage = {}

        cart_items_list = list(cart.items.select_related('variant', 'variant__product', 'variant__product__vendor'))

        for item in cart_items_list:
            variant = item.variant
            requested_qty = item.quantity
            vendor = variant.product.vendor

            if vendor.status == VendorStatus.SUSPENDED or not vendor.is_active:
                raise ValidationError(
                    f"'{variant.product.title}' is no longer available from the merchant."
                )

            # Find optimal warehouse with enough stock (preferring nearest facility to delivery zone)
            if item.selected_facility:
                stock = WarehouseStock.objects.filter(
                    variant=variant, 
                    warehouse=item.selected_facility
                ).select_for_update().first()
            else:
                dest_code = zone.code.upper() if zone else "ADD"
                dest_name = zone.name.upper() if zone else "ADDIS ABABA"

                available_stocks = WarehouseStock.objects.filter(
                    variant=variant,
                    warehouse__vendor=vendor,
                    quantity_on_hand__gte=requested_qty
                ).select_related('warehouse').select_for_update()

                # Prioritize local warehouse in destination city
                stock = None
                for s in available_stocks:
                    wh_city = (s.warehouse.city or "").upper()
                    if dest_code in wh_city or dest_name in wh_city or ("BAHIR" in dest_name and "BAH" in wh_city) or ("GONDAR" in dest_name and "GON" in wh_city):
                        stock = s
                        break
                
                # If no exact local warehouse match, pick the first available warehouse
                if not stock:
                    stock = available_stocks.first()
            
            if not stock:
                raise ValidationError(f"No stock found for {variant.sku}.")
            
            # Check availability
            if stock.quantity_available < requested_qty:
                raise ValidationError(f"Insufficient stock for {variant.sku}. Requested {requested_qty}, available {stock.quantity_available}.")

            # Reserve the stock atomically
            stock.quantity_reserved += requested_qty
            stock.save(update_fields=['quantity_reserved'])

            # Group into VendorSubOrders
            if vendor.id not in vendor_sub_orders:
                vendor_sub_orders[vendor.id] = VendorSubOrder.objects.create(
                    order=order,
                    vendor=vendor
                )
            
            sub_order = vendor_sub_orders[vendor.id]
            unit_price = variant.price
            line_total = unit_price * requested_qty

            OrderItem.objects.create(
                vendor_sub_order=sub_order,
                variant=variant,
                warehouse=stock.warehouse,
                quantity=requested_qty,
                unit_price=unit_price
            )

            # Evaluate Automatic Promotions
            promo_result = PromotionService.get_effective_discount(variant.product, active_promotions, base_price=unit_price)
            discount_amount_per_unit = promo_result['discount_amount']
            promo_id = promo_result['promo_id']
            
            line_discount = discount_amount_per_unit * requested_qty

            if line_discount > 0 and promo_id:
                if promo_id not in applied_promotions_usage:
                    applied_promotions_usage[promo_id] = Decimal("0.00")
                applied_promotions_usage[promo_id] += line_discount

                sub_order.discount_applied += line_discount
                
            sub_order.sub_total += (line_total - line_discount)
            sub_order.save(update_fields=['sub_total', 'discount_applied'])
            
            total_order_amount += (line_total - line_discount)
            total_discount_applied += line_discount

        # Process tiered dynamic shipping per sub-order package
        if zone:
            shipping_calc_result = ShippingCalculator.calculate(
                cart_items=cart_items_list,
                zone_id=zone.id
            )
            total_shipping_fee = shipping_calc_result["total_shipping_fee"]

            for vendor_id, sub_order in vendor_sub_orders.items():
                vendor_pkgs = [
                    pkg for pkg in shipping_calc_result.get("sub_orders", [])
                    if str(pkg["vendor_id"]) == str(vendor_id)
                ]
                sub_order_fee = sum(
                    (Decimal(str(pkg["sub_order_shipping_fee"])) for pkg in vendor_pkgs),
                    Decimal("0.00")
                )
                
                sub_order.shipping_fee = sub_order_fee
                sub_order.save(update_fields=['shipping_fee'])

                # Create Shipment
                tracking_code = f"#TRK-GCX-{sub_order.id.hex[:6].upper()}-{zone.code}"
                shipment = Shipment.objects.create(
                    sub_order=sub_order,
                    tracking_number=tracking_code,
                    shipping_fee=sub_order_fee,
                    status=ShipmentStatus.PROCESSING
                )
                
                # Create initial ShipmentEvent
                ShipmentEvent.objects.create(
                    shipment=shipment,
                    status=ShipmentStatus.PROCESSING,
                    location=zone.name,
                    description=f"Order verified. Package assigned to {zone.name} shipping tier."
                )

        total_order_amount += total_shipping_fee
        order.total_amount = total_order_amount
        order.total_shipping_fee = total_shipping_fee
        order.discount_applied = total_discount_applied
        order.save(update_fields=['total_amount', 'total_shipping_fee', 'discount_applied'])

        # Record usage for automatic promotions
        if applied_promotions_usage:
            for promo_id, amount in applied_promotions_usage.items():
                promo = Promotion.objects.get(id=promo_id)
                PromotionUsage.objects.create(
                    promotion=promo,
                    order=order,
                    customer=user if user.is_authenticated else None,
                    discount_applied=amount
                )
                promo.current_uses += 1
                promo.save(update_fields=['current_uses'])

        # Apply coupon discount if provided
        if coupon_code:
            success, msg = PromotionService.apply_discount(
                coupon_code=coupon_code,
                customer=user if user.is_authenticated else None,
                order=order
            )
            if not success:
                raise ValidationError(msg)

        # Clear the cart
        cart.delete()

        # Send Notifications
        if user.is_authenticated:
            NotificationService.send_notification(
                user=user,
                type=Notification.NotificationType.ORDER_UPDATE,
                title="Order Placed",
                message=f"Your order {order.order_number} has been placed successfully.",
                related_link=f"/customer/orders/{order.id}"
            )
            
        for vendor_id, sub_order in vendor_sub_orders.items():
            if sub_order.vendor and sub_order.vendor.user:
                NotificationService.send_notification(
                    user=sub_order.vendor.user,
                    type=Notification.NotificationType.ORDER_UPDATE,
                    title="New Order Received",
                    message=f"You have received a new order (Sub-Order #{sub_order.id.hex[:8].upper()}) from {order.order_number}.",
                    related_link=f"/seller/orders/{sub_order.id}"
                )

        return order
