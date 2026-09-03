"""
apps/vendors/tests/test_services.py
=====================================
Service layer tests: KYC state transitions, wallet locking, commission auth.
"""

from unittest.mock import patch
from django.test import TestCase
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorWallet, KYCDocument, VendorBankDetails
from apps.vendors.enums import VendorStatus, BusinessType, DocumentType
from apps.vendors.services import KYCVerificationService, WalletService


def make_user(email, role="SELLER", is_superuser=False):
    user = CustomUser.objects.create_user(
        email=email,
        password="TestPass123!",
        first_name="Test",
        last_name="User",
        role=role,
    )
    if is_superuser:
        user.is_superuser = True
        user.save()
    return user


def make_vendor_with_requirements(user, store_name, business_type=BusinessType.INDIVIDUAL):
    vendor = VendorProfile.objects.create(
        user=user,
        store_name=store_name,
        tin_number="1234567890",
        business_type=business_type,
    )
    VendorBankDetails.objects.create(
        vendor=vendor,
        bank_code="32",
        bank_name="Commercial Bank of Ethiopia",
        account_number="1000123456789",
        account_name="Test Seller",
    )
    return vendor


def add_document(vendor, doc_type):
    from django.core.files.uploadedfile import SimpleUploadedFile
    return KYCDocument.objects.create(
        vendor=vendor,
        document_type=doc_type,
        file=SimpleUploadedFile(f"test_{doc_type}.pdf", b"PDF content", content_type="application/pdf"),
    )


class KYCSubmitForReviewTest(TestCase):
    def test_individual_can_submit_with_tin_and_fayda(self):
        user = make_user("submit_individual@test.com")
        vendor = make_vendor_with_requirements(user, "Indie Store")
        add_document(vendor, DocumentType.TIN_CERTIFICATE)
        add_document(vendor, DocumentType.FAYDA_ID)

        result = KYCVerificationService.submit_for_review(vendor, {})
        self.assertEqual(result.status, VendorStatus.PENDING_REVIEW)

    def test_individual_can_submit_with_tin_and_passport(self):
        user = make_user("submit_pass@test.com")
        vendor = make_vendor_with_requirements(user, "Indie Store 2")
        add_document(vendor, DocumentType.TIN_CERTIFICATE)
        add_document(vendor, DocumentType.PASSPORT_OR_KEBELE)

        result = KYCVerificationService.submit_for_review(vendor, {})
        self.assertEqual(result.status, VendorStatus.PENDING_REVIEW)

    def test_corporate_can_submit_with_tin_and_trade_license(self):
        user = make_user("submit_corp@test.com")
        vendor = make_vendor_with_requirements(user, "Corp Store", business_type=BusinessType.PLC)
        add_document(vendor, DocumentType.TIN_CERTIFICATE)
        add_document(vendor, DocumentType.TRADE_LICENSE)

        result = KYCVerificationService.submit_for_review(vendor, {})
        self.assertEqual(result.status, VendorStatus.PENDING_REVIEW)

    def test_fails_without_tin_document(self):
        user = make_user("notin@test.com")
        vendor = make_vendor_with_requirements(user, "No TIN Store")
        add_document(vendor, DocumentType.FAYDA_ID)   # No TIN

        with self.assertRaises(ValidationError) as ctx:
            KYCVerificationService.submit_for_review(vendor, {})
        self.assertIn("TIN Certificate", str(ctx.exception))

    def test_fails_without_id_document_for_individual(self):
        user = make_user("noid@test.com")
        vendor = make_vendor_with_requirements(user, "No ID Store")
        add_document(vendor, DocumentType.TIN_CERTIFICATE)   # No FAYDA/PASSPORT

        with self.assertRaises(ValidationError):
            KYCVerificationService.submit_for_review(vendor, {})

    def test_fails_without_trade_license_for_corporate(self):
        user = make_user("notrade@test.com")
        vendor = make_vendor_with_requirements(user, "No Trade Store", business_type=BusinessType.PLC)
        add_document(vendor, DocumentType.TIN_CERTIFICATE)

        with self.assertRaises(ValidationError) as ctx:
            KYCVerificationService.submit_for_review(vendor, {})
        self.assertIn("Trade License", str(ctx.exception))

    def test_vat_registered_vendor_requires_vat_certificate_and_vat_number(self):
        user = make_user("vat_test@test.com")
        vendor = make_vendor_with_requirements(user, "VAT Store", business_type=BusinessType.PLC)
        vendor.vat_registered = True
        vendor.save()
        add_document(vendor, DocumentType.TIN_CERTIFICATE)
        add_document(vendor, DocumentType.TRADE_LICENSE)

        # Fails without VAT number
        with self.assertRaises(ValidationError) as ctx:
            KYCVerificationService.submit_for_review(vendor, {})
        self.assertIn("VAT Registration Number", str(ctx.exception))

        # Fails without VAT certificate document
        vendor.vat_number = "VAT-9988776655"
        vendor.save()
        with self.assertRaises(ValidationError) as ctx:
            KYCVerificationService.submit_for_review(vendor, {})
        self.assertIn("VAT Registration Certificate", str(ctx.exception))

        # Succeeds when VAT certificate is uploaded
        add_document(vendor, DocumentType.VAT_CERTIFICATE)
        result = KYCVerificationService.submit_for_review(vendor, {})
        self.assertEqual(result.status, VendorStatus.PENDING_REVIEW)

    def test_cannot_submit_from_approved_status(self):
        user = make_user("approved@test.com")
        vendor = make_vendor_with_requirements(user, "Already Approved")
        vendor.status = VendorStatus.APPROVED
        vendor.save()

        with self.assertRaises(ValidationError):
            KYCVerificationService.submit_for_review(vendor, {})


