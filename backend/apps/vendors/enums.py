"""
apps/vendors/enums.py
=====================
Domain enumerations for vendors: status, type, tier, business type, document type.
"""

from django.db import models


class VendorType(models.TextChoices):
    PLATFORM    = "PLATFORM",    "Platform Direct Store"
    THIRD_PARTY = "THIRD_PARTY", "Third-Party Merchant"


class VendorStatus(models.TextChoices):
    DRAFT          = "DRAFT",          "Draft"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending KYC Review"
    APPROVED       = "APPROVED",       "Approved & Active"
    REJECTED       = "REJECTED",       "KYC Rejected"
    SUSPENDED      = "SUSPENDED",      "Suspended"


class TrustTier(models.TextChoices):
    PROBATION = "PROBATION", "Probation"   # New sellers — full manual review required
    TRUSTED   = "TRUSTED",   "Trusted"     # Eligible for reduced review (Phase 3)
    VIP       = "VIP",       "VIP"         # Eligible for full auto-approval (Phase 3)


class BusinessType(models.TextChoices):
    INDIVIDUAL          = "INDIVIDUAL",          "Individual (ግለሰብ)"
    SOLE_PROPRIETORSHIP = "SOLE_PROPRIETORSHIP", "Sole Proprietorship (ግል ድርጅት)"
    PLC                 = "PLC",                 "Private Limited Company (PLC)"
    SHARE_COMPANY       = "SHARE_COMPANY",       "Share Company (SC)"


class DocumentType(models.TextChoices):
    TIN_CERTIFICATE    = "TIN_CERTIFICATE",    "TIN Certificate (የግብር ከፋይ መለያ)"
    VAT_CERTIFICATE    = "VAT_CERTIFICATE",    "VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት)"
    TRADE_LICENSE      = "TRADE_LICENSE",      "Renewed Trade License (የታደሰ ንግድ ፈቃድ)"
    FAYDA_ID           = "FAYDA_ID",           "Fayda National Digital ID (ፋይዳ)"
    PASSPORT_OR_KEBELE = "PASSPORT_OR_KEBELE", "Passport or Kebele ID"
    POWER_OF_ATTORNEY  = "POWER_OF_ATTORNEY",  "Power of Attorney (ውክልና)"
    OTHER              = "OTHER",              "Other Supporting Document"
