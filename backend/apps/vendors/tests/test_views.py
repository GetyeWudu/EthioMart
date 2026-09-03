"""
apps/vendors/tests/test_views.py
==================================
Integration tests for vendor API views:
  - Seller KYC submission → status becomes PENDING_REVIEW
  - Admin approval → store visible on public endpoint
  - Unapproved vendor → 404 on public endpoint
  - Wallet endpoint returns correct balance snapshot
  - Permission checks (seller can't access admin endpoints)
"""

from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorBankDetails, KYCDocument
from apps.vendors.enums import VendorStatus, BusinessType, DocumentType


def create_user(email, role="SELLER", **kwargs):
    return CustomUser.objects.create_user(
        email=email,
        password="TestPass123!",
        first_name="Test",
        last_name="User",
        role=role,
        **kwargs,
    )


def create_vendor(user, store_name, status=VendorStatus.APPROVED, **kwargs):
    return VendorProfile.objects.create(
        user=user,
        store_name=store_name,
        status=status,
        is_verified=(status == VendorStatus.APPROVED),
        tin_number="1234567890",
        **kwargs,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


class SellerProfileViewTest(APITestCase):
    def setUp(self):
        self.seller = create_user("seller@views.com")
        self.client = auth_client(self.seller)

    def test_get_creates_draft_profile(self):
        response = self.client.get("/api/v1/vendors/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("store_name", response.data)
        self.assertEqual(response.data["status"], VendorStatus.DRAFT)

    def test_patch_updates_store_name(self):
        self.client.get("/api/v1/vendors/me/")   # Ensure profile created
        response = self.client.patch(
            "/api/v1/vendors/me/",
            {"store_name": "My Updated Shop"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["store_name"], "My Updated Shop")


class SellerKYCSubmitViewTest(APITestCase):
    def setUp(self):
        self.seller = create_user("kyc_seller@views.com")
        self.client = auth_client(self.seller)

        # Ensure a draft vendor profile exists via the API
        self.client.get("/api/v1/vendors/me/")
        self.vendor = self.seller.vendor_profile

        # Populate TIN (required for submit_for_review)
        self.vendor.tin_number = "1234567890"
        self.vendor.save(update_fields=["tin_number"])

        # Add bank details
        VendorBankDetails.objects.create(
            vendor=self.vendor,
            bank_code="32",
            bank_name="CBE",
            account_number="1000123456789",
            account_name="Test Seller",
        )
        # Add required docs (TIN + FAYDA — individual seller defaults)
        self._add_doc(DocumentType.TIN_CERTIFICATE)
        self._add_doc(DocumentType.FAYDA_ID)

    def _add_doc(self, doc_type):
        KYCDocument.objects.create(
            vendor=self.vendor,
            document_type=doc_type,
            file=SimpleUploadedFile("test.pdf", b"content", content_type="application/pdf"),
        )

    def test_kyc_submit_returns_pending_review(self):
        response = self.client.post("/api/v1/vendors/me/kyc/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], VendorStatus.PENDING_REVIEW)

    def test_anonymous_cannot_submit_kyc(self):
        client = APIClient()
        response = client.post("/api/v1/vendors/me/kyc/", {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SellerWalletViewTest(APITestCase):
    def setUp(self):
        self.seller = create_user("wallet_seller@views.com")
        self.client = auth_client(self.seller)
        self.client.get("/api/v1/vendors/me/")   # Create profile

    def test_wallet_returns_balance_snapshot(self):
        response = self.client.get("/api/v1/vendors/me/wallet/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("available_balance", response.data)
        self.assertIn("pending_balance", response.data)
        self.assertIn("is_payout_locked", response.data)


class PublicStoreViewTest(APITestCase):
    def setUp(self):
        self.seller = create_user("pub@views.com")
        self.vendor = create_vendor(self.seller, "Public Store")

    def test_approved_store_visible_on_public_list(self):
        response = self.client.get("/api/v1/vendors/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s["store_name"] for s in response.data["results"]]
        self.assertIn("Public Store", names)

    def test_approved_store_visible_on_public_detail(self):
        response = self.client.get(f"/api/v1/vendors/{self.vendor.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["store_name"], "Public Store")

    def test_draft_store_returns_404_on_public_detail(self):
        draft_seller = create_user("draft_pub@views.com")
        draft_vendor = create_vendor(draft_seller, "Draft Store", status=VendorStatus.DRAFT)
        response = self.client.get(f"/api/v1/vendors/{draft_vendor.slug}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_suspended_store_returns_404_on_public_detail(self):
        sus_seller = create_user("sus_pub@views.com")
        sus_vendor = create_vendor(sus_seller, "Suspended Store", status=VendorStatus.SUSPENDED)
        response = self.client.get(f"/api/v1/vendors/{sus_vendor.slug}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_list_search_filter(self):
        create_vendor(create_user("other@views.com"), "Other Store")
        response = self.client.get("/api/v1/vendors/?search=Public")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for store in response.data["results"]:
            self.assertIn("Public", store["store_name"])


class AdminVendorListViewTest(APITestCase):
    def setUp(self):
        self.admin = create_user("admin@views.com", role="ADMIN")
        self.seller = create_user("admin_seller@views.com")
        self.vendor = create_vendor(self.seller, "Admin Test Store", status=VendorStatus.PENDING_REVIEW)
        self.client = auth_client(self.admin)

    def test_admin_can_list_vendors(self):
        response = self.client.get("/api/v1/admin/vendors/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_seller_cannot_access_admin_list(self):
        seller_client = auth_client(self.seller)
        response = seller_client.get("/api/v1/admin/vendors/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class AdminVendorApproveViewTest(APITestCase):
    def setUp(self):
        self.admin = create_user("approve_admin@views.com", role="ADMIN")
        self.seller = create_user("to_approve@views.com")
        self.vendor = create_vendor(self.seller, "Pending Approval Store", status=VendorStatus.PENDING_REVIEW)
        self.client = auth_client(self.admin)

    @patch("apps.vendors.tasks.provision_chapa_subaccount.delay")
    def test_admin_approve_changes_status(self, mock_task):
        response = self.client.post(f"/api/v1/admin/vendors/{self.vendor.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], VendorStatus.APPROVED)
        self.assertTrue(response.data["is_verified"])


class AdminVendorRejectViewTest(APITestCase):
    def setUp(self):
        self.admin = create_user("reject_admin@views.com", role="ADMIN")
        self.seller = create_user("to_reject@views.com")
        self.vendor = create_vendor(self.seller, "Pending Reject Store", status=VendorStatus.PENDING_REVIEW)
        self.client = auth_client(self.admin)

    def test_reject_without_reason_fails(self):
        response = self.client.post(
            f"/api/v1/admin/vendors/{self.vendor.id}/reject/",
            {"reason": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_with_valid_reason_succeeds(self):
        response = self.client.post(
            f"/api/v1/admin/vendors/{self.vendor.id}/reject/",
            {"reason": "Document is expired or illegible."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], VendorStatus.REJECTED)


class AdminVendorCommissionViewTest(APITestCase):
    def setUp(self):
        self.super_admin = create_user("super@views.com", role="ADMIN", is_superuser=True)
        self.regular_admin = create_user("regular@views.com", role="ADMIN")
        self.seller = create_user("com_seller@views.com")
        self.vendor = create_vendor(self.seller, "Commission Test Store")

    def test_superadmin_can_update_commission(self):
        client = auth_client(self.super_admin)
        response = client.patch(
            f"/api/v1/admin/vendors/{self.vendor.id}/commission/",
            {"commission_rate": "7.50"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["commission_rate"], "7.50")

    def test_regular_admin_cannot_update_commission(self):
        client = auth_client(self.regular_admin)
        response = client.patch(
            f"/api/v1/admin/vendors/{self.vendor.id}/commission/",
            {"commission_rate": "5.00"},
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN])
