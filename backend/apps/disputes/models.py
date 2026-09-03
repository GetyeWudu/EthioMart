from django.db import models
from django.conf import settings
from decimal import Decimal
from apps.common.models import BaseModel
from apps.orders.models import VendorSubOrder
from apps.vendors.models import VendorProfile

class Dispute(BaseModel):
    class Status(models.TextChoices):
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        REFUNDED = 'REFUNDED', 'Refund Approved & Processed'
        REJECTED = 'REJECTED', 'Claim Rejected / Escrow Released'
        CLOSED = 'CLOSED', 'Closed'

    class Reason(models.TextChoices):
        DEFECTIVE = 'DEFECTIVE', 'Defective / Damaged Item'
        WRONG_ITEM = 'WRONG_ITEM', 'Wrong Item / Color / Size'
        COUNTERFEIT = 'COUNTERFEIT', 'Item Not as Described / Counterfeit'
        MISSING_PARTS = 'MISSING_PARTS', 'Missing Items / Accessories'
        DAMAGED_TRANSIT = 'DAMAGED_TRANSIT', 'Damaged in Transit'
        OTHER = 'OTHER', 'Other'

    sub_order = models.OneToOneField(
        VendorSubOrder,
        on_delete=models.CASCADE,
        related_name='dispute',
        help_text="OneToOne guarantee preventing duplicate dispute claims on the same sub-order."
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='filed_disputes'
    )
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.PROTECT,
        related_name='disputes'
    )

    reason = models.CharField(max_length=30, choices=Reason.choices, default=Reason.DEFECTIVE)
    customer_notes = models.TextField(default='', blank=True, help_text="Customer description of the dispute reason.")
    evidence_images = models.JSONField(default=list, blank=True, help_text="List of uploaded image URLs.")

    disputed_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNDER_REVIEW)

    admin_notes = models.TextField(blank=True, default='')
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Dispute {self.id} on SubOrder {self.sub_order_id} - {self.status}"
