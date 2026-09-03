"""
apps/vendors/services/kyc_service.py
=====================================
Domain service: KYC state machine transitions with audit logging.

State machine:
  DRAFT / REJECTED → PENDING_REVIEW → APPROVED → SUSPENDED → APPROVED
  PENDING_REVIEW → REJECTED

Invariants:
  - Rejection requires a non-empty reason.
  - Suspension requires a non-empty reason.
  - PLATFORM vendors bypass this service entirely.
  - Every transition writes an immutable AuditLog entry.
  - Approval: auto-creates VendorWallet + queues Chapa subaccount Celery task.
  - Suspension: auto-locks VendorWallet.
  - Reactivation: auto-unlocks VendorWallet.
"""

import logging
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.audit_logs.models import AuditLog
from apps.vendors.models import VendorProfile, VendorWallet, KYCDocument
from apps.vendors.enums import VendorStatus, VendorType, DocumentType, BusinessType
from .wallet_service import WalletService

logger = logging.getLogger(__name__)

# Required document combinations per Q3 decision
INDIVIDUAL_REQUIRED_DOCS = {DocumentType.TIN_CERTIFICATE, DocumentType.FAYDA_ID, DocumentType.PASSPORT_OR_KEBELE}
CORPORATE_REQUIRED_DOCS  = {DocumentType.TIN_CERTIFICATE, DocumentType.TRADE_LICENSE}


