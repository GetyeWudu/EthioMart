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


class ChapaReconciliationService:
    """
    Service for validating and reconciling payment transactions with Chapa Gateway.
    """

    @classmethod
    def reconcile_transaction(cls, tx_ref: str) -> dict:
        """
        Queries Chapa API for the given tx_ref, verifies status, and idempotently
        updates the Order and credits Vendor Escrows.
        """
        clean_ref = tx_ref.strip()
        lock_key = f"lock:payment:chapa:verify:{clean_ref}"

        with acquire_redis_lock(lock_key, timeout=20):
            # Find order by transaction_reference or order_number
            order = Order.objects.filter(
                transaction_reference=clean_ref
            ).first() or Order.objects.filter(
                order_number=clean_ref.replace("GECH-", "").replace("ORD-", "")
            ).first() or Order.objects.filter(
                order_number=clean_ref
            ).first()

            if not order:
                logger.warning(f"Reconciliation: order not found for tx_ref '{clean_ref}'.")
                return {"success": False, "detail": f"Order for reference '{clean_ref}' not found."}

            if order.payment_status == OrderPaymentStatus.PAID:
                return {
                    "success": True,
                    "status": "PAID",
                    "detail": "Order payment is already verified and confirmed.",
                    "tx_ref": clean_ref,
                    "amount": float(order.total_amount),
                }

            # Query Chapa API
            try:
                verify_response = ChapaClient.verify_payment(clean_ref)
            except Exception as e:
                logger.error(f"Chapa verification query failed for {clean_ref}: {str(e)}")
                return {"success": False, "detail": f"Chapa API verification error: {str(e)}"}

            chapa_status = verify_response.get("status")
            data = verify_response.get("data", {}) or {}

            if chapa_status == "success" or data.get("status") == "success":
                paid_amount = Decimal(str(data.get("amount", order.total_amount)))
                chapa_ref = data.get("reference") or data.get("chapa_reference") or clean_ref
                payment_method = data.get("payment_method") or data.get("method") or "Chapa / Telebirr"

                with transaction.atomic():
                    order.payment_status = OrderPaymentStatus.PAID
                    order.transaction_reference = chapa_ref
                    order.save(update_fields=['payment_status', 'transaction_reference', 'updated_at'])

                    # Credit multi-party seller escrows
                    for sub_order in order.sub_orders.all():
                        try:
                            WalletService.credit_escrow(sub_order)
                        except Exception as escrow_err:
                            logger.error(f"Escrow credit failed for sub-order {sub_order.id}: {str(escrow_err)}")

                logger.info(f"Successfully reconciled {clean_ref}: status=SUCCESS, amount={paid_amount} ETB")
                return {
                    "success": True,
                    "status": "PAID",
                    "detail": "Transaction verified with Chapa! Order set to PAID and Escrow credited.",
                    "tx_ref": clean_ref,
                    "amount": float(paid_amount),
                    "method": payment_method,
                }
            elif data.get("status") == "failed":
                order.payment_status = OrderPaymentStatus.FAILED
                order.save(update_fields=['payment_status', 'updated_at'])
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
                    "detail": "Transaction is awaiting completion on customer mobile / Chapa.",
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
