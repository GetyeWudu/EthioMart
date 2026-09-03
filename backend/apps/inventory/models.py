from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from apps.common.models import BaseModel
from apps.inventory.enums import MovementType, StaffRole


class WarehouseLocation(BaseModel):
    """
    Physical store branch, dark store, or regional fulfillment hub.
    Supports multi-location stock isolation and nearest-hub order routing.
    """
    vendor = models.ForeignKey(
        "vendors.VendorProfile",
        on_delete=models.CASCADE,
        related_name="warehouses"
    )
    name = models.CharField(max_length=150)
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique facility code (e.g. WH-ADDIS-BOLE-01)"
    )
    city = models.CharField(max_length=100, default="Addis Ababa")
    subcity = models.CharField(max_length=100, blank=True, help_text="e.g., Bole, Kirkos, Yeka")
    wereda = models.CharField(max_length=50, blank=True)
    street_address = models.CharField(max_length=255)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GPS Latitude for automated distance dispatch calculation"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GPS Longitude for automated distance dispatch calculation"
    )
    contact_name = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(
        default=False,
        help_text="Primary hub where single-branch merchants fulfill goods from."
    )
    is_pickup_point = models.BooleanField(
        default=False,
        help_text="True if customers can select this location for Click & Collect pickup."
    )

    class Meta:
        ordering = ["-is_default", "name"]
        indexes = [
            models.Index(fields=["vendor", "is_active"]),
        ]

    def __str__(self):
        default_tag = " (Primary)" if self.is_default else ""
        return f"{self.name} [{self.code}] - {self.city}{default_tag}"

    def clean(self):
        # Ensure only one default warehouse per vendor
        if self.is_default:
            existing_default = WarehouseLocation.objects.filter(
                vendor=self.vendor,
                is_default=True
            ).exclude(pk=self.pk)
            if existing_default.exists():
                existing_default.update(is_default=False)


class WarehouseStock(BaseModel):
    """
    Physical inventory level mapped per ProductVariant and WarehouseLocation.
    """
    warehouse = models.ForeignKey(
        WarehouseLocation,
        on_delete=models.CASCADE,
        related_name="stocks"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.CASCADE,
        related_name="warehouse_stocks"
    )
    quantity_on_hand = models.IntegerField(
        default=0,
        help_text="Total physical units currently located inside this facility."
    )
    quantity_reserved = models.IntegerField(
        default=0,
        help_text="Units held temporarily during active checkouts or unfulfilled orders."
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        help_text="Threshold triggering low-stock alerts to warehouse managers."
    )
    aisle_location = models.CharField(
        max_length=60,
        blank=True,
        help_text="Bin / shelf location (e.g. 'Aisle 3, Shelf B-4')"
    )

    class Meta:
        unique_together = ("warehouse", "variant")
        indexes = [
            models.Index(fields=["warehouse", "variant"]),
            models.Index(fields=["variant", "quantity_on_hand"]),
        ]

    def __str__(self):
        return f"{self.variant.sku} @ {self.warehouse.code}: {self.quantity_available} available ({self.quantity_on_hand} total)"

    @property
    def quantity_available(self) -> int:
        """Physical units cleared and available for immediate sale."""
        return max(0, self.quantity_on_hand - self.quantity_reserved)

    def clean(self):
        if self.quantity_on_hand < 0:
            raise ValidationError({"quantity_on_hand": "Physical stock cannot be negative."})
        if self.quantity_reserved < 0:
            raise ValidationError({"quantity_reserved": "Reserved stock cannot be negative."})


class StockMovement(BaseModel):
    """
    Immutable double-entry inventory audit ledger.
    Every inward receipt, fulfillment deduction, damage write-off,
    or inter-warehouse transfer writes an immutable movement row.
    """
    warehouse = models.ForeignKey(
        WarehouseLocation,
        on_delete=models.CASCADE,
        related_name="movements"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.CASCADE,
        related_name="stock_movements"
    )
    movement_type = models.CharField(
        max_length=35,
        choices=MovementType.choices
    )
    quantity_delta = models.IntegerField(
        help_text="Quantity delta (positive for inward, negative for outward/deduction)"
    )
    balance_after = models.IntegerField(
        help_text="Snapshot of quantity_on_hand immediately following this movement"
    )
    reference_order_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Linked SubOrder or Order UUID if movement originated from fulfillment"
    )
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        "users.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_adjustments"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["warehouse", "variant", "-created_at"]),
            models.Index(fields=["movement_type", "-created_at"]),
        ]

    def __str__(self):
        sign = "+" if self.quantity_delta > 0 else ""
        return f"[{self.movement_type}] {self.variant.sku} ({sign}{self.quantity_delta}) -> Balance: {self.balance_after}"
