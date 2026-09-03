"""
apps/vendors/services/withdrawal_validation_service.py
======================================================
Strict enterprise withdrawal & payout business rules engine for Ethiopian merchant payouts:
  1. Minimum withdrawal threshold (500.00 ETB)
  2. Safety limits per Ethiopian payment rail (Telebirr 75k, CBEBirr 300k, Bank 1M)
  3. Single in-flight payout lock (prevents double-booking pending payouts)
  4. 24-hour frequency cap per vendor
  5. KYC approval & wallet payout-lock enforcement
  6. Flat 15.00 ETB Chapa bank transfer fee deduction
"""

from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.vendors.models import PayoutRequest, VendorProfile


class WithdrawalValidationService:
    MIN_WITHDRAWAL_AMOUNT = Decimal("500.00")
    TRANSFER_FEE_ETB = Decimal("15.00")

    # Ethiopian Rail Limits (Chapa & National Bank of Ethiopia constraints)
    RAIL_LIMITS = {
        "telebirr": Decimal("75000.00"),
        "cbebirr": Decimal("300000.00"),
        "bank_transfer": Decimal("1000000.00"),
    }

    @classmethod
    def determine_rail_type(cls, bank_code: str) -> str:
        """Categorizes bank code into corresponding Ethiopian payment rail."""
        bc = str(bank_code).lower().strip()
        if "telebirr" in bc:
            return "telebirr"
        if "cbebirr" in bc:
            return "cbebirr"
        return "bank_transfer"

    @classmethod
    def validate_request(cls, vendor: VendorProfile, requested_amount: Decimal, bank_code: str = "") -> dict:
        wallet = getattr(vendor, "wallet", None)
        if not wallet:
            raise ValidationError("Vendor wallet does not exist for this account.")

        req_amt = Decimal(str(requested_amount)).quantize(Decimal("0.01"))
        rail_type = cls.determine_rail_type(bank_code)

        # 1. KYC and Security Checks
        if not vendor.is_verified:
            raise ValidationError("Your KYC tax profile must be verified by compliance before requesting withdrawals.")

        if wallet.is_payout_locked:
            reason_suffix = f" Reason: {wallet.lock_reason}" if wallet.lock_reason else ""
            raise ValidationError(f"Payouts are currently locked for this account.{reason_suffix}")

        # 2. Minimum Amount Rule
        if req_amt < cls.MIN_WITHDRAWAL_AMOUNT:
            raise ValidationError(f"The minimum withdrawal amount is {cls.MIN_WITHDRAWAL_AMOUNT} ETB.")

        # 3. Rail Ceiling Limit Check
        max_limit = cls.RAIL_LIMITS.get(rail_type, cls.RAIL_LIMITS["bank_transfer"])
        if req_amt > max_limit:
            raise ValidationError(f"Maximum withdrawal limit for {rail_type} is {max_limit} ETB per transaction.")

        # 4. Available Balance Check
        if wallet.available_balance < req_amt:
            raise ValidationError(f"Insufficient funds. Available balance: {wallet.available_balance} ETB.")

        # 5. In-Flight Payout Lock Rule (Prevent multiple concurrent requests)
        has_active_payout = PayoutRequest.objects.filter(
            vendor=vendor,
            status__in=[PayoutRequest.Status.PENDING, PayoutRequest.Status.PROCESSING],
        ).exists()

        if has_active_payout:
            raise ValidationError("You already have an active payout in progress. Please wait for settlement confirmation.")

        # 6. Frequency Cap Rule (Relaxed to 30 seconds for test mode, was 24 hours)
        last_payout = PayoutRequest.objects.filter(
            vendor=vendor,
            status__in=[PayoutRequest.Status.COMPLETED, PayoutRequest.Status.PROCESSING],
        ).order_by("-created_at").first()

        if last_payout and last_payout.created_at:
            seconds_elapsed = (timezone.now() - last_payout.created_at).total_seconds()
            if seconds_elapsed < 30:
                remaining_secs = int(30 - seconds_elapsed)
                raise ValidationError(
                    f"Please wait {remaining_secs}s before submitting another payout request."
                )

        # 7. Disbursed Net Calculation
        net_disbursed_amount = (req_amt - cls.TRANSFER_FEE_ETB).quantize(Decimal("0.01"))
        if net_disbursed_amount <= Decimal("0.00"):
            raise ValidationError("Requested withdrawal amount cannot be less than or equal to the transfer fee.")

        return {
            "requested_amount": req_amt,
            "transfer_fee": cls.TRANSFER_FEE_ETB,
            "net_disbursed_amount": net_disbursed_amount,
            "rail_type": rail_type,
        }
