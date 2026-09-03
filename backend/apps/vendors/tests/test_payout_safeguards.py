"""
apps/vendors/tests/test_payout_safeguards.py
============================================
Comprehensive tests for seller withdrawal business rules, Redis locking,
and Two-Phase Wallet Mutation State Machine.
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.users.models import CustomUser
from apps.vendors.models import (
    VendorProfile,
    VendorWallet,
    VendorBankDetails,
    PayoutRequest,
    VendorLedgerEntry,
)
from apps.vendors.enums import VendorStatus, BusinessType
from apps.vendors.services.withdrawal_validation_service import WithdrawalValidationService
from apps.vendors.services.wallet_service import WalletService


class PayoutSafeguardsTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="seller_payout@gechexpress.com",
            password="StrongPassword123!",
            first_name="Almaz",
            last_name="Ayana",
            role="SELLER",
        )
        self.vendor = VendorProfile.objects.create(
            user=self.user,
            store_name="Ayana Athletics",
            business_type=BusinessType.PLC,
            status=VendorStatus.APPROVED,
            is_verified=True,
            tin_number="0012345678",
            vat_registered=True,
            vat_number="VAT-987654",
        )
        self.wallet = VendorWallet.objects.create(
            vendor=self.vendor,
            available_balance=Decimal("10000.00"),
            pending_balance=Decimal("0.00"),
            locked_payout_balance=Decimal("0.00"),
            total_withdrawn=Decimal("0.00"),
        )
        self.bank_details = VendorBankDetails.objects.create(
            vendor=self.vendor,
            bank_code="85",
            bank_name="Dashen Bank",
            account_number="100098765432",
            account_name="Ayana Athletics PLC",
        )

    def test_rejects_below_minimum_amount(self):
        """Withdrawals below 500.00 ETB must be rejected."""
        with self.assertRaises(ValidationError) as ctx:
            WithdrawalValidationService.validate_request(
                vendor=self.vendor,
                requested_amount=Decimal("450.00"),
                bank_code="85",
            )
        self.assertIn("minimum withdrawal amount is 500.00 ETB", str(ctx.exception))

    def test_rejects_unverified_kyc_vendor(self):
        """Merchants without approved KYC cannot withdraw funds."""
        self.vendor.is_verified = False
        self.vendor.save()

        with self.assertRaises(ValidationError) as ctx:
            WithdrawalValidationService.validate_request(
                vendor=self.vendor,
                requested_amount=Decimal("1000.00"),
                bank_code="85",
            )
        self.assertIn("KYC tax profile must be verified", str(ctx.exception))

    def test_rejects_locked_wallet(self):
        """Wallets with active dispute/fraud locks cannot request payouts."""
        self.wallet.is_payout_locked = True
        self.wallet.lock_reason = "Under compliance audit"
        self.wallet.save()

        with self.assertRaises(ValidationError) as ctx:
            WithdrawalValidationService.validate_request(
                vendor=self.vendor,
                requested_amount=Decimal("1000.00"),
                bank_code="85",
            )
        self.assertIn("Payouts are currently locked", str(ctx.exception))

    def test_rejects_in_flight_pending_payout(self):
        """A seller cannot initiate a new payout while an existing one is PENDING or PROCESSING."""
        PayoutRequest.objects.create(
            vendor=self.vendor,
            requested_amount=Decimal("2000.00"),
            transfer_fee=Decimal("15.00"),
            disbursed_amount=Decimal("1985.00"),
            bank_code="85",
            bank_name="Dashen Bank",
            account_number="100098765432",
            account_name="Ayana Athletics PLC",
            transfer_reference="TRF-EXISTING-001",
            status=PayoutRequest.Status.PROCESSING,
        )

        with self.assertRaises(ValidationError) as ctx:
            WithdrawalValidationService.validate_request(
                vendor=self.vendor,
                requested_amount=Decimal("1000.00"),
                bank_code="85",
            )
        self.assertIn("already have an active payout in progress", str(ctx.exception))

    def test_rejects_rail_limit_exceeded(self):
        """Telebirr transfers above 75,000 ETB rail limit must be rejected."""
        with self.assertRaises(ValidationError) as ctx:
            WithdrawalValidationService.validate_request(
                vendor=self.vendor,
                requested_amount=Decimal("80000.00"),
                bank_code="telebirr",
            )
        self.assertIn("Maximum withdrawal limit for telebirr is 75000.00 ETB", str(ctx.exception))

    def test_two_phase_withdrawal_success_flow(self):
        """
        Two-Phase State Machine:
          Phase 1: DB holds 5,000 ETB in locked_payout_balance, available_balance decreases.
          Phase 2: Chapa Transfer API succeeds → marks COMPLETED, clears locked hold, creates WITHDRAWAL ledger.
        """
        initial_available = self.wallet.available_balance

        result = WalletService.request_withdrawal(
            vendor=self.vendor,
            requested_amount=Decimal("5000.00"),
            bank_code="85",
            account_number="100098765432",
            account_name="Ayana Athletics PLC",
            bank_name="Dashen Bank",
        )

        self.wallet.refresh_from_db()
        payout = PayoutRequest.objects.get(transfer_reference=result["transfer_reference"])

        # In mock mode / test environment:
        self.assertEqual(payout.status, PayoutRequest.Status.COMPLETED)
        self.assertEqual(self.wallet.available_balance, initial_available - Decimal("5000.00"))
        self.assertEqual(self.wallet.total_withdrawn, Decimal("5000.00"))
        self.assertEqual(self.wallet.locked_payout_balance, Decimal("0.00"))

        # Verify immutable ledger entry
        ledger_entry = VendorLedgerEntry.objects.filter(
            wallet=self.wallet,
            entry_type=VendorLedgerEntry.EntryType.WITHDRAWAL,
        ).first()
        self.assertIsNotNone(ledger_entry)
        self.assertEqual(ledger_entry.amount, Decimal("5000.00"))
        self.assertEqual(ledger_entry.commission_deducted, Decimal("15.00"))
        self.assertEqual(ledger_entry.net_amount, Decimal("4985.00"))

    def test_payout_failure_reversal(self):
        """When an in-flight transfer fails/reverses, held funds return to available_balance."""
        # Setup in-flight hold manually
        self.wallet.available_balance = Decimal("5000.00")
        self.wallet.locked_payout_balance = Decimal("5000.00")
        self.wallet.save()

        payout = PayoutRequest.objects.create(
            vendor=self.vendor,
            requested_amount=Decimal("5000.00"),
            transfer_fee=Decimal("15.00"),
            disbursed_amount=Decimal("4985.00"),
            bank_code="85",
            bank_name="Dashen Bank",
            account_number="100098765432",
            account_name="Ayana Athletics PLC",
            transfer_reference="TRF-REVERSAL-TEST",
            status=PayoutRequest.Status.PROCESSING,
        )

        # Trigger failure reversal
        WalletService.fail_payout_settlement(payout, reason="Invalid recipient bank routing code")

        self.wallet.refresh_from_db()
        payout.refresh_from_db()

        self.assertEqual(payout.status, PayoutRequest.Status.FAILED)
        self.assertEqual(self.wallet.available_balance, Decimal("10000.00"))
        self.assertEqual(self.wallet.locked_payout_balance, Decimal("0.00"))
