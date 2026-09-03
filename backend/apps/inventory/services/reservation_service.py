import uuid
import logging
from typing import Optional
from django.db import transaction
from django.core.cache import cache
from apps.inventory.models import WarehouseLocation, WarehouseStock, StockMovement
from apps.inventory.enums import MovementType
from apps.catalog.models import ProductVariant

logger = logging.getLogger(__name__)

RESERVATION_TTL_SECONDS = 900  # 15 minutes


class StockReservationService:
    """
    High-concurrency stock reservation engine combining Redis fast locks
    with PostgreSQL row-level locking for zero-overselling protection.
    """

    @classmethod
    def _get_redis_key(cls, cart_id: str, variant_id: str, warehouse_id: str) -> str:
        return f"stock:res:{cart_id}:{variant_id}:{warehouse_id}"

    @classmethod
    @transaction.atomic
    def reserve_stock(
        cls,
        cart_id: str,
        variant: ProductVariant,
        warehouse: WarehouseLocation,
        quantity: int,
    ) -> bool:
        """
        Temporarily locks stock for 15 minutes during active customer checkout.
        Returns True if reservation succeeded, False if insufficient stock.
        """
        if quantity <= 0:
            return False

        # Lock database row to prevent concurrent overselling
        stock = WarehouseStock.objects.select_for_update().filter(
            warehouse=warehouse,
            variant=variant
        ).first()

        if not stock or stock.quantity_available < quantity:
            logger.warning(
                f"Stock reservation failed: SKU {variant.sku} @ {warehouse.code} "
                f"only has {stock.quantity_available if stock else 0} available (requested: {quantity})."
            )
            return False

        # Increment reserved quantity
        stock.quantity_reserved += quantity
        stock.save(update_fields=["quantity_reserved", "updated_at"])

        # Write Redis key with 15-minute TTL
        redis_key = cls._get_redis_key(cart_id, str(variant.id), str(warehouse.id))
        cache.set(redis_key, quantity, timeout=RESERVATION_TTL_SECONDS)

        logger.info(
            f"Reserved {quantity} units of {variant.sku} @ {warehouse.code} for cart {cart_id} (15m lock)."
        )
        return True

    @classmethod
    @transaction.atomic
    def release_reservation(
        cls,
        cart_id: str,
        variant: ProductVariant,
        warehouse: WarehouseLocation,
        quantity: Optional[int] = None,
    ) -> None:
        """
        Releases reserved stock hold (e.g. cart item removed or checkout expired).
        """
        redis_key = cls._get_redis_key(cart_id, str(variant.id), str(warehouse.id))
        cached_qty = cache.get(redis_key)
        qty_to_release = quantity or (int(cached_qty) if cached_qty else 0)

        if qty_to_release > 0:
            stock = WarehouseStock.objects.select_for_update().filter(
                warehouse=warehouse,
                variant=variant
            ).first()
            if stock:
                stock.quantity_reserved = max(0, stock.quantity_reserved - qty_to_release)
                stock.save(update_fields=["quantity_reserved", "updated_at"])

        cache.delete(redis_key)
        logger.info(f"Released reservation for {variant.sku} @ {warehouse.code} (cart: {cart_id}).")

    @classmethod
    @transaction.atomic
    def fulfill_reservation(
        cls,
        cart_id: str,
        variant: ProductVariant,
        warehouse: WarehouseLocation,
        quantity: int,
        order_id: uuid.UUID,
        performed_by=None,
    ) -> WarehouseStock:
        """
        Finalizes an order upon successful payment confirmation.
        Converts the temporary reservation into a permanent fulfillment deduction.
        """
        stock = WarehouseStock.objects.select_for_update().filter(
            warehouse=warehouse,
            variant=variant
        ).first()

        if not stock:
            raise ValueError(f"No stock record found for {variant.sku} at {warehouse.name}.")

        # Deduct physical stock & clear reserved hold
        new_on_hand = max(0, stock.quantity_on_hand - quantity)
        new_reserved = max(0, stock.quantity_reserved - quantity)

        stock.quantity_on_hand = new_on_hand
        stock.quantity_reserved = new_reserved
        stock.save(update_fields=["quantity_on_hand", "quantity_reserved", "updated_at"])

        # Write immutable fulfillment movement
        StockMovement.objects.create(
            warehouse=warehouse,
            variant=variant,
            movement_type=MovementType.ORDER_FULFILLMENT,
            quantity_delta=-quantity,
            balance_after=new_on_hand,
            reference_order_id=order_id,
            notes=f"Order fulfillment for Order #{order_id}",
            performed_by=performed_by,
        )

        # Clear Redis reservation key
        redis_key = cls._get_redis_key(cart_id, str(variant.id), str(warehouse.id))
        cache.delete(redis_key)

        logger.info(
            f"Fulfilled {quantity} units of {variant.sku} @ {warehouse.code} for Order {order_id}."
        )
        return stock