class KYCApproveTest(TestCase):
    def _get_pending_vendor(self, email, store_name):
        user = make_user(email)
        admin = make_user(f"admin_{email}", role="ADMIN")
        vendor = make_vendor_with_requirements(user, store_name)
        vendor.status = VendorStatus.PENDING_REVIEW
        vendor.save()
        return vendor, admin

    @patch("apps.vendors.tasks.provision_chapa_subaccount.delay")
    def test_approve_creates_wallet(self, mock_task):
        vendor, admin = self._get_pending_vendor("approve@test.com", "Approved Store")
        result = KYCVerificationService.approve_vendor(admin, vendor)

        self.assertEqual(result.status, VendorStatus.APPROVED)
        self.assertTrue(result.is_verified)
        self.assertIsNotNone(result.verified_at)
        self.assertTrue(VendorWallet.objects.filter(vendor=result).exists())

    @patch("apps.vendors.tasks.provision_chapa_subaccount.delay")
    def test_approve_queues_chapa_task(self, mock_task):
        vendor, admin = self._get_pending_vendor("chapa@test.com", "Chapa Store")
        KYCVerificationService.approve_vendor(admin, vendor)
        mock_task.assert_called_once_with(str(vendor.id))

    def test_cannot_approve_draft_vendor(self):
        user = make_user("draft_approve@test.com")
        admin = make_user("draft_admin@test.com", role="ADMIN")
        vendor = make_vendor_with_requirements(user, "Draft Vendor")
        # vendor is DRAFT by default

        with self.assertRaises(ValidationError):
            KYCVerificationService.approve_vendor(admin, vendor)


class KYCRejectTest(TestCase):
    def test_reject_requires_reason(self):
        user = make_user("reject@test.com")
        admin = make_user("reject_admin@test.com", role="ADMIN")
        vendor = make_vendor_with_requirements(user, "Reject Store")
        vendor.status = VendorStatus.PENDING_REVIEW
        vendor.save()

        with self.assertRaises(ValidationError):
            KYCVerificationService.reject_vendor(admin, vendor, reason="")

    def test_reject_transitions_to_rejected(self):
        user = make_user("reject2@test.com")
        admin = make_user("reject_admin2@test.com", role="ADMIN")
        vendor = make_vendor_with_requirements(user, "Reject Store 2")
        vendor.status = VendorStatus.PENDING_REVIEW
        vendor.save()

        result = KYCVerificationService.reject_vendor(admin, vendor, reason="Expired trade license uploaded.")
        self.assertEqual(result.status, VendorStatus.REJECTED)
        self.assertEqual(result.rejection_reason, "Expired trade license uploaded.")


