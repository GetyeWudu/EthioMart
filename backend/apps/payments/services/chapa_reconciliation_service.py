"""
apps/payments/services/chapa_reconciliation_service.py
======================================================
Reconciliation engine for Chapa gateway transactions.
Provides single-transaction manual sync (used by Admin) and background polling
for unconfirmed mobile checkout transactions lingering in PENDING.
"""

import logging
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from apps.orders.models import Order, OrderPaymentStatus
from apps.vendors.services.wallet_service import WalletService
from apps.payments.services.chapa_client import ChapaClient
from apps.common.distributed_lock import acquire_redis_lock

logger = logging.getLogger(__name__)


from apps.payments.services.payment_confirmation_service import PaymentConfirmationService


class ChapaReconciliationService:
    """
    Service for validating and reconciling payment transactions with Chapa Gateway.
    """

    @classmethod
    def reconcile_transaction(cls, tx_ref: str) -> dict:
        """
        Queries Chapa API for the given tx_ref, verifies status, and idempotently
        updates the Order and credits Vendor Escrows via PaymentConfirmationService.
        """
        clean_ref = (tx_ref or "").strip()
        res = PaymentConfirmationService.confirm_order_payment(clean_ref, source="reconciliation")

        if res.get("status") in ("success", "already_processed"):
            return {
                "success": True,
                "status": "PAID",
                "detail": "Transaction verified with Chapa! Order set to PAID and Escrow credited.",
                "tx_ref": clean_ref,
            }
        elif res.get("status") == "payment_failed":
            return {
                "success": False,
                "status": "FAILED",
                "detail": "Chapa reports this transaction failed or was cancelled by user.",
                "tx_ref": clean_ref,
            }
        else:
            return {
                "success": False,
                "status": "PENDING",
                "detail": res.get("error", "Transaction is awaiting completion on customer mobile / Chapa."),
                "tx_ref": clean_ref,
            }

    @classmethod
    def sync_all_pending(cls) -> dict:
        """
        Polls all local orders in PENDING payment status.
        """
        pending_orders = Order.objects.filter(
            payment_status=OrderPaymentStatus.PENDING
        ).order_by('-created_at')[:50]

        synced_count = 0
        confirmed_count = 0

        for order in pending_orders:
            tx_ref = order.transaction_reference or f"GECH-ORD-{order.order_number}"
            synced_count += 1
            res = cls.reconcile_transaction(tx_ref)
            if res.get("status") == "PAID":
                confirmed_count += 1

        return {
            "success": True,
            "synced_count": synced_count,
            "confirmed_count": confirmed_count,
            "message": f"Polled {synced_count} pending transactions. Confirmed {confirmed_count} payments with Chapa."
        }
