"""
backend/apps/disputes/tests/test_dispute_lifecycle.py
=====================================================
Comprehensive tests for 4-state dispute resolution, 48h inspection window,
double-entry wallet accounting, and Chapa refund triggers.
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorWallet, VendorLedgerEntry
from apps.vendors.enums import VendorStatus
from apps.orders.models import Order, VendorSubOrder, OrderItem, OrderPaymentStatus
from apps.catalog.models import Product, ProductVariant, Category
from apps.catalog.enums import ProductStatus
from apps.disputes.models import Dispute


class DisputeLifecycleTests(APITestCase):
    def setUp(self):
        # 1. Users
        self.customer = CustomUser.objects.create_user(
            email="dispute.buyer@gechexpress.com",
            password="Password123!",
            first_name="Abebe",
            last_name="Buyer"
        )
        self.seller_user = CustomUser.objects.create_user(
            email="dispute.seller@gechexpress.com",
            password="Password123!",
            first_name="Tadesse",
            last_name="Seller",
            role=CustomUser.Role.SELLER
        )
        self.admin_user = CustomUser.objects.create_superuser(
            email="dispute.admin@gechexpress.com",
            password="AdminPassword123!",
            first_name="Super",
            last_name="Admin"
        )

        # 2. Vendor Profile & Wallet
        self.vendor = VendorProfile.objects.create(
            user=self.seller_user,
            store_name="Tadesse Electronics",
            slug="tadesse-electronics",
            tin_number="1234567890",
            commission_rate=Decimal("10.00"),
            status=VendorStatus.APPROVED
        )
        self.wallet = VendorWallet.objects.create(
            vendor=self.vendor,
            pending_balance=Decimal("0.00"),
            available_balance=Decimal("0.00")
        )

        # 3. Catalog
        self.category = Category.add_root(name="Electronics", slug="electronics")
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title="Wireless Noise Cancelling Headphones",
            slug="wireless-noise-cancelling-headphones",
            short_description="High quality headphones",
            description="Premium active noise cancelling over-ear headphones.",
            status=ProductStatus.ACTIVE
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="WH-1000XM4-BLK",
            price=Decimal("5000.00")
        )

        # 4. Order & SubOrder
        self.order = Order.objects.create(
            order_number="ORD-DISP-9901",
            transaction_reference="CHASECK_TEST-9901",
            customer=self.customer,
            total_amount=Decimal("5000.00"),
            payment_status=OrderPaymentStatus.PAID
        )
        self.sub_order = VendorSubOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            sub_total=Decimal("5000.00"),
            shipping_fee=Decimal("0.00"),
            delivered_at=timezone.now() - timedelta(minutes=2)
        )
        self.order_item = OrderItem.objects.create(
            vendor_sub_order=self.sub_order,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal("5000.00"),
            status="DELIVERED"
        )

        from apps.vendors.services import WalletService
        WalletService.credit_escrow(self.sub_order)
        self.wallet.refresh_from_db()

    def test_customer_can_open_dispute_within_inspection_window(self):
        self.client.force_authenticate(user=self.customer)
        url = f"/api/v1/orders/{self.sub_order.id}/dispute/"
        payload = {
            "reason": "DEFECTIVE",
            "customer_notes": "Left speaker produces static sound.",
            "evidence_images": ["https://cdn.gechexpress.com/evidence1.jpg"]
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Dispute.Status.UNDER_REVIEW)

        # Verify sub_order is marked disputed
        self.sub_order.refresh_from_db()
        self.assertTrue(self.sub_order.is_disputed)

    def test_customer_cannot_open_dispute_after_inspection_window(self):
        # Move delivered_at past 5 minutes
        self.sub_order.delivered_at = timezone.now() - timedelta(minutes=10)
        self.sub_order.save(update_fields=['delivered_at'])

        self.client.force_authenticate(user=self.customer)
        url = f"/api/v1/orders/{self.sub_order.id}/dispute/"
        payload = {
            "reason": "DEFECTIVE",
            "customer_notes": "Late claim."
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reentry_guard_prevents_duplicate_disputes(self):
        self.client.force_authenticate(user=self.customer)
        url = f"/api/v1/orders/{self.sub_order.id}/dispute/"
        payload = {
            "reason": "DEFECTIVE",
            "customer_notes": "Initial claim."
        }
        resp1 = self.client.post(url, payload, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Second attempt must be rejected
        resp2 = self.client.post(url, payload, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seller_can_1_click_accept_return_and_refund(self):
        # Open dispute
        dispute = Dispute.objects.create(
            sub_order=self.sub_order,
            customer=self.customer,
            vendor=self.vendor,
            reason=Dispute.Reason.WRONG_ITEM,
            customer_notes="Wrong color delivered.",
            disputed_amount=Decimal("5000.00"),
            status=Dispute.Status.UNDER_REVIEW
        )
        self.sub_order.is_disputed = True
        self.sub_order.save()

        self.client.force_authenticate(user=self.seller_user)
        url = f"/api/v1/seller/disputes/{dispute.id}/accept/"
        response = self.client.post(url, {"notes": "Customer is correct, refunding."}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # Check dispute state
        dispute.refresh_from_db()
        self.assertEqual(dispute.status, Dispute.Status.REFUNDED)

        # Check vendor wallet pending balance deducted
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.pending_balance, Decimal("0.00"))

        # Check ledger entry created
        ledger = VendorLedgerEntry.objects.filter(wallet=self.wallet, entry_type=VendorLedgerEntry.EntryType.ESCROW_REFUND).first()
        self.assertIsNotNone(ledger)
        self.assertEqual(ledger.net_amount, Decimal("-4500.00"))

        # Verify sub_order is_payout_settled is True
        self.sub_order.refresh_from_db()
        self.assertTrue(self.sub_order.is_payout_settled)
        self.assertFalse(self.sub_order.is_disputed)

    def test_admin_can_reject_dispute_and_release_escrow(self):
        dispute = Dispute.objects.create(
            sub_order=self.sub_order,
            customer=self.customer,
            vendor=self.vendor,
            reason=Dispute.Reason.COUNTERFEIT,
            customer_notes="Item is unsealed.",
            disputed_amount=Decimal("5000.00"),
            status=Dispute.Status.UNDER_REVIEW
        )
        self.sub_order.is_disputed = True
        self.sub_order.save()

        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/admin/disputes/{dispute.id}/resolve/"
        response = self.client.post(url, {"action": "REJECT_CLAIM", "admin_notes": "Serial verified original."}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        dispute.refresh_from_db()
        self.assertEqual(dispute.status, Dispute.Status.REJECTED)

        # Verify wallet: pending balance zeroed, available balance credited (5000 - 10% commission = 4500)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.pending_balance, Decimal("0.00"))
        self.assertEqual(self.wallet.available_balance, Decimal("4500.00"))

        # Verify sub_order is_payout_settled is True
        self.sub_order.refresh_from_db()
        self.assertTrue(self.sub_order.is_payout_settled)
        self.assertFalse(self.sub_order.is_disputed)
