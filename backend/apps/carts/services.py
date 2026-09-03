from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from apps.carts.models import Cart, CartItem
from apps.inventory.models import WarehouseStock

class CartService:
    @staticmethod
    def get_or_create_cart(user=None, session_key=None):
        if user and user.is_authenticated:
            carts = Cart.objects.filter(user=user).order_by("-created_at")
            if carts.exists():
                primary_cart = carts.first()
                if carts.count() > 1:
                    for duplicate_cart in carts[1:]:
                        for item in duplicate_cart.items.all():
                            existing = primary_cart.items.filter(variant=item.variant).first()
                            if existing:
                                existing.quantity += item.quantity
                                existing.save()
                                item.delete()
                            else:
                                item.cart = primary_cart
                                item.save()
                        duplicate_cart.delete()
                return primary_cart
            return Cart.objects.create(user=user)
        elif session_key:
            carts = Cart.objects.filter(session_key=session_key, user=None).order_by("-created_at")
            if carts.exists():
                primary_cart = carts.first()
                if carts.count() > 1:
                    for duplicate_cart in carts[1:]:
                        for item in duplicate_cart.items.all():
                            existing = primary_cart.items.filter(variant=item.variant).first()
                            if existing:
                                existing.quantity += item.quantity
                                existing.save()
                                item.delete()
                            else:
                                item.cart = primary_cart
                                item.save()
                        duplicate_cart.delete()
                return primary_cart
            return Cart.objects.create(session_key=session_key, user=None)
        else:
            import uuid
            new_session_key = str(uuid.uuid4())
            return Cart.objects.create(session_key=new_session_key, user=None)

    @staticmethod
    def merge_guest_cart(session_key, user):
        if not session_key or not user.is_authenticated:
            return
            
        guest_cart = Cart.objects.filter(session_key=session_key, user=None).first()
        if not guest_cart:
            return

        user_cart, _ = Cart.objects.get_or_create(user=user)

        for item in guest_cart.items.all():
            existing_item = CartItem.all_objects.filter(cart=user_cart, variant=item.variant).first()
            if existing_item:
                if existing_item.is_deleted:
                    existing_item.restore()
                    existing_item.quantity = item.quantity
                else:
                    existing_item.quantity += item.quantity
                existing_item.save()
            else:
                item.cart = user_cart
                item.save()
        
        guest_cart.hard_delete()
        return user_cart

    @staticmethod
    def validate_stock_for_cart_item(variant, quantity):
        # We need to make sure there is at least 'quantity' stock available globally across all warehouses
        # Or if we have a specific hub we want to enforce, we'd check that hub. 
        # For carts, we typically just check global availability.
        stocks = WarehouseStock.objects.filter(variant=variant)
        total_available = sum(stock.quantity_available for stock in stocks)
        if total_available < quantity:
            raise ValidationError(f"Only {total_available} units available for {variant.sku}.")

    @staticmethod
    @transaction.atomic
    def add_item_to_cart(cart, variant, quantity=1, selected_facility=None):
        CartService.validate_stock_for_cart_item(variant, quantity)

        # Use all_objects to find soft-deleted items as well
        item = CartItem.all_objects.filter(cart=cart, variant=variant).first()
        
        if item:
            if item.is_deleted:
                item.restore()
                item.quantity = quantity
            else:
                item.quantity += quantity
                
            CartService.validate_stock_for_cart_item(variant, item.quantity)
            if selected_facility:
                item.selected_facility = selected_facility
            item.save()
        else:
            try:
                with transaction.atomic():
                    item = CartItem.objects.create(
                        cart=cart, 
                        variant=variant,
                        quantity=quantity,
                        selected_facility=selected_facility
                    )
            except IntegrityError:
                # Concurrent request created it.
                item = CartItem.all_objects.get(cart=cart, variant=variant)
                if item.is_deleted:
                    item.restore()
                    item.quantity = quantity
                else:
                    item.quantity += quantity
                
                CartService.validate_stock_for_cart_item(variant, item.quantity)
                if selected_facility:
                    item.selected_facility = selected_facility
                item.save()
        
        return item
