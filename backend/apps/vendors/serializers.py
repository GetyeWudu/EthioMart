"""
apps/vendors/serializers.py
============================
Serializers for the vendors domain, grouped by context:
  - Seller self-service (me endpoints)
  - Public storefront (read-only)
  - Admin moderation (full detail)
  - Wallet snapshot
  - KYC document upload
  - Bank details submission
"""

from decimal import Decimal
from rest_framework import serializers
from apps.common.validators import validate_document_file, validate_image_file, validate_tin_number, validate_ethiopian_phone
from .models import VendorProfile, VendorWallet, VendorLedgerEntry, KYCDocument, VendorBankDetails, VendorStaff
from .enums import VendorStatus, VendorType, BusinessType, DocumentType


# ─────────────────────────────────────────────────────────────────────────────
# SHARED / NESTED
# ─────────────────────────────────────────────────────────────────────────────

class KYCDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source="get_document_type_display", read_only=True)

    class Meta:
        model  = KYCDocument
        fields = [
            "id", "document_type", "document_type_display",
            "file", "document_number", "is_verified", "notes", "created_at",
        ]
        read_only_fields = ["id", "is_verified", "notes", "created_at", "document_type_display"]


class KYCDocumentUploadSerializer(serializers.ModelSerializer):
    """Used by sellers to upload individual KYC documents."""
    class Meta:
        model  = KYCDocument
        fields = ["document_type", "file", "document_number"]

    def validate_file(self, value):
        validate_document_file(value)
        return value


class VendorBankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VendorBankDetails
        fields = [
            "id", "bank_code", "bank_name",
            "account_number", "account_name", "chapa_subaccount_id",
        ]
        read_only_fields = ["id", "chapa_subaccount_id"]


class VendorBankDetailsWriteSerializer(serializers.ModelSerializer):
    """Used by sellers to submit or update their bank/payout account details."""
    class Meta:
        model  = VendorBankDetails
        fields = ["bank_code", "bank_name", "account_number", "account_name"]


class VendorWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VendorWallet
        fields = [
            "available_balance", "pending_balance", "locked_payout_balance", "total_withdrawn",
            "is_payout_locked", "lock_reason",
        ]
        read_only_fields = fields


class VendorLedgerEntrySerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source="get_entry_type_display", read_only=True)
    sub_order_id = serializers.CharField(source="sub_order.id", read_only=True, default=None)

    class Meta:
        model = VendorLedgerEntry
        fields = [
            "id",
            "sub_order_id",
            "entry_type",
            "entry_type_display",
            "amount",
            "commission_rate",
            "commission_deducted",
            "platform_net_revenue",
            "platform_vat_amount",
            "seller_vat_advisory",
            "is_vat_registered_vendor",
            "net_amount",
            "notes",
            "created_at",
        ]
        read_only_fields = fields


class PayoutRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        from .models import PayoutRequest
        model = PayoutRequest
        fields = [
            "id",
            "requested_amount",
            "transfer_fee",
            "disbursed_amount",
            "bank_code",
            "bank_name",
            "account_number",
            "account_name",
            "transfer_reference",
            "status",
            "status_display",
            "failure_reason",
            "completed_at",
            "created_at",
        ]
        read_only_fields = fields


class VendorWithdrawalRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("500.00"),
        help_text="Requested withdrawal amount in ETB (Minimum: 500.00 ETB)",
    )
    bank_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    account_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    account_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    bank_name = serializers.CharField(max_length=100, required=False, allow_blank=True)


# ─────────────────────────────────────────────────────────────────────────────
# SELLER SELF-SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class SellerProfileSerializer(serializers.ModelSerializer):
    """
    Seller's own profile view — includes KYC status, branding, and contact.
    Write-protected fields are read-only.
    """
    bank_details = VendorBankDetailsSerializer(read_only=True)
    kyc_documents = KYCDocumentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    tier_display   = serializers.CharField(source="get_tier_display", read_only=True)
    business_type_display = serializers.CharField(source="get_business_type_display", read_only=True)
    allowed_categories = serializers.SerializerMethodField()

    def get_allowed_categories(self, obj):
        return [
            {"id": str(c.id), "name": c.name, "slug": c.slug}
            for c in obj.allowed_categories.all()
        ]

    class Meta:
        model  = VendorProfile
        fields = [
            # Identification
            "id", "store_name", "slug",
            # Status
            "status", "status_display", "vendor_type",
            "is_verified", "verified_at", "rejection_reason", "suspension_reason",
            # Trust
            "tier", "tier_display", "dispute_rate", "cancellation_rate", "total_completed_orders",
            # Branding
            "store_description", "store_logo", "store_banner",
            # Business KYC
            "business_type", "business_type_display",
            "tin_number", "vat_registered", "vat_number", "business_license_number",
            # Category Gating
            "allowed_categories",
            # Contact
            "contact_email", "contact_phone", "city", "subcity", "wereda", "street_address",
            # Economics (read-only for sellers)
            "commission_rate",
            # Related
            "bank_details", "kyc_documents",
            # Timestamps
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "status", "status_display", "vendor_type",
            "is_verified", "verified_at", "rejection_reason", "suspension_reason",
            "tier", "tier_display", "dispute_rate", "cancellation_rate", "total_completed_orders",
            "commission_rate", "bank_details", "kyc_documents", "allowed_categories",
            "created_at", "updated_at",
        ]

    def validate_store_logo(self, value):
        validate_image_file(value)
        return value

    def validate_store_banner(self, value):
        validate_image_file(value)
        return value