class KYCVerificationService:

    @staticmethod
    def _validate_kyc_documents(vendor: VendorProfile):
        """
        Enforces strict Option A document validation before KYC submission.
        Individual: TIN_CERTIFICATE + (FAYDA_ID or PASSPORT_OR_KEBELE)
        Corporate:  TIN_CERTIFICATE + TRADE_LICENSE
        """
        uploaded_types = set(
            vendor.kyc_documents.values_list("document_type", flat=True)
        )

        has_tin = DocumentType.TIN_CERTIFICATE in uploaded_types
        if not has_tin:
            raise ValidationError(
                "TIN Certificate (የግብር ከፋይ መለያ) is required for all business types."
            )

        if vendor.business_type == BusinessType.INDIVIDUAL:
            has_id = (
                DocumentType.FAYDA_ID in uploaded_types or
                DocumentType.PASSPORT_OR_KEBELE in uploaded_types
            )
            if not has_id:
                raise ValidationError(
                    "Individual merchants must upload a Fayda Digital ID (ፋይዳ) or Passport/Kebele ID."
                )
        else:
            # Corporate: SOLE_PROPRIETORSHIP, PLC, SHARE_COMPANY
            if DocumentType.TRADE_LICENSE not in uploaded_types:
                raise ValidationError(
                    "Corporate merchants must upload a renewed Trade License (የታደሰ ንግድ ፈቃድ)."
                )

        # VAT-registered merchants must supply an official VAT certificate
        if vendor.vat_registered and DocumentType.VAT_CERTIFICATE not in uploaded_types:
            raise ValidationError(
                "VAT-registered businesses must upload an official VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት)."
            )

    @staticmethod
    @transaction.atomic
    def submit_for_review(vendor: VendorProfile, validated_data: dict) -> VendorProfile:
        """
        Validates mandatory KYC fields and documents, then transitions:
        DRAFT / REJECTED → PENDING_REVIEW

        validated_data: dict with bank_details fields and business registration info.
        """
        if vendor.vendor_type == VendorType.PLATFORM:
            raise ValidationError("Platform stores do not require KYC submission.")

        if vendor.status not in (VendorStatus.DRAFT, VendorStatus.REJECTED):
            raise ValidationError(
                f"Cannot submit for review from status '{vendor.status}'. "
                "Current status must be DRAFT or REJECTED."
            )

        # Apply any updated business fields from the request
        fields_to_update = []
        business_fields = [
            "business_type", "tin_number", "vat_registered", "vat_number",
            "business_license_number", "contact_email", "contact_phone",
            "city", "subcity", "wereda", "street_address",
        ]
        for field in business_fields:
            if field in validated_data:
                setattr(vendor, field, validated_data[field])
                fields_to_update.append(field)

        # Validate mandatory fields for submission
        if not vendor.tin_number:
            raise ValidationError("TIN number is required before submitting for review.")
        if not vendor.store_name:
            raise ValidationError("Store name is required before submitting for review.")
        if vendor.vat_registered and not (vendor.vat_number and vendor.vat_number.strip()):
            raise ValidationError("VAT Registration Number is required when business is VAT-registered.")

        # Validate KYC documents (strict Option A)
        KYCVerificationService._validate_kyc_documents(vendor)

        # Validate bank details exist
        if not hasattr(vendor, "bank_details"):
            raise ValidationError(
                "Bank/payout account details must be added before submitting for KYC review."
            )

        old_status = vendor.status
        vendor.status = VendorStatus.PENDING_REVIEW
        fields_to_update += ["status", "updated_at"]
        vendor.save(update_fields=fields_to_update)

        AuditLog.objects.create(
            actor=vendor.user,
            actor_email=vendor.user.email,
            actor_role=vendor.user.role,
            action=AuditLog.ActionType.VENDOR_KYC_SUBMITTED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={"old_status": old_status, "new_status": VendorStatus.PENDING_REVIEW},
        )

        logger.info(f"KYC submitted for '{vendor.store_name}' → PENDING_REVIEW")
        return vendor

    @staticmethod
    @transaction.atomic
    def approve_vendor(actor, vendor: VendorProfile) -> VendorProfile:
        """
        Admin approves KYC:
          - PENDING_REVIEW → APPROVED
          - Sets is_verified=True, verified_at, verified_by
          - Auto-creates VendorWallet
          - Queues Chapa subaccount Celery task (non-blocking)
        """
        if vendor.status != VendorStatus.PENDING_REVIEW:
            raise ValidationError(
                f"Cannot approve vendor with status '{vendor.status}'. Must be PENDING_REVIEW."
            )

        old_status = vendor.status
        vendor.status      = VendorStatus.APPROVED
        vendor.is_verified = True
        vendor.verified_at = timezone.now()
        vendor.verified_by = actor
        vendor.rejection_reason = ""   # Clear any previous rejection
        vendor.save(update_fields=[
            "status", "is_verified", "verified_at", "verified_by",
            "rejection_reason", "updated_at",
        ])

        # Auto-create VendorWallet
        wallet, created = VendorWallet.objects.get_or_create(vendor=vendor)
        if created:
            logger.info(f"VendorWallet auto-created for '{vendor.store_name}' on approval")

        # Queue Chapa subaccount provisioning (async, non-blocking, graceful fallback)
        if vendor.vendor_type != VendorType.PLATFORM:
            try:
                from apps.vendors.tasks import provision_chapa_subaccount
                provision_chapa_subaccount.delay(str(vendor.id))
            except Exception as e:
                logger.warning(
                    f"Celery/Chapa task could not be queued for vendor '{vendor.store_name}': {e}. "
                    "Use /admin/vendors/<id>/retry-chapa/ to retry manually."
                )

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role=actor.role,
            action=AuditLog.ActionType.VENDOR_KYC_APPROVED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={"old_status": old_status, "new_status": VendorStatus.APPROVED},
        )

        logger.info(f"KYC approved for '{vendor.store_name}' by {actor.email}")
        return vendor

    @staticmethod
    @transaction.atomic
    def reject_vendor(actor, vendor: VendorProfile, reason: str) -> VendorProfile:
        """
        Admin rejects KYC with a mandatory reason:
          - PENDING_REVIEW → REJECTED
        """
        if vendor.status != VendorStatus.PENDING_REVIEW:
            raise ValidationError(
                f"Cannot reject vendor with status '{vendor.status}'. Must be PENDING_REVIEW."
            )
        if not reason or not reason.strip():
            raise ValidationError("A rejection reason is required.")

        old_status = vendor.status
        vendor.status = VendorStatus.REJECTED
        vendor.rejection_reason = reason.strip()
        vendor.save(update_fields=["status", "rejection_reason", "updated_at"])

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role=actor.role,
            action=AuditLog.ActionType.VENDOR_KYC_REJECTED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={
                "old_status": old_status,
                "new_status": VendorStatus.REJECTED,
                "reason": reason.strip(),
            },
        )

        logger.info(f"KYC rejected for '{vendor.store_name}' by {actor.email}: {reason}")
        return vendor

    @staticmethod
    @transaction.atomic
    def suspend_vendor(actor, vendor: VendorProfile, reason: str) -> VendorProfile:
        """
        Admin suspends an active store with a mandatory reason:
          - APPROVED → SUSPENDED
          - Auto-locks VendorWallet (is_payout_locked=True)
        """
        if vendor.status != VendorStatus.APPROVED:
            raise ValidationError(
                f"Cannot suspend vendor with status '{vendor.status}'. Must be APPROVED."
            )
        if not reason or not reason.strip():
            raise ValidationError("A suspension reason is required.")

        old_status = vendor.status
        vendor.status = VendorStatus.SUSPENDED
        vendor.suspension_reason = reason.strip()
        vendor.save(update_fields=["status", "suspension_reason", "updated_at"])

        # Auto-lock wallet to prevent payout withdrawals
        if hasattr(vendor, "wallet"):
            WalletService.lock_wallet(vendor.wallet, f"Account suspended: {reason.strip()}")

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role=actor.role,
            action=AuditLog.ActionType.VENDOR_SUSPENDED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={
                "old_status": old_status,
                "new_status": VendorStatus.SUSPENDED,
                "reason": reason.strip(),
            },
        )

        logger.info(f"Vendor '{vendor.store_name}' SUSPENDED by {actor.email}: {reason}")
        return vendor

    @staticmethod
    @transaction.atomic
    def reactivate_vendor(actor, vendor: VendorProfile) -> VendorProfile:
        """
        Admin reactivates a suspended store:
          - SUSPENDED → APPROVED
          - Auto-unlocks VendorWallet
        """
        if vendor.status != VendorStatus.SUSPENDED:
            raise ValidationError(
                f"Cannot reactivate vendor with status '{vendor.status}'. Must be SUSPENDED."
            )

        old_status = vendor.status
        vendor.status = VendorStatus.APPROVED
        vendor.suspension_reason = ""
        vendor.save(update_fields=["status", "suspension_reason", "updated_at"])

        # Auto-unlock wallet
        if hasattr(vendor, "wallet"):
            WalletService.unlock_wallet(vendor.wallet)

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role=actor.role,
            action=AuditLog.ActionType.VENDOR_REACTIVATED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={"old_status": old_status, "new_status": VendorStatus.APPROVED},
        )

        logger.info(f"Vendor '{vendor.store_name}' REACTIVATED by {actor.email}")
        return vendor

    @staticmethod
    @transaction.atomic
    def update_commission_rate(actor, vendor: VendorProfile, new_rate: float) -> VendorProfile:
        """
        Super Admin ONLY: Adjusts vendor commission rate with audit log.
        """
        if not actor.is_superuser:
            raise PermissionDenied("Only Super Admins can adjust vendor commission rates.")

        if not (0 <= float(new_rate) <= 100):
            raise ValidationError("Commission rate must be between 0 and 100.")

        old_rate = vendor.commission_rate
        vendor.commission_rate = new_rate
        vendor.save(update_fields=["commission_rate", "updated_at"])

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role=actor.role,
            action=AuditLog.ActionType.VENDOR_COMMISSION_UPDATED,
            target_type="VendorProfile",
            target_id=str(vendor.id),
            target_repr=vendor.store_name,
            payload={"old_rate": str(old_rate), "new_rate": str(new_rate)},
        )

        logger.info(
            f"Commission rate for '{vendor.store_name}' updated: {old_rate}% → {new_rate}% by {actor.email}"
        )
        return vendor
