"""
apps/vendors/tests/test_escrow_settlement.py
===========================================
Unit tests for Phase 3 Multi-Party Escrow, Platform 15% VAT, and Settlement Logic:
  - calculate_settlement tax math (Tax-Inclusive Model)
  - credit_escrow dispatch event and ledger recording
  - settle_payout delivery release to available balance
  - request_withdrawal with Chapa 15.00 ETB transfer fee deduction
  - Safety guards: locked wallet, insufficient balance, sub-fee requests
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorWallet, VendorLedgerEntry
from apps.vendors.enums import VendorType, BusinessType
from apps.vendors.services.wallet_service import WalletService
from apps.catalog.models import Category, Product, ProductVariant
from apps.catalog.enums import ProductType, ProductStatus
from apps.orders.models import Order, VendorSubOrder, OrderItem, OrderPaymentStatus, OrderItemStatus


class EscrowSettlementTest(TestCase):
    def setUp(self):
        # Create seller user and vendor
        self.seller_user = CustomUser.objects.create_user(
            email="seller_escrow@test.com",
            password="TestPassword123!",
            first_name="Tadesse",
            last_name="Girma",
            role=CustomUser.Role.SELLER,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.seller_user,
            store_name="Tadesse Electronics",
            vendor_type=VendorType.THIRD_PARTY,
            business_type=BusinessType.PLC,
            tin_number="1234567890",
            vat_registered=True,
            vat_number="VAT-9876543210",
            commission_rate=Decimal("10.00"),
            is_verified=True,
        )
        self.wallet, _ = VendorWallet.objects.get_or_create(vendor=self.vendor)

        # Create buyer user
        self.buyer_user = CustomUser.objects.create_user(
            email="buyer_escrow@test.com",
            password="TestPassword123!",
            first_name="Almaz",
            last_name="Kebede",
            role=CustomUser.Role.CUSTOMER,
        )

        # Create category, product, and variant
        self.category = Category.add_root(
            name="Electronics",
            slug="electronics-escrow",
            commission_rate_override=Decimal("10.00"),
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title="Smart LED TV 55 Inch",
            slug="smart-led-tv-55-inch",
            short_description="Smart LED TV 55 Inch with 4K UHD",
            description="Smart LED TV 55 Inch with 4K UHD and HDR support",
            product_type=ProductType.SIMPLE,
            status=ProductStatus.ACTIVE,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="SKU-TV-001",
            price=Decimal("5000.00"),
            weight_kg=Decimal("8.5"),
        )

        # Create Order and VendorSubOrder
        self.order = Order.objects.create(
            order_number="ORD-TEST-001",
            customer=self.buyer_user,
            shipping_address={"city": "Addis Ababa", "phone": "0911000000"},
            total_amount=Decimal("5000.00"),
            payment_status=OrderPaymentStatus.PAID,
        )
        self.sub_order = VendorSubOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            sub_total=Decimal("5000.00"),
        )
        self.order_item = OrderItem.objects.create(
            vendor_sub_order=self.sub_order,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal("5000.00"),
            status=OrderItemStatus.PROCESSING,
        )

    def test_calculate_settlement_vat_registered_math(self):
        """
        VAT-registered seller, 5,000.00 ETB retail price, 10% platform fee.

        Expected (Proclamation No. 1341/2024, Option A - gross retail base):
          Platform Fee (10%):       500.00 ETB
          Seller Net Credit:       4,500.00 ETB
          Seller Product VAT Advisory:
            5,000.00 - (5,000.00 / 1.15) = 5,000.00 - 4,347.83 = 652.17 ETB
        """
        settlement = WalletService.calculate_settlement(
            gross_amount=Decimal("5000.00"),
            commission_rate=Decimal("10.00"),
            is_vat_registered=True,
        )

        self.assertEqual(settlement["gross_amount"], Decimal("5000.00"))
        self.assertEqual(settlement["commission_rate"], Decimal("10.00"))
        self.assertEqual(settlement["gross_commission"], Decimal("500.00"))
        self.assertEqual(settlement["platform_net_revenue"], Decimal("0.00"))  # Platform not VAT-registered
        self.assertEqual(settlement["platform_vat"], Decimal("0.00"))          # Platform not VAT-registered
        self.assertEqual(settlement["seller_credit"], Decimal("4500.00"))
        self.assertEqual(settlement["seller_vat_advisory"], Decimal("652.17"))

    def test_calculate_settlement_non_vat_math(self):
        """
        Non-VAT / TOT seller should have seller_vat_advisory == 0.00.
        """
        settlement = WalletService.calculate_settlement(
            gross_amount=Decimal("5000.00"),
            commission_rate=Decimal("10.00"),
            is_vat_registered=False,
        )
        self.assertEqual(settlement["gross_commission"], Decimal("500.00"))
        self.assertEqual(settlement["seller_credit"], Decimal("4500.00"))
        self.assertEqual(settlement["seller_vat_advisory"], Decimal("0.00"))
        self.assertEqual(settlement["platform_net_revenue"], Decimal("0.00"))
        self.assertEqual(settlement["platform_vat"], Decimal("0.00"))

    def test_credit_escrow_on_dispatch(self):
        """When seller dispatches, pending_balance is credited 4,500.00 ETB with complete ledger entry."""
        wallet = WalletService.credit_escrow(self.sub_order)

        self.assertEqual(wallet.pending_balance, Decimal("4500.00"))
        self.assertEqual(wallet.available_balance, Decimal("0.00"))

        entry = VendorLedgerEntry.objects.filter(
            sub_order=self.sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT,
        ).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.amount, Decimal("5000.00"))
        self.assertEqual(entry.commission_rate, Decimal("10.00"))
        self.assertEqual(entry.commission_deducted, Decimal("500.00"))
        # Platform is not VAT-registered — these must always be zero
        self.assertEqual(entry.platform_net_revenue, Decimal("0.00"))
        self.assertEqual(entry.platform_vat_amount, Decimal("0.00"))
        # Vendor is VAT-registered: advisory on full gross (5,000 - 5,000/1.15 = 652.17)
        self.assertEqual(entry.seller_vat_advisory, Decimal("652.17"))
        self.assertTrue(entry.is_vat_registered_vendor)
        self.assertEqual(entry.net_amount, Decimal("4500.00"))

    def test_settle_payout_after_delivery(self):
        """After delivery inspection clearance, funds move from pending to available."""
        # 1. Credit escrow first
        WalletService.credit_escrow(self.sub_order)

        # 2. Settle payout
        wallet = WalletService.settle_payout(self.sub_order)

        self.assertEqual(wallet.pending_balance, Decimal("0.00"))
        self.assertEqual(wallet.available_balance, Decimal("4500.00"))

        # Verify ESCROW_RELEASE entry
        release_entry = VendorLedgerEntry.objects.filter(
            sub_order=self.sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_RELEASE,
        ).first()
        self.assertIsNotNone(release_entry)
        self.assertEqual(release_entry.net_amount, Decimal("4500.00"))

    def test_request_withdrawal_deducts_chapa_transfer_fee(self):
        """
        Seller requests withdrawal of 4,500.00 ETB:
          Chapa transfer fee: 15.00 ETB
          Net disbursed to bank/Telebirr: 4,485.00 ETB
        """
        # Give wallet 4,500.00 ETB available balance
        self.wallet.available_balance = Decimal("4500.00")
        self.wallet.save()

        result = WalletService.request_withdrawal(
            vendor=self.vendor,
            requested_amount=Decimal("4500.00"),
        )

        self.assertEqual(result["requested_amount"], "4500.00")
        self.assertEqual(result["transfer_fee"], "15.00")
        self.assertEqual(result["disbursed_amount"], "4485.00")
        self.assertEqual(result["new_available_balance"], "0.00")

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.available_balance, Decimal("0.00"))
        self.assertEqual(self.wallet.total_withdrawn, Decimal("4500.00"))

        # Check WITHDRAWAL ledger entry
        withdrawal_entry = VendorLedgerEntry.objects.filter(
            wallet=self.wallet,
            entry_type=VendorLedgerEntry.EntryType.WITHDRAWAL,
        ).first()
        self.assertIsNotNone(withdrawal_entry)
        self.assertEqual(withdrawal_entry.amount, Decimal("4500.00"))
        self.assertEqual(withdrawal_entry.commission_deducted, Decimal("15.00"))
        self.assertEqual(withdrawal_entry.net_amount, Decimal("4485.00"))

    def test_withdrawal_fails_if_insufficient_funds(self):
        self.wallet.available_balance = Decimal("1000.00")
        self.wallet.save()

        with self.assertRaises(ValidationError):
            WalletService.request_withdrawal(
                vendor=self.vendor,
                requested_amount=Decimal("2000.00"),
            )

    def test_withdrawal_fails_if_less_than_transfer_fee(self):
        self.wallet.available_balance = Decimal("100.00")
        self.wallet.save()

        with self.assertRaises(ValidationError):
            WalletService.request_withdrawal(
                vendor=self.vendor,
                requested_amount=Decimal("10.00"),  # Below 15.00 ETB
            )

    def test_withdrawal_fails_if_wallet_is_locked(self):
        self.wallet.available_balance = Decimal("5000.00")
        self.wallet.is_payout_locked = True
        self.wallet.lock_reason = "Suspicious KYC anomaly"
        self.wallet.save()

        with self.assertRaises(ValidationError):
            WalletService.request_withdrawal(
                vendor=self.vendor,
                requested_amount=Decimal("1000.00"),
            )
