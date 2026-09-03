"""
apps/vendors/admin.py
======================
Django Admin registration for technical staff fallback.
"""

from django.contrib import admin
from .models import VendorProfile, VendorWallet, KYCDocument, VendorBankDetails


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display  = ["store_name", "user", "vendor_type", "status", "tier", "commission_rate", "is_verified", "created_at"]
    list_filter   = ["status", "vendor_type", "tier", "is_verified"]
    search_fields = ["store_name", "user__email", "tin_number"]
    readonly_fields = [
        "slug", "is_verified", "verified_at", "verified_by",
        "dispute_rate", "cancellation_rate", "total_completed_orders",
        "created_at", "updated_at",
    ]
    fieldsets = (
        ("Store Identity", {"fields": ("user", "vendor_type", "store_name", "slug", "store_description", "store_logo", "store_banner")}),
        ("KYC Status",     {"fields": ("status", "is_verified", "verified_at", "verified_by", "rejection_reason", "suspension_reason")}),
        ("Business Info",  {"fields": ("business_type", "tin_number", "vat_registered", "vat_number", "business_license_number")}),
        ("Contact",        {"fields": ("contact_email", "contact_phone", "city", "subcity", "wereda", "street_address")}),
        ("Trust & Economics", {"fields": ("tier", "commission_rate", "dispute_rate", "cancellation_rate", "total_completed_orders")}),
        ("Timestamps",     {"fields": ("created_at", "updated_at")}),
    )


@admin.register(VendorWallet)
class VendorWalletAdmin(admin.ModelAdmin):
    list_display  = ["vendor", "available_balance", "pending_balance", "total_withdrawn", "is_payout_locked"]
    list_filter   = ["is_payout_locked"]
    search_fields = ["vendor__store_name"]
    readonly_fields = ["available_balance", "pending_balance", "total_withdrawn", "created_at", "updated_at"]


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display  = ["vendor", "document_type", "is_verified", "created_at"]
    list_filter   = ["document_type", "is_verified"]
    search_fields = ["vendor__store_name"]
    readonly_fields = ["created_at"]


@admin.register(VendorBankDetails)
class VendorBankDetailsAdmin(admin.ModelAdmin):
    list_display  = ["vendor", "bank_name", "account_number", "chapa_subaccount_id"]
    search_fields = ["vendor__store_name", "account_number"]
    readonly_fields = ["chapa_subaccount_id"]
