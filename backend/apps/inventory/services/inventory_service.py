import uuid
import logging
from typing import Optional
from django.db import transaction
from apps.inventory.models import WarehouseLocation, WarehouseStock, StockMovement
from apps.inventory.enums import MovementType
from apps.catalog.models import ProductVariant

logger = logging.getLogger(__name__)


class InventoryService:
    """
    Manages stock levels with double-entry StockMovement ledger integrity.
    """

    @classmethod
    @transaction.atomic
    def adjust_stock(
        cls,
        warehouse: WarehouseLocation,
        variant: ProductVariant,
        quantity_delta: int,
        movement_type: MovementType,
        performed_by=None,
        reference_order_id: Optional[uuid.UUID] = None,
        notes: str = "",
    ) -> WarehouseStock:
        """
        Atomically updates on-hand stock and writes an immutable StockMovement ledger entry.
        """
        # Lock stock row
        stock, created = WarehouseStock.objects.select_for_update().get_or_create(
            warehouse=warehouse,
            variant=variant,
            defaults={"quantity_on_hand": 0, "quantity_reserved": 0}
        )

        new_balance = stock.quantity_on_hand + quantity_delta
        if new_balance < 0:
            raise ValueError(
                f"Insufficient physical stock for SKU '{variant.sku}' at '{warehouse.name}'. "
                f"Current: {stock.quantity_on_hand}, Requested delta: {quantity_delta}"
            )

        stock.quantity_on_hand = new_balance
        stock.save(update_fields=["quantity_on_hand", "updated_at"])

        # Write immutable audit ledger
        StockMovement.objects.create(
            warehouse=warehouse,
            variant=variant,
            movement_type=movement_type,
            quantity_delta=quantity_delta,
            balance_after=new_balance,
            reference_order_id=reference_order_id,
            notes=notes,
            performed_by=performed_by,
        )

        logger.info(
            f"Stock adjusted for {variant.sku} @ {warehouse.code}: "
            f"delta {quantity_delta:+d} -> Balance: {new_balance} [{movement_type}]"
        )
        return stock

    @classmethod
    @transaction.atomic
    def transfer_stock(
        cls,
        source_warehouse: WarehouseLocation,
        target_warehouse: WarehouseLocation,
        variant: ProductVariant,
        quantity: int,
        performed_by=None,
        notes: str = "",
    ) -> None:
        """
        Transfers physical inventory between two warehouses of the same vendor.
        """
        if source_warehouse == target_warehouse:
            raise ValueError("Source and target warehouses must be different.")
        if quantity <= 0:
            raise ValueError("Transfer quantity must be positive.")
        if source_warehouse.vendor_id != target_warehouse.vendor_id:
            raise ValueError("Inter-warehouse transfers can only occur between facilities of the same merchant.")

        transfer_ref = uuid.uuid4()
        transfer_notes = f"Transfer ref: {transfer_ref}. {notes}".strip()

        # 1. Deduct from source
        cls.adjust_stock(
            warehouse=source_warehouse,
            variant=variant,
            quantity_delta=-quantity,
            movement_type=MovementType.TRANSFER_OUT,
            performed_by=performed_by,
            notes=transfer_notes,
        )

        # 2. Add to destination
        cls.adjust_stock(
            warehouse=target_warehouse,
            variant=variant,
            quantity_delta=quantity,
            movement_type=MovementType.TRANSFER_IN,
            performed_by=performed_by,
            notes=transfer_notes,
        )

        logger.info(
            f"Transferred {quantity} units of {variant.sku} from {source_warehouse.code} to {target_warehouse.code}."
        )