class SuspendReactivateTest(TestCase):
    @patch("apps.vendors.tasks.provision_chapa_subaccount.delay")
    def _setup_approved_vendor(self, mock_task):
        user = make_user("susp@test.com")
        admin = make_user("susp_admin@test.com", role="ADMIN")
        vendor = make_vendor_with_requirements(user, "Suspendable Store")
        vendor.status = VendorStatus.PENDING_REVIEW
        vendor.save()
        KYCVerificationService.approve_vendor(admin, vendor)
        vendor.refresh_from_db()
        return vendor, admin

    def test_suspension_locks_wallet(self):
        vendor, admin = self._setup_approved_vendor()
        result = KYCVerificationService.suspend_vendor(admin, vendor, reason="Repeated policy violations.")

        self.assertEqual(result.status, VendorStatus.SUSPENDED)
        result.wallet.refresh_from_db()
        self.assertTrue(result.wallet.is_payout_locked)

    def test_suspend_requires_reason(self):
        vendor, admin = self._setup_approved_vendor()
        with self.assertRaises(ValidationError):
            KYCVerificationService.suspend_vendor(admin, vendor, reason="")

    def test_reactivation_unlocks_wallet(self):
        vendor, admin = self._setup_approved_vendor()
        KYCVerificationService.suspend_vendor(admin, vendor, reason="Testing suspension.")
        vendor.refresh_from_db()

        result = KYCVerificationService.reactivate_vendor(admin, vendor)
        self.assertEqual(result.status, VendorStatus.APPROVED)
        result.wallet.refresh_from_db()
        self.assertFalse(result.wallet.is_payout_locked)


class CommissionRateTest(TestCase):
    def test_superadmin_can_update_commission(self):
        user = make_user("comm@test.com")
        super_admin = make_user("superadmin@test.com", role="ADMIN", is_superuser=True)
        vendor = make_vendor_with_requirements(user, "Commission Store")

        result = KYCVerificationService.update_commission_rate(super_admin, vendor, 7.50)
        self.assertEqual(float(result.commission_rate), 7.50)

    def test_non_superadmin_cannot_update_commission(self):
        user = make_user("comm2@test.com")
        admin = make_user("regular_admin@test.com", role="ADMIN")
        vendor = make_vendor_with_requirements(user, "Commission Store 2")

        with self.assertRaises(PermissionDenied):
            KYCVerificationService.update_commission_rate(admin, vendor, 7.50)

    def test_commission_rate_out_of_range(self):
        user = make_user("comm3@test.com")
        super_admin = make_user("superadmin2@test.com", role="ADMIN", is_superuser=True)
        vendor = make_vendor_with_requirements(user, "Commission Store 3")

        with self.assertRaises(ValidationError):
            KYCVerificationService.update_commission_rate(super_admin, vendor, 150)


class WalletServiceTest(TestCase):
    def test_lock_and_unlock_wallet(self):
        user = make_user("wallets@test.com")
        vendor = make_vendor_with_requirements(user, "Wallet Test Store")
        wallet = WalletService.get_or_create_wallet(vendor)

        WalletService.lock_wallet(wallet, "Dispute active")
        wallet.refresh_from_db()
        self.assertTrue(wallet.is_payout_locked)

        WalletService.unlock_wallet(wallet)
        wallet.refresh_from_db()
        self.assertFalse(wallet.is_payout_locked)
        self.assertEqual(wallet.lock_reason, "")

    def test_get_balance_summary_returns_dict(self):
        user = make_user("balance@test.com")
        vendor = make_vendor_with_requirements(user, "Balance Store")
        summary = WalletService.get_balance_summary(vendor)

        self.assertIn("available_balance", summary)
        self.assertIn("pending_balance", summary)
        self.assertIn("total_withdrawn", summary)
        self.assertIn("is_payout_locked", summary)
