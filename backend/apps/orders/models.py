import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

class OrderPaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PAID = 'PAID', 'Paid'
    FAILED = 'FAILED', 'Failed'

class OrderItemStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    READY_FOR_DISPATCH = 'READY_FOR_DISPATCH', 'Ready for Dispatch'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Order(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    transaction_reference = models.CharField(max_length=100, blank=True, db_index=True, help_text="Chapa tx_ref or payment reference")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=OrderPaymentStatus.choices, default=OrderPaymentStatus.PENDING)
    delivery_method = models.CharField(max_length=50, default='DOORSTEP')
    shipping_address = models.JSONField(null=True, blank=True)
    coupon_code = models.CharField(max_length=50, null=True, blank=True)
    discount_applied = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} ({self.get_payment_status_display()})"

class VendorSubOrder(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='sub_orders')
    vendor = models.ForeignKey('vendors.VendorProfile', on_delete=models.CASCADE, related_name='sub_orders')
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=50, null=True, blank=True)
    discount_applied = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dispatched_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when seller marked this sub-order as dispatched.")
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when delivery was confirmed by seller/customer.")
    is_payout_settled = models.BooleanField(default=False, help_text="True once Celery has released escrow to available_balance.")
    is_disputed = models.BooleanField(default=False, help_text="True while an active dispute is open.")

    class Meta:
        unique_together = ('order', 'vendor')

    def __str__(self):
        return f"SubOrder {self.id} for {self.vendor.store_name}"

    @property
    def total_amount(self):
        from decimal import Decimal
        return Decimal(str((self.sub_total + self.shipping_fee) - self.discount_applied))

    @property
    def commission_amount(self):
        from decimal import Decimal
        rate = (getattr(self.vendor, 'commission_rate', None) or Decimal('10.00')) / Decimal('100.00')
        return (self.sub_total * rate).quantize(Decimal('0.01'))

    def is_within_inspection_window(self) -> bool:
        if not self.delivered_at:
            return False
        from django.utils import timezone
        diff = timezone.now() - self.delivered_at
        # 5 minutes inspection window for testing (was 48 hours)
        return diff.total_seconds() <= (5 * 60)

    @property
    def derived_status(self) -> str:
        """Derives sub-order status from the least-progressed item status."""
        statuses = list(self.items.values_list('status', flat=True))
        if not statuses:
            return 'PENDING'
        priority = ['PENDING', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED']
        for s in priority:
            if s in statuses:
                return s
        return statuses[0]

class OrderItem(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_sub_order = models.ForeignKey(VendorSubOrder, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.SET_NULL, null=True)
    warehouse = models.ForeignKey('inventory.WarehouseLocation', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=OrderItemStatus.choices, default=OrderItemStatus.PENDING)

    def __str__(self):
        sku = self.variant.sku if self.variant else "Unknown SKU"
        return f"{self.quantity} x {sku} (Status: {self.get_status_display()})"
