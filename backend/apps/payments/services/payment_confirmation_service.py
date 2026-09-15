"""
apps/payments/services/payment_confirmation_service.py
======================================================
Unified, high-assurance payment confirmation engine for Chapa Gateway:
  1. Distributed Redis Lock on tx_ref to eliminate race conditions.
  2. Authoritative Verification via Chapa Verify API (GET /v1/transaction/verify/{tx_ref}).
  3. Validation of Status, Amount, Currency, and Transaction Reference.
  4. PostgreSQL Row-level locking (select_for_update) & Strict Idempotency.
  5. Immutable StockMovement Audit Logging & Multi-party Seller Escrow Crediting.
  6. Customer & Vendor Notification Dispatch.
"""

import logging
from decimal import Decimal
from django.db import transaction
from django.db.models import Q

from apps.common.distributed_lock import acquire_redis_lock, ConcurrentTransactionError
from apps.orders.models import Order, OrderPaymentStatus
from apps.inventory.models import StockMovement, WarehouseStock
from apps.inventory.enums import MovementType
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification
from apps.vendors.services.wallet_service import WalletService
from apps.payments.services.chapa_client import ChapaClient

logger = logging.getLogger(__name__)


class PaymentConfirmationService:
    """
    Centralized service for confirming payments across Webhook, Verify endpoint,
    Reconciliation service, and Mock checkout.
    """

    @classmethod
    def confirm_order_payment(
        cls,
        tx_ref: str,
        source: str = "webhook",
        skip_chapa_verify: bool = False,
    ) -> dict:
        """
        Idempotently confirms an order payment and executes downstream financial state transitions.
        """
        clean_ref = (tx_ref or "").strip()
        if not clean_ref:
            return {"success": False, "status": "missing_ref", "error": "Missing transaction reference"}

        lock_key = f"lock:payment:confirm:{clean_ref}"

        try:
            with acquire_redis_lock(lock_key, timeout=25):
                # 1. Locate the order
                order = cls._find_order_by_ref(clean_ref)
                if not order:
                    logger.error(f"[{source.upper()}] Payment confirmation failed: Order not found for tx_ref '{clean_ref}'")
                    return {"success": False, "status": "not_found", "error": f"Order for reference '{clean_ref}' not found"}

                # 2. Fast idempotency check before calling external API
                if order.payment_status == OrderPaymentStatus.PAID:
                    logger.info(f"[{source.upper()}] Order #{order.order_number} ({clean_ref}) is already marked PAID.")
                    return {
                        "success": True,
                        "status": "already_processed",
                        "order_id": str(order.id),
                        "order_number": order.order_number,
                    }

                # 3. Server-to-server authoritative verification against Chapa API
                if not skip_chapa_verify and not ChapaClient.MOCK_MODE:
                    verify_result = ChapaClient.verify_transaction(clean_ref)
                    validation_err = cls._validate_chapa_response(order, verify_result, clean_ref)
                    if validation_err:
                        logger.warning(f"[{source.upper()}] Chapa verification rejected for #{order.order_number}: {validation_err}")
                        return validation_err

                # 4. Atomic database state transition with row lock
                with transaction.atomic():
                    # Re-fetch order with row lock
                    locked_order = Order.objects.select_for_update().filter(id=order.id).first()
                    if not locked_order:
                        return {"success": False, "status": "not_found", "error": "Order no longer exists"}

                    if locked_order.payment_status == OrderPaymentStatus.PAID:
                        return {
                            "success": True,
                            "status": "already_processed",
                            "order_id": str(locked_order.id),
                            "order_number": locked_order.order_number,
                        }

                    locked_order.payment_status = OrderPaymentStatus.PAID
                    locked_order.transaction_reference = clean_ref
                    locked_order.save(update_fields=["payment_status", "transaction_reference", "updated_at"])

                    # 5. Stock Movement Audit logging
                    cls._record_stock_movements(locked_order)

                    # 6. Credit Seller Escrow
                    cls._credit_vendor_escrow(locked_order)

                # 7. Post-transaction notifications
                cls._dispatch_notifications(locked_order)

                logger.info(f"[{source.upper()}] Payment successfully CONFIRMED for Order #{locked_order.order_number} ({clean_ref})")
                return {
                    "success": True,
                    "status": "success",
                    "order_id": str(locked_order.id),
                    "order_number": locked_order.order_number,
                }

        except ConcurrentTransactionError:
            logger.info(f"[{source.upper()}] Concurrent confirmation in flight for tx_ref: {clean_ref}")
            return {"success": True, "status": "processing_in_progress", "tx_ref": clean_ref}
        except Exception as e:
            logger.exception(f"[{source.upper()}] Unexpected error confirming payment for tx_ref '{clean_ref}': {e}")
            return {"success": False, "status": "error", "error": str(e)}

    @classmethod
    def _find_order_by_ref(cls, tx_ref: str) -> Order | None:
        """Finds order by transaction_reference or order_number encoded in tx_ref."""
        query = Q(transaction_reference=tx_ref)
        if "-" in tx_ref:
            # GECH-ORD-2026-000123-1757840123 or ORD-2026-000123
            parts = tx_ref.split("-")
            if len(parts) >= 3:
                order_num = f"{parts[1]}-{parts[2]}"
                query |= Q(order_number=order_num)
        query |= Q(order_number=tx_ref.replace("GECH-", "").replace("ORD-", ""))
        query |= Q(order_number=tx_ref)
        return Order.objects.filter(query).first()

    @classmethod
    def _validate_chapa_response(cls, order: Order, verify_result: dict, tx_ref: str) -> dict | None:
        """Validates Chapa API response against internal Order data."""
        if not verify_result:
            return {"success": False, "status": "verification_failed", "error": "Empty response from Chapa Verify API"}

        chapa_status = verify_result.get("status")
        data = verify_result.get("data", {}) or {}

        # If Chapa explicitly says the transaction failed/cancelled
        if chapa_status in ("failed", "cancelled") or data.get("status") in ("failed", "cancelled"):
            with transaction.atomic():
                order.payment_status = OrderPaymentStatus.FAILED
                order.save(update_fields=["payment_status", "updated_at"])
            return {"success": False, "status": "payment_failed", "error": "Chapa reports payment failed or cancelled"}

        # Validate success status
        is_success = (
            chapa_status == "success"
            and data.get("status") in ("success", "paid")
        ) or (chapa_status == "success" and not data)

        if not is_success:
            return {
                "success": False,
                "status": "pending_or_unconfirmed",
                "error": f"Chapa status is '{chapa_status}' / '{data.get('status')}'. Payment not completed.",
            }

        # Validate Amount if present in Chapa response data
        if data and "amount" in data:
            try:
                chapa_amt = Decimal(str(data["amount"])).quantize(Decimal("0.01"))
                order_amt = Decimal(str(order.total_amount)).quantize(Decimal("0.01"))
                if chapa_amt != order_amt:
                    logger.error(
                        f"CRITICAL: Amount mismatch on tx_ref {tx_ref}! Chapa={chapa_amt} ETB, Order={order_amt} ETB."
                    )
                    return {
                        "success": False,
                        "status": "amount_mismatch",
                        "error": f"Amount mismatch: received {chapa_amt} ETB, expected {order_amt} ETB",
                    }
            except Exception as e:
                logger.warning(f"Failed to parse amount from Chapa response: {e}")

        # Validate Currency
        if data and data.get("currency") and data.get("currency").upper() != "ETB":
            return {
                "success": False,
                "status": "currency_mismatch",
                "error": f"Unexpected currency: {data.get('currency')}. Expected ETB.",
            }

        return None

    @classmethod
    def _record_stock_movements(cls, order: Order):
        """Creates StockMovement audit records for paid order items."""
        for sub_order in order.sub_orders.all():
            for item in sub_order.items.all():
                if item.variant and item.warehouse:
                    try:
                        stock = WarehouseStock.objects.select_for_update().get(
                            variant=item.variant,
                            warehouse=item.warehouse,
                        )
                        StockMovement.objects.create(
                            warehouse=item.warehouse,
                            variant=item.variant,
                            movement_type=MovementType.ORDER_FULFILLMENT,
                            quantity_delta=0,
                            balance_after=stock.quantity_on_hand,
                            reference_order_id=str(order.id),
                            notes=f"Order {order.order_number} Paid. Stock remains reserved until dispatched.",
                        )
                    except WarehouseStock.DoesNotExist:
                        pass

    @classmethod
    def _credit_vendor_escrow(cls, order: Order):
        """Credits seller escrow accounts for all sub-orders."""
        for sub_order in order.sub_orders.all():
            try:
                WalletService.credit_escrow(sub_order)
            except Exception as e:
                logger.error(f"Error crediting escrow for sub_order {sub_order.id}: {e}")

    @classmethod
    def _dispatch_notifications(cls, order: Order):
        """Dispatches customer and vendor notifications for paid order."""
        try:
            if order.customer:
                from apps.notifications.email_templates import render_order_receipt_html
                receipt_html = render_order_receipt_html(order)
                NotificationService.send_notification(
                    user=order.customer,
                    type=Notification.NotificationType.ORDER_UPDATE,
                    title=f"Payment Confirmed - Order #{order.order_number}",
                    message=f"Your payment for order #{order.order_number} was successfully confirmed.",
                    related_link=f"/customer/orders/{order.id}",
                    html_message=receipt_html,
                )

            for sub_order in order.sub_orders.all():
                if sub_order.vendor and sub_order.vendor.user:
                    NotificationService.send_notification(
                        user=sub_order.vendor.user,
                        type=Notification.NotificationType.ORDER_UPDATE,
                        title="New Paid Order",
                        message=f"Order #{order.order_number} (Sub-order #{str(sub_order.id)[:8].upper()}) is paid and ready for fulfillment.",
                        related_link=f"/seller/orders/{sub_order.id}",
                    )
        except Exception as e:
            logger.error(f"Error sending notifications for order {order.id}: {e}")
