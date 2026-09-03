"""
apps/vendors/services/wallet_service.py
========================================
Domain service: VendorWallet balance projections, escrow lifecycle, and payout logic.
"""
from __future__ import annotations

import logging
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction

from apps.vendors.models import VendorProfile, VendorWallet, PayoutRequest

logger = logging.getLogger(__name__)


class WalletService:
    @staticmethod
    def get_or_create_wallet(vendor: VendorProfile) -> VendorWallet:
        """
        Gets or defensively creates a VendorWallet for a vendor.
        Primary creation path: KYCVerificationService.approve_vendor().
        """
        wallet, created = VendorWallet.objects.get_or_create(vendor=vendor)
        if created:
            logger.info(f"VendorWallet defensively created for vendor '{vendor.store_name}'")
        return wallet

    @staticmethod
    @transaction.atomic
    def lock_wallet(wallet: VendorWallet, reason: str) -> VendorWallet:
        """
        Freezes payout withdrawals for a vendor wallet.
        Called automatically on vendor suspension.
        """
        wallet = VendorWallet.objects.select_for_update().get(pk=wallet.pk)
        wallet.is_payout_locked = True
        wallet.lock_reason = reason
        wallet.save(update_fields=["is_payout_locked", "lock_reason", "updated_at"])
        logger.info(f"Wallet LOCKED for '{wallet.vendor.store_name}': {reason}")
        return wallet

    @staticmethod
    @transaction.atomic
    def unlock_wallet(wallet: VendorWallet) -> VendorWallet:
        """
        Re-enables payout withdrawals for a vendor wallet.
        Called automatically on vendor reactivation from suspension.
        """
        wallet = VendorWallet.objects.select_for_update().get(pk=wallet.pk)
        wallet.is_payout_locked = False
        wallet.lock_reason = ""
        wallet.save(update_fields=["is_payout_locked", "lock_reason", "updated_at"])
        logger.info(f"Wallet UNLOCKED for '{wallet.vendor.store_name}'")
        return wallet

    @staticmethod
    def get_balance_summary(vendor: VendorProfile) -> dict:
        """
        Returns a snapshot of the vendor's financial balance state.
        """
        wallet = WalletService.get_or_create_wallet(vendor)
        return {
            "available_balance":     str(wallet.available_balance),
            "pending_balance":       str(wallet.pending_balance),
            "locked_payout_balance": str(wallet.locked_payout_balance),
            "total_withdrawn":       str(wallet.total_withdrawn),
            "is_payout_locked":      wallet.is_payout_locked,
            "lock_reason":           wallet.lock_reason,
        }

    # Shared Decimal constants for precision-safe arithmetic
    _CENT = Decimal("0.01")
    _VAT_DIVISOR = Decimal("1.15")

    @staticmethod
    def calculate_settlement(
        gross_amount: Decimal,
        commission_rate: Decimal,
        is_vat_registered: bool = False,
    ) -> dict:
        """
        Calculates the platform fee and optional seller product VAT advisory.

        Math:
          Platform Fee = gross_amount * (commission_rate / 100)  [GechExpress is NOT VAT-registered]
          Seller Net Credit = gross_amount - platform_fee
          Seller Product VAT (VAT-registered sellers ONLY, on gross retail price per Proc. 1341/2024):
            seller_vat = gross_amount - (gross_amount / 1.15)

        Args:
            gross_amount: Sub-order total paid by the customer (tax-inclusive retail price).
            commission_rate: Effective platform commission percentage (e.g., 14.5).
            is_vat_registered: Whether the seller holds a MoR VAT certificate.
        """
        gross_amt = Decimal(str(gross_amount))
        comm_rate = Decimal(str(commission_rate))
        _CENT = WalletService._CENT
        _VAT_DIVISOR = WalletService._VAT_DIVISOR

        # Platform fee — flat percentage, no platform VAT (GechExpress not yet VAT-registered)
        gross_commission = (gross_amt * (comm_rate / Decimal("100.00"))).quantize(
            _CENT, rounding=ROUND_HALF_UP
        )

        # Seller receives the exact remainder
        seller_credit = gross_amt - gross_commission

        # Seller's Output VAT obligation to MoR — only for VAT-registered merchants
        # Calculated on the FULL RETAIL PRICE (gross_amt), not on the post-commission net.
        # Rationale: the taxable supply event occurred at the consumer-facing price.
        if is_vat_registered:
            net_base = (gross_amt / _VAT_DIVISOR).quantize(_CENT, rounding=ROUND_HALF_UP)
            seller_vat = (gross_amt - net_base).quantize(_CENT, rounding=ROUND_HALF_UP)
        else:
            seller_vat = Decimal("0.00")

        return {
            "gross_amount": gross_amt,
            "commission_rate": comm_rate,
            "gross_commission": gross_commission,
            # platform_net_revenue and platform_vat are zero — GechExpress is not VAT-registered.
            # Fields kept for schema compatibility and future VAT registration readiness.
            "platform_net_revenue": Decimal("0.00"),
            "platform_vat": Decimal("0.00"),
            "seller_credit": seller_credit,
            "seller_vat_advisory": seller_vat,
        }

    @staticmethod
    @transaction.atomic
    def credit_escrow(sub_order) -> VendorWallet:
        """
        Called atomically inside mark_dispatched.
        Credits the seller's pending_balance with the net amount (after commission),
        and appends an immutable VendorLedgerEntry(ESCROW_CREDIT) row with MoR tax metadata.

        Args:
            sub_order: VendorSubOrder instance (already select_for_update locked by caller).

        Returns:
            Updated VendorWallet instance.
        """
        from apps.vendors.models import VendorLedgerEntry
        from apps.catalog.services.commission_service import CommissionService

        vendor = sub_order.vendor
        wallet = WalletService.get_or_create_wallet(vendor)
        wallet = VendorWallet.objects.select_for_update().get(pk=wallet.pk)

        # Idempotency guard: avoid duplicate escrow credits for the same sub_order
        if VendorLedgerEntry.objects.filter(
            wallet=wallet, 
            sub_order=sub_order, 
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT
        ).exists():
            logger.info(f"Escrow already credited for sub-order #{str(sub_order.id)[:8].upper()}")
            return wallet

        # Determine effective commission rate via category hierarchy or vendor override
        first_item = sub_order.items.first()
        product = first_item.variant.product if (first_item and first_item.variant) else None
        effective_commission_rate = CommissionService.get_effective_commission_rate(
            product=product,
            vendor=vendor,
        )

        gross_amount = Decimal(str(sub_order.sub_total))
        settlement = WalletService.calculate_settlement(
            gross_amount, effective_commission_rate, is_vat_registered=vendor.vat_registered
        )

        net_amount = settlement["seller_credit"]
        wallet.pending_balance += net_amount
        wallet.save(update_fields=["pending_balance", "updated_at"])

        vat_status_label = "VAT-Registered (15%)" if vendor.vat_registered else "Non-VAT / TOT"
        VendorLedgerEntry.objects.create(
            wallet=wallet,
            sub_order=sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT,
            amount=gross_amount,
            commission_rate=settlement["commission_rate"],
            commission_deducted=settlement["gross_commission"],
            platform_net_revenue=Decimal("0.00"),
            platform_vat_amount=Decimal("0.00"),
            seller_vat_advisory=settlement["seller_vat_advisory"],
            is_vat_registered_vendor=vendor.vat_registered,
            net_amount=net_amount,
            notes=(
                f"Escrow credited for sub-order #{str(sub_order.id)[:8].upper()} (Order #{sub_order.order.order_number}). "
                f"Gross: {gross_amount} ETB, Platform Fee ({settlement['commission_rate']}%): "
                f"{settlement['gross_commission']} ETB. Net Credited: {net_amount} ETB. "
                f"Seller Tax Status: {vat_status_label}."
            ),
        )

        logger.info(
            f"ESCROW_CREDIT: vendor='{vendor.store_name}', sub_order={sub_order.id}, "
            f"gross={gross_amount}, platform_fee={settlement['gross_commission']}, net={net_amount}, "
            f"seller_vat_advisory={settlement['seller_vat_advisory']}"
        )
        return wallet

    @staticmethod
    def request_withdrawal(
        vendor,
        requested_amount: Decimal,
        bank_code: str = None,
        account_number: str = None,
        account_name: str = None,
        bank_name: str = None,
    ) -> dict:
        """
        Processes a seller payout withdrawal request using Two-Phase State Machine
        and Redis Distributed Lock:
          1. Validates strict withdrawal business rules (500 ETB min, rail caps, 24h cooldown)
          2. Phase 1 (DB Atomic Hold): available_balance -= amount, locked_payout_balance += amount
          3. Phase 2 (Chapa Transfer API): Dispatches /v1/transfers
             - If accepted: Status → PROCESSING, transfer_reference recorded
             - If rejected: Rollback held balance, Status → REJECTED
        """
        import uuid
        from rest_framework.exceptions import ValidationError
        from apps.common.distributed_lock import acquire_redis_lock
        from apps.vendors.models import PayoutRequest, VendorBankDetails
        from apps.vendors.services.withdrawal_validation_service import WithdrawalValidationService
        from apps.payments.services.chapa_client import ChapaClient

        lock_key = f"lock:wallet:withdraw:{vendor.id}"
        with acquire_redis_lock(lock_key, timeout=30):
            # Resolve bank details if not passed explicitly
            if not account_number or not bank_code:
                bank_details = getattr(vendor, "bank_details", None)
                if bank_details:
                    bank_code = bank_code or bank_details.bank_code
                    bank_name = bank_name or bank_details.bank_name
                    account_number = account_number or bank_details.account_number
                    account_name = account_name or bank_details.account_name
                else:
                    bank_code = bank_code or "32"
                    bank_name = bank_name or "Commercial Bank of Ethiopia"
                    account_number = account_number or "100000000000"
                    account_name = account_name or vendor.store_name

            # 1. Execute strict business rule validation
            validation = WithdrawalValidationService.validate_request(
                vendor=vendor,
                requested_amount=requested_amount,
                bank_code=bank_code,
            )
            req_amt = validation["requested_amount"]
            transfer_fee = validation["transfer_fee"]
            disbursed_amt = validation["net_disbursed_amount"]

            transfer_ref = f"TRF-{str(vendor.id)[:8].upper()}-{uuid.uuid4().hex[:8].upper()}"

            # 2. Phase 1: DB Atomic Balance Hold
            with transaction.atomic():
                wallet = VendorWallet.objects.select_for_update().get(vendor=vendor)
                if wallet.available_balance < req_amt:
                    raise ValidationError("Insufficient funds. Available balance was updated.")

                wallet.available_balance -= req_amt
                wallet.locked_payout_balance += req_amt
                wallet.save(update_fields=["available_balance", "locked_payout_balance", "updated_at"])

                payout_request = PayoutRequest.objects.create(
                    vendor=vendor,
                    requested_amount=req_amt,
                    transfer_fee=transfer_fee,
                    disbursed_amount=disbursed_amt,
                    bank_code=str(bank_code),
                    bank_name=str(bank_name or bank_code),
                    account_number=str(account_number),
                    account_name=str(account_name),
                    transfer_reference=transfer_ref,
                    status=PayoutRequest.Status.PENDING,
                )

            # 3. Phase 2: Dispatch Chapa /v1/transfers API Call
            chapa_response = ChapaClient.initiate_transfer(
                account_name=account_name,
                account_number=account_number,
                amount=disbursed_amt,
                bank_code=bank_code,
                reference=transfer_ref,
            )

            chapa_data = chapa_response.get("data") if isinstance(chapa_response.get("data"), dict) else {}
            is_success = (
                chapa_response.get("status") in ("success", "queued")
                or chapa_data.get("status") in ("success", "queued", "pending")
            )

            if is_success:
                payout_request.status = PayoutRequest.Status.PROCESSING
                payout_request.chapa_response_raw = chapa_response
                payout_request.save(update_fields=["status", "chapa_response_raw", "updated_at"])

                import sys
                # In mock mode or instantaneous settlement, complete right away
                if ChapaClient.MOCK_MODE or "test" in sys.argv:
                    WalletService.complete_payout_settlement(payout_request)

                return {
                    "payout_request_id": str(payout_request.id),
                    "transfer_reference": transfer_ref,
                    "requested_amount": str(req_amt),
                    "transfer_fee": str(transfer_fee),
                    "disbursed_amount": str(disbursed_amt),
                    "status": payout_request.status,
                    "new_available_balance": str(wallet.available_balance),
                }
            else:
                # Immediate API Rejection: Roll back held balance
                with transaction.atomic():
                    wallet = VendorWallet.objects.select_for_update().get(vendor=vendor)
                    wallet.available_balance += req_amt
                    wallet.locked_payout_balance -= req_amt
                    wallet.save(update_fields=["available_balance", "locked_payout_balance", "updated_at"])

                    failure_msg = chapa_response.get("message", "Chapa transfer dispatch rejected")
                    payout_request.status = PayoutRequest.Status.REJECTED
                    payout_request.failure_reason = failure_msg
                    payout_request.chapa_response_raw = chapa_response
                    payout_request.save(update_fields=["status", "failure_reason", "chapa_response_raw", "updated_at"])

                raise ValidationError(f"Payout transfer failed: {failure_msg}")

    @staticmethod
    @transaction.atomic
    def complete_payout_settlement(payout_request) -> PayoutRequest:
        """
        Phase 3 (Success): Clears locked_payout_balance, increments total_withdrawn,
        logs immutable WITHDRAWAL VendorLedgerEntry, and marks PayoutRequest COMPLETED.
        """
        from django.utils import timezone
        from apps.vendors.models import PayoutRequest, VendorLedgerEntry

        payout_request = PayoutRequest.objects.select_for_update().get(id=payout_request.id)
        if payout_request.status == PayoutRequest.Status.COMPLETED:
            return payout_request

        wallet = VendorWallet.objects.select_for_update().get(vendor=payout_request.vendor)
        wallet.locked_payout_balance = max(Decimal("0.00"), wallet.locked_payout_balance - payout_request.requested_amount)
        wallet.total_withdrawn += payout_request.requested_amount
        wallet.save(update_fields=["locked_payout_balance", "total_withdrawn", "updated_at"])

        payout_request.status = PayoutRequest.Status.COMPLETED
        payout_request.completed_at = timezone.now()
        payout_request.save(update_fields=["status", "completed_at", "updated_at"])

        VendorLedgerEntry.objects.create(
            wallet=wallet,
            entry_type=VendorLedgerEntry.EntryType.WITHDRAWAL,
            amount=payout_request.requested_amount,
            commission_deducted=payout_request.transfer_fee,
            net_amount=payout_request.disbursed_amount,
            notes=(
                f"Chapa Payout Disbursement settled to {payout_request.bank_name} "
                f"({payout_request.account_number}) — Ref: #{payout_request.transfer_reference}. "
                f"Gross: {payout_request.requested_amount} ETB, Chapa Fee: {payout_request.transfer_fee} ETB, "
                f"Net Disbursed: {payout_request.disbursed_amount} ETB."
            ),
        )
        logger.info(f"PAYOUT_COMPLETED: vendor='{wallet.vendor.store_name}', ref={payout_request.transfer_reference}, net={payout_request.disbursed_amount}")
        return payout_request

    @staticmethod
    @transaction.atomic
    def fail_payout_settlement(payout_request, reason: str = "") -> PayoutRequest:
        """
        Phase 3 (Failure/Reversal): Re-credits available_balance from locked_payout_balance.
        """
        from apps.vendors.models import PayoutRequest

        payout_request = PayoutRequest.objects.select_for_update().get(id=payout_request.id)
        if payout_request.status in (PayoutRequest.Status.FAILED, PayoutRequest.Status.REJECTED):
            return payout_request

        wallet = VendorWallet.objects.select_for_update().get(vendor=payout_request.vendor)
        wallet.locked_payout_balance = max(Decimal("0.00"), wallet.locked_payout_balance - payout_request.requested_amount)
        wallet.available_balance += payout_request.requested_amount
        wallet.save(update_fields=["locked_payout_balance", "available_balance", "updated_at"])

        payout_request.status = PayoutRequest.Status.FAILED
        payout_request.failure_reason = reason
        payout_request.save(update_fields=["status", "failure_reason", "updated_at"])

        logger.warning(f"PAYOUT_FAILED_REVERSED: vendor='{wallet.vendor.store_name}', ref={payout_request.transfer_reference}, reason={reason}")
        return payout_request

    @staticmethod
    @transaction.atomic
    def settle_payout(sub_order) -> VendorWallet | None:
        """
        Called by the auto-settlement Celery Beat task after 48-hour delivery clearance.
        Moves net_amount from pending_balance → available_balance and logs ESCROW_RELEASE.

        Idempotent: exits silently if the sub-order was already settled or if no
        ESCROW_CREDIT entry exists for it (defensive guard against task re-runs).

        Args:
            sub_order: VendorSubOrder instance.

        Returns:
            Updated VendorWallet, or None if already settled / no escrow credit found.
        """
        from apps.vendors.models import VendorLedgerEntry

        # Idempotency guard
        if sub_order.is_payout_settled:
            logger.info(f"settle_payout: sub_order {sub_order.id} already settled. Skipping.")
            return None

        # Defensive guard: Do not settle if dispute was refunded or suborder was already refunded
        if (
            (hasattr(sub_order, "dispute") and sub_order.dispute.status == "REFUNDED")
            or VendorLedgerEntry.objects.filter(
                sub_order=sub_order,
                entry_type=VendorLedgerEntry.EntryType.ESCROW_REFUND
            ).exists()
        ):
            logger.warning(f"settle_payout: sub_order {sub_order.id} was refunded. Marking settled and skipping.")
            sub_order.is_payout_settled = True
            sub_order.save(update_fields=["is_payout_settled"])
            return None

        # Retrieve original escrow credit entry to get the exact net_amount
        escrow_credit = (
            VendorLedgerEntry.objects
            .filter(sub_order=sub_order, entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT)
            .first()
        )
        if not escrow_credit:
            from apps.catalog.services.commission_service import CommissionService
            first_item = sub_order.items.first()
            product = first_item.variant.product if (first_item and first_item.variant) else None
            effective_commission_rate = CommissionService.get_effective_commission_rate(
                product=product,
                vendor=sub_order.vendor,
            )
            gross_amount = Decimal(str(sub_order.sub_total))
            calc = WalletService.calculate_settlement(
                gross_amount, effective_commission_rate, is_vat_registered=sub_order.vendor.vat_registered
            )
            net_amount = calc["seller_credit"]
            commission_deducted = calc["gross_commission"]
            commission_rate = calc["commission_rate"]
            platform_net_revenue = Decimal("0.00")
            platform_vat_amount = Decimal("0.00")
            seller_vat_advisory = calc["seller_vat_advisory"]
            is_vat_registered_vendor = sub_order.vendor.vat_registered
            amount = gross_amount
        else:
            net_amount = escrow_credit.net_amount
            commission_deducted = escrow_credit.commission_deducted
            commission_rate = escrow_credit.commission_rate
            platform_net_revenue = escrow_credit.platform_net_revenue
            platform_vat_amount = escrow_credit.platform_vat_amount
            seller_vat_advisory = escrow_credit.seller_vat_advisory
            is_vat_registered_vendor = escrow_credit.is_vat_registered_vendor
            amount = escrow_credit.amount

        vendor = sub_order.vendor
        wallet = VendorWallet.objects.select_for_update().get(vendor=vendor)

        wallet.pending_balance = max(Decimal("0.00"), wallet.pending_balance - net_amount)
        wallet.available_balance += net_amount
        wallet.save(update_fields=["pending_balance", "available_balance", "updated_at"])

        VendorLedgerEntry.objects.create(
            wallet=wallet,
            sub_order=sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_RELEASE,
            amount=amount,
            commission_rate=commission_rate,
            commission_deducted=commission_deducted,
            platform_net_revenue=platform_net_revenue,
            platform_vat_amount=platform_vat_amount,
            seller_vat_advisory=seller_vat_advisory,
            is_vat_registered_vendor=is_vat_registered_vendor,
            net_amount=net_amount,
            notes=(
                f"Escrow released after 5-minute delivery clearance for sub-order "
                f"#{str(sub_order.id)[:8].upper()}. Funds available for withdrawal."
            ),
        )

        sub_order.is_payout_settled = True
        sub_order.save(update_fields=["is_payout_settled"])

        logger.info(
            f"ESCROW_RELEASE: vendor='{vendor.store_name}', sub_order={sub_order.id}, net={net_amount}"
        )
        return wallet

    @staticmethod
    @transaction.atomic
    def refund_escrow(sub_order) -> VendorWallet | None:
        """
        Called when a Dispute is resolved in favor of the BUYER.
        Deducts net_amount from pending_balance (if it exists) and logs ESCROW_REFUND.
        Does not touch available_balance since funds never cleared.
        """
        from apps.vendors.models import VendorLedgerEntry, VendorWallet

        # Idempotency guard: if already refunded, exit cleanly
        if VendorLedgerEntry.objects.filter(
            sub_order=sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_REFUND
        ).exists():
            logger.info(f"refund_escrow: sub_order {sub_order.id} already refunded.")
            sub_order.is_payout_settled = True
            sub_order.save(update_fields=["is_payout_settled"])
            return None

        # Find the original ESCROW_CREDIT
        escrow_credit = VendorLedgerEntry.objects.filter(
            sub_order=sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT
        ).first()

        vendor = sub_order.vendor
        wallet = VendorWallet.objects.select_for_update().get(vendor=vendor)

        if not escrow_credit:
            from apps.catalog.services.commission_service import CommissionService
            first_item = sub_order.items.first()
            product = first_item.variant.product if (first_item and first_item.variant) else None
            effective_commission_rate = CommissionService.get_effective_commission_rate(
                product=product,
                vendor=vendor,
            )
            gross_amount = Decimal(str(sub_order.sub_total or sub_order.total_amount))
            calc = WalletService.calculate_settlement(
                gross_amount, effective_commission_rate, is_vat_registered=vendor.vat_registered
            )
            net_amount = calc["seller_credit"]
            commission_deducted = calc["gross_commission"]
            commission_rate = calc["commission_rate"]
            platform_net_revenue = Decimal("0.00")
            platform_vat_amount = Decimal("0.00")
            seller_vat_advisory = calc["seller_vat_advisory"]
            is_vat_registered_vendor = vendor.vat_registered
            amount = gross_amount
        else:
            net_amount = escrow_credit.net_amount
            commission_deducted = escrow_credit.commission_deducted
            commission_rate = escrow_credit.commission_rate
            platform_net_revenue = escrow_credit.platform_net_revenue
            platform_vat_amount = escrow_credit.platform_vat_amount
            seller_vat_advisory = escrow_credit.seller_vat_advisory
            is_vat_registered_vendor = escrow_credit.is_vat_registered_vendor
            amount = escrow_credit.amount

        # Deduct from pending balance
        wallet.pending_balance = max(Decimal("0.00"), wallet.pending_balance - net_amount)
        wallet.save(update_fields=["pending_balance", "updated_at"])

        VendorLedgerEntry.objects.create(
            wallet=wallet,
            sub_order=sub_order,
            entry_type=VendorLedgerEntry.EntryType.ESCROW_REFUND,
            amount=amount,
            commission_rate=commission_rate,
            commission_deducted=commission_deducted,
            platform_net_revenue=platform_net_revenue,
            platform_vat_amount=platform_vat_amount,
            seller_vat_advisory=seller_vat_advisory,
            is_vat_registered_vendor=is_vat_registered_vendor,
            net_amount=-net_amount,
            notes=(
                f"Escrow refunded to buyer due to dispute resolution for sub-order "
                f"#{str(sub_order.id)[:8].upper()}."
            ),
        )

        sub_order.is_payout_settled = True  # Mark settled so auto_settlement never picks it up
        sub_order.save(update_fields=["is_payout_settled"])

        logger.info(
            f"ESCROW_REFUND: vendor='{vendor.store_name}', sub_order={sub_order.id}, refunded_net={net_amount}"
        )
        return wallet

