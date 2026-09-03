"""
apps/vendors/models.py
======================
Core domain models for GechExpress vendor management:
  - VendorProfile: Merchant identity, KYC status, trust tier, economics
  - VendorWallet: Financial balance projection (source of truth = apps.payments ledger in Phase 5)
  - KYCDocument: Ethiopian regulatory document uploads
  - VendorBankDetails: Chapa payout settlement info
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.common.models import BaseModel
from apps.common.validators import validate_tin_number, validate_ethiopian_phone, validate_document_file, validate_image_file
from .enums import VendorType, VendorStatus, TrustTier, BusinessType, DocumentType


class VendorProfile(BaseModel):
    """
    Merchant store profile.
    PLATFORM vendors (first-party) bypass KYC & Chapa subaccount registration entirely.
    THIRD_PARTY vendors go through the full KYC state machine.
    """
    user = models.OneToOneField(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="vendor_profile",
    )
    vendor_type = models.CharField(
        max_length=20,
        choices=VendorType.choices,
        default=VendorType.THIRD_PARTY,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=VendorStatus.choices,
        default=VendorStatus.DRAFT,
        db_index=True,
    )

    # ── Store Branding ────────────────────────────────────────────────────────
    store_name  = models.CharField(max_length=150, unique=True, db_index=True)
    slug        = models.SlugField(max_length=160, unique=True, db_index=True)
    store_description = models.TextField(blank=True)
    store_logo  = models.ImageField(
        upload_to="vendors/logos/%Y/%m/",
        null=True, blank=True,
        validators=[validate_image_file],
    )
    store_banner = models.ImageField(
        upload_to="vendors/banners/%Y/%m/",
        null=True, blank=True,
        validators=[validate_image_file],
    )

    # ── Ethiopian Business KYC ───────────────────────────────────────────────
    business_type           = models.CharField(max_length=30, choices=BusinessType.choices, default=BusinessType.INDIVIDUAL)
    tin_number              = models.CharField(max_length=20, blank=True, validators=[validate_tin_number])
    vat_registered          = models.BooleanField(default=False)
    vat_number              = models.CharField(max_length=30, blank=True)
    business_license_number = models.CharField(max_length=50, blank=True)

    # ── Category Gating & Scoping ─────────────────────────────────────────────
    allowed_categories = models.ManyToManyField(
        "catalog.Category",
        blank=True,
        related_name="vendors",
        help_text="Primary root categories the seller is approved to list products in."
    )

    # ── Contact & Location ───────────────────────────────────────────────────
    contact_email  = models.EmailField(blank=True)
    contact_phone  = models.CharField(max_length=20, blank=True, validators=[validate_ethiopian_phone])
    city           = models.CharField(max_length=100, default="Addis Ababa")
    subcity        = models.CharField(max_length=100, blank=True)
    wereda         = models.CharField(max_length=50, blank=True)
    street_address = models.CharField(max_length=255, blank=True)

    # ── Trust Engine (feeds Phase 3 auto-approval logic) ─────────────────────
    tier                    = models.CharField(max_length=20, choices=TrustTier.choices, default=TrustTier.PROBATION, db_index=True)
    dispute_rate            = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Rolling % of orders disputed")
    cancellation_rate       = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Rolling % of orders cancelled by seller")
    total_completed_orders  = models.PositiveIntegerField(default=0, help_text="Cumulative delivered orders")

    # ── Economics ────────────────────────────────────────────────────────────
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=10.00,
        help_text="Platform commission % on each order. PLATFORM store = 0.00",
    )

    # ── KYC Verification ─────────────────────────────────────────────────────
    is_verified      = models.BooleanField(default=False)
    verified_at      = models.DateTimeField(null=True, blank=True)
    verified_by      = models.ForeignKey(
        "users.CustomUser",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_vendors",
    )
    rejection_reason  = models.TextField(blank=True, help_text="Mandatory explanation on KYC rejection")
    suspension_reason = models.TextField(blank=True, help_text="Mandatory explanation on store suspension")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Vendor Profile"
        verbose_name_plural = "Vendor Profiles"
        indexes = [
            models.Index(fields=["status", "vendor_type"]),
            models.Index(fields=["tier", "status"]),
        ]

    def __str__(self):
        return f"{self.store_name} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self) -> str:
        base = slugify(self.store_name)
        slug, n = base, 1
        while VendorProfile.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    @property
    def is_active(self) -> bool:
        return self.status == VendorStatus.APPROVED and not self.is_deleted


class VendorWallet(BaseModel):
    """
    Fast balance projection for a vendor.
    Source of truth: immutable VendorLedgerEntry lines in apps.payments (Phase 5).
    Balances are updated atomically via select_for_update() by WalletService.
    """
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name="wallet",
    )

    # ── Financial State ───────────────────────────────────────────────────────
    available_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Cleared funds ready for payout withdrawal",
    )
    pending_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Locked in 72-hour dispute cooldown window",
    )
    locked_payout_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Held during in-flight Chapa transfer disbursement (Two-Phase Payout hold)",
    )
    total_withdrawn = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Cumulative lifetime payouts (append-only via ledger)",
    )

    # ── Safety Locks ─────────────────────────────────────────────────────────
    is_payout_locked = models.BooleanField(
        default=False,
        help_text="Frozen during active disputes or account suspension",
    )
    lock_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Vendor Wallet"
        verbose_name_plural = "Vendor Wallets"

    def __str__(self):
        return f"{self.vendor.store_name} Wallet — Available: {self.available_balance} ETB"


class KYCDocument(BaseModel):
    """
    Ethiopian regulatory KYC documents uploaded by merchants.
    Document validation enforces strict rules via submit_for_review() in KYCVerificationService.
    """
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name="kyc_documents",
    )
    document_type   = models.CharField(max_length=30, choices=DocumentType.choices)
    file            = models.FileField(
        upload_to="vendors/kyc/%Y/%m/",
        validators=[validate_document_file],
    )
    document_number = models.CharField(max_length=100, blank=True, help_text="Certificate or registration number")
    is_verified     = models.BooleanField(default=False, help_text="Set True by admin during KYC approval")
    notes           = models.TextField(blank=True, help_text="Admin reviewer notes on this specific document")

    class Meta:
        ordering = ["document_type"]
        verbose_name = "KYC Document"
        verbose_name_plural = "KYC Documents"

    def __str__(self):
        return f"{self.vendor.store_name} — {self.get_document_type_display()}"


class VendorBankDetails(BaseModel):
    """
    Ethiopian bank / Telebirr payout settlement details.
    chapa_subaccount_id is populated asynchronously after KYC approval
    by the `provision_chapa_subaccount` Celery task.
    """
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name="bank_details",
    )

    # Ethiopian bank codes: CBE='32', Awash='96', Dashen='85', Telebirr='telebirr'
    bank_code      = models.CharField(max_length=50, db_index=True, help_text="Chapa bank code or 'telebirr'")
    bank_name      = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name   = models.CharField(max_length=150, help_text="Must match business legal name / TIN holder")
    chapa_subaccount_id = models.CharField(max_length=100, blank=True, db_index=True)

    class Meta:
        verbose_name = "Vendor Bank Details"
        verbose_name_plural = "Vendor Bank Details"

    def __str__(self):
        return f"{self.vendor.store_name} — {self.bank_name} ({self.account_number})"


class VendorStaff(models.Model):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Store Owner"
        MANAGER = "MANAGER", "Store Operations Manager"
        INVENTORY_CLERK = "INVENTORY_CLERK", "Inventory Clerk"
        FULFILLMENT_CLERK = "FULFILLMENT_CLERK", "Order Fulfillment / Packing"
        SUPPORT = "SUPPORT", "Customer Support Agent"

    vendor = models.ForeignKey("VendorProfile", on_delete=models.CASCADE, related_name="staff_members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vendor_staff_roles")
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.INVENTORY_CLERK)
    
    assigned_facility = models.ForeignKey(
        "inventory.WarehouseLocation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_staff"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("vendor", "user")

    def __str__(self):
        return f"{self.user.email} - {self.get_role_display()} @ {self.vendor.store_name}"


class VendorStaffInvitation(models.Model):
    vendor = models.ForeignKey("VendorProfile", on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=32, choices=VendorStaff.Role.choices, default=VendorStaff.Role.INVENTORY_CLERK)
    assigned_facility = models.ForeignKey(
        "inventory.WarehouseLocation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("vendor", "email")

    def __str__(self):
        return f"Invitation for {self.email} to {self.vendor.store_name}"
        
    def is_expired(self):
        from django.utils import timezone
        import datetime
        return timezone.now() > self.created_at + datetime.timedelta(days=7)


class VendorLedgerEntry(BaseModel):
    """
    Immutable double-entry wallet accounting ledger.
    One row per financial event. Never updated — only appended.
    Source of truth for all vendor balance mutations.

    Flow:
        DISPATCHED  → ESCROW_CREDIT   → pending_balance  ↑
        DELIVERED+48h → ESCROW_RELEASE → available_balance ↑, pending_balance ↓
        DISPUTE WON by buyer → ESCROW_REFUND → pending_balance ↓
        PAYOUT → WITHDRAWAL → available_balance ↓
    """

    class EntryType(models.TextChoices):
        ESCROW_CREDIT  = "ESCROW_CREDIT",  "Escrow Credit (Pending — awaiting delivery clearance)"
        ESCROW_RELEASE = "ESCROW_RELEASE", "Escrow Released to Available Balance"
        ESCROW_REFUND  = "ESCROW_REFUND",  "Escrow Refunded (Dispute resolved for buyer)"
        WITHDRAWAL     = "WITHDRAWAL",     "Payout Withdrawal to Bank / Telebirr"

    wallet = models.ForeignKey(
        VendorWallet,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    sub_order = models.ForeignKey(
        "orders.VendorSubOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wallet_ledger_entries",
        help_text="Sub-order this ledger entry relates to, if applicable.",
    )
    entry_type = models.CharField(max_length=30, choices=EntryType.choices, db_index=True)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Gross sub-order amount before commission deduction.",
    )
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00,
        help_text="Effective commission percentage applied (e.g. 10.00%).",
    )
    commission_deducted = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Platform commission (gross / tax-inclusive) taken from this entry.",
    )
    platform_net_revenue = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Platform net service revenue before 15% VAT extraction (e.g. 434.78 on 500 ETB commission).",
    )
    platform_vat_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="15% VAT extracted from platform commission for MoR/ERCA audit liability (e.g. 65.22 ETB).",
    )
    seller_vat_advisory = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00,
        help_text="Estimated 15% product VAT advisory for VAT-registered seller's own tax filing.",
    )
    is_vat_registered_vendor = models.BooleanField(
        default=False,
        help_text="Snapshot of vendor VAT registration status at transaction time.",
    )
    net_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Net amount credited/debited to the seller (amount - commission_deducted).",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Vendor Ledger Entry"
        verbose_name_plural = "Vendor Ledger Entries"
        indexes = [
            models.Index(fields=["wallet", "-created_at"]),
            models.Index(fields=["entry_type", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.entry_type}] {self.wallet.vendor.store_name} — {self.net_amount} ETB"


class PayoutRequest(BaseModel):
    """
    Two-Phase Payout State Machine tracking for Chapa automated bank / Telebirr transfers.
    
    Lifecycle:
        1. PENDING    → Balance held in locked_payout_balance, Redis lock acquired
        2. PROCESSING → Dispatched to Chapa /v1/transfers with transfer_reference
        3. COMPLETED  → Bank confirmed settlement, locked_payout_balance cleared, total_withdrawn updated
        4. FAILED     → Bank reversed or failed, funds re-credited to available_balance
        5. REJECTED   → Immediate Chapa API validation rejection, funds re-credited
    """
    class Status(models.TextChoices):
        PENDING    = "PENDING",    "Pending (Hold on Wallet Balance)"
        PROCESSING = "PROCESSING", "Processing (Dispatched to Chapa Transfer API)"
        COMPLETED  = "COMPLETED",  "Completed (Settled to Recipient Bank/Telebirr)"
        FAILED     = "FAILED",     "Failed (Rejected by Bank/Chapa, Re-credited)"
        REJECTED   = "REJECTED",   "Rejected (Immediate API validation failure)"

    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name="payout_requests",
    )
    requested_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Gross withdrawal amount requested by seller (e.g. 5,000.00 ETB).",
    )
    transfer_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=15.00,
        help_text="Flat Chapa bank transfer fee deducted (15.00 ETB).",
    )
    disbursed_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Net amount transferred to seller bank/Telebirr (requested_amount - transfer_fee).",
    )
    bank_code = models.CharField(max_length=50, help_text="Chapa bank code (e.g. '85' for Dashen, 'telebirr', etc.)")
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=150)
    transfer_reference = models.CharField(max_length=100, unique=True, db_index=True)
    chapa_response_raw = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    failure_reason = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payout Request"
        verbose_name_plural = "Payout Requests"
        indexes = [
            models.Index(fields=["vendor", "status", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"Payout #{self.transfer_reference} ({self.vendor.store_name}) — {self.disbursed_amount} ETB [{self.status}]"