class SellerProfileUpdateSerializer(serializers.ModelSerializer):
    """Write serializer for PATCH /api/v1/vendors/me/"""
    allowed_category_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    class Meta:
        model  = VendorProfile
        fields = [
            "store_name", "store_description", "store_logo", "store_banner",
            "contact_email", "contact_phone",
            "city", "subcity", "wereda", "street_address",
            "allowed_category_ids",
        ]

    def update(self, instance, validated_data):
        category_ids = validated_data.pop("allowed_category_ids", None)
        instance = super().update(instance, validated_data)
        if category_ids is not None:
            instance.allowed_categories.set(category_ids)
        return instance


class VendorStaffSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    facility_name = serializers.CharField(source="assigned_facility.name", read_only=True, default="All Facilities")

    class Meta:
        model = VendorStaff
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "role",
            "assigned_facility",
            "facility_name",
            "is_active",
            "created_at",
        ]


class SellerKYCSubmitSerializer(serializers.Serializer):
    """
    Validates the KYC submission request body.
    Business fields + bank_details are optional in the request body
    (seller may have updated them separately via PATCH /me/).
    """
    business_type           = serializers.ChoiceField(choices=BusinessType.choices, required=False)
    tin_number              = serializers.CharField(max_length=20, required=False, validators=[validate_tin_number])
    vat_registered          = serializers.BooleanField(required=False)
    vat_number              = serializers.CharField(max_length=30, required=False, allow_blank=True)
    business_license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    contact_email           = serializers.EmailField(required=False)
    contact_phone           = serializers.CharField(max_length=20, required=False, validators=[validate_ethiopian_phone])
    city                    = serializers.CharField(max_length=100, required=False)
    subcity                 = serializers.CharField(max_length=100, required=False, allow_blank=True)
    wereda                  = serializers.CharField(max_length=50, required=False, allow_blank=True)
    street_address          = serializers.CharField(max_length=255, required=False, allow_blank=True)
    allowed_category_ids    = serializers.ListField(child=serializers.UUIDField(), required=False)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC STOREFRONT
# ─────────────────────────────────────────────────────────────────────────────

class PublicStoreSerializer(serializers.ModelSerializer):
    """Public-facing store card and profile."""
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)
    product_count = serializers.SerializerMethodField()
    active_promotions = serializers.SerializerMethodField()

    class Meta:
        model  = VendorProfile
        fields = [
            "slug", "store_name", "store_description",
            "store_logo", "store_banner",
            "city", "contact_email", "contact_phone",
            "is_verified", "tier", "tier_display",
            "product_count", "active_promotions",
        ]

    def get_product_count(self, obj):
        return obj.products.live_on_storefront().count()

    def get_active_promotions(self, obj):
        promos = obj.promotions.filter(is_active=True)
        return [
            {
                "name": p.name,
                "discount_type": p.discount_type,
                "discount_value": float(p.discount_value),
                "is_coupon_required": p.is_coupon_required,
                "coupon_code": p.coupon_code,
                "scope_type": p.scope_type,
            }
            for p in promos
        ]


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN MODERATION
# ─────────────────────────────────────────────────────────────────────────────

class AdminVendorListSerializer(serializers.ModelSerializer):
    """Compact vendor row for admin listing."""
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    tier_display   = serializers.CharField(source="get_tier_display", read_only=True)
    seller_email   = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = VendorProfile
        fields = [
            "id", "store_name", "slug", "seller_email",
            "vendor_type", "status", "status_display",
            "tier", "tier_display", "is_verified", "commission_rate",
            "created_at",
        ]


class AdminVendorDetailSerializer(serializers.ModelSerializer):
    """Full admin view: KYC docs, bank details, wallet, user info."""
    bank_details  = VendorBankDetailsSerializer(read_only=True)
    kyc_documents = KYCDocumentSerializer(many=True, read_only=True)
    wallet        = VendorWalletSerializer(read_only=True)
    seller_email  = serializers.EmailField(source="user.email", read_only=True)
    seller_name   = serializers.SerializerMethodField()
    status_display        = serializers.CharField(source="get_status_display", read_only=True)
    tier_display          = serializers.CharField(source="get_tier_display", read_only=True)
    business_type_display = serializers.CharField(source="get_business_type_display", read_only=True)

    class Meta:
        model  = VendorProfile
        fields = [
            "id", "store_name", "slug",
            "seller_email", "seller_name",
            "vendor_type", "status", "status_display",
            "is_verified", "verified_at", "verified_by",
            "rejection_reason", "suspension_reason",
            "tier", "tier_display",
            "dispute_rate", "cancellation_rate", "total_completed_orders",
            "business_type", "business_type_display",
            "tin_number", "vat_registered", "vat_number", "business_license_number",
            "contact_email", "contact_phone", "city", "subcity", "wereda", "street_address",
            "commission_rate",
            "store_description", "store_logo", "store_banner",
            "bank_details", "kyc_documents", "wallet",
            "created_at", "updated_at",
        ]

    def get_seller_name(self, obj) -> str:
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class AdminRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=10, max_length=1000)


class AdminSuspendSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=10, max_length=1000)


class AdminCommissionSerializer(serializers.Serializer):
    commission_rate = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal("0.00"),
        max_value=Decimal("100.00"),
    )
