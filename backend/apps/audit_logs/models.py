"""
apps/audit_logs/models.py
=========================
Immutable audit log entries capturing security, moderation, financial, and administrative operations.
"""

from django.db import models
from django.conf import settings
from apps.common.models import UUIDModel, TimeStampedModel


class AuditLog(UUIDModel, TimeStampedModel):
    """
    Immutable ledger of administrative actions across GechExpress.
    NOTE: Audit logs MUST NOT be soft-deleted.
    """
    class ActionType(models.TextChoices):
        # Auth & Staff
        ADMIN_LOGIN        = "ADMIN_LOGIN",        "Admin Login"
        STAFF_PROVISIONED  = "STAFF_PROVISIONED",  "Staff Provisioned"
        STAFF_DEACTIVATED  = "STAFF_DEACTIVATED",  "Staff Deactivated"
        PASSWORD_RESET     = "PASSWORD_RESET",     "Password Reset"

        # Sellers & KYC (Phase 1 legacy names kept for backward compat)
        SELLER_REGISTERED  = "SELLER_REGISTERED",  "Seller Registered"
        SELLER_APPROVED    = "SELLER_APPROVED",    "Seller Approved"
        SELLER_SUSPENDED   = "SELLER_SUSPENDED",   "Seller Suspended"
        SELLER_PROMOTED    = "SELLER_PROMOTED",    "Seller Promoted"
        SELLER_DEMOTED     = "SELLER_DEMOTED",     "Seller Demoted"

        # Phase 2: Vendor KYC State Transitions
        VENDOR_KYC_SUBMITTED       = "VENDOR_KYC_SUBMITTED",       "Vendor KYC Submitted"
        VENDOR_KYC_APPROVED        = "VENDOR_KYC_APPROVED",        "Vendor KYC Approved"
        VENDOR_KYC_REJECTED        = "VENDOR_KYC_REJECTED",        "Vendor KYC Rejected"
        VENDOR_SUSPENDED           = "VENDOR_SUSPENDED",           "Vendor Suspended"
        VENDOR_REACTIVATED         = "VENDOR_REACTIVATED",         "Vendor Reactivated"
        VENDOR_COMMISSION_UPDATED  = "VENDOR_COMMISSION_UPDATED",  "Vendor Commission Updated"
        VENDOR_CHAPA_PROVISIONED   = "VENDOR_CHAPA_PROVISIONED",   "Vendor Chapa Subaccount Provisioned"

        # Catalog & Moderation
        PRODUCT_APPROVED = "PRODUCT_APPROVED", "Product Approved"
        PRODUCT_REJECTED = "PRODUCT_REJECTED", "Product Rejected"
        PRODUCT_DELETED  = "PRODUCT_DELETED",  "Product Deleted"

        # Economics & Settings
        COMMISSION_RATE_CHANGED    = "COMMISSION_RATE_CHANGED",    "Commission Rate Changed"
        PLATFORM_SETTING_CHANGED   = "PLATFORM_SETTING_CHANGED",   "Platform Setting Changed"
        MAINTENANCE_MODE_TOGGLED   = "MAINTENANCE_MODE_TOGGLED",   "Maintenance Mode Toggled"

        # Financial & Settlement
        ESCROW_RELEASED    = "ESCROW_RELEASED",    "Escrow Released"
        ESCROW_FROZEN      = "ESCROW_FROZEN",      "Escrow Frozen"
        PAYOUT_AUTHORIZED  = "PAYOUT_AUTHORIZED",  "Payout Authorized"
        PAYOUT_REJECTED    = "PAYOUT_REJECTED",    "Payout Rejected"
        REFUND_ISSUED      = "REFUND_ISSUED",      "Refund Issued"

        # General
        GENERIC_ACTION = "GENERIC_ACTION", "Generic Action"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    actor_email = models.EmailField(
        blank=True,
        help_text="Snapshot of actor's email address at time of action."
    )
    actor_role = models.CharField(
        max_length=50,
        blank=True,
        help_text="Snapshot of actor's role/privilege at time of action."
    )
    action = models.CharField(
        max_length=100,
        choices=ActionType.choices,
        db_index=True,
    )
    target_type = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Name of the affected entity model (e.g., VendorProfile, Product, PlatformSetting)."
    )
    target_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Identifier of the target entity."
    )
    target_repr = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human readable representation of the target entity."
    )
    payload = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON capturing before/after states, error messages, or context metadata."
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )
    user_agent = models.TextField(
        blank=True,
    )
    http_method = models.CharField(
        max_length=10,
        blank=True,
    )
    request_path = models.CharField(
        max_length=500,
        blank=True,
    )
    response_status = models.IntegerField(
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "action"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {self.actor_email or 'System'} -> {self.action} ({self.target_repr})"
