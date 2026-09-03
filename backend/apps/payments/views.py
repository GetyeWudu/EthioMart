"""
apps/payments/views.py
======================
High-Assurance Payment Views for Chapa Gateway:
  1. Cryptographic HMAC-SHA256 Webhook Handler with Redis Distributed Lock & DB Row Locking
  2. Transaction Verification API
  3. 24-Hour Cached Ethiopian Banks & Mobile Wallets Directory
"""

import logging
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.distributed_lock import acquire_redis_lock, ConcurrentTransactionError
from apps.orders.models import Order, OrderPaymentStatus
from apps.inventory.models import StockMovement, WarehouseStock
from apps.inventory.enums import MovementType
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification
from apps.vendors.services.wallet_service import WalletService
from .services.chapa_client import ChapaClient

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def handle_chapa_webhook(request):
    """
    High-Assurance Webhook Handler (Redis Distributed Lock + DB select_for_update + Idempotency)
    
    Security & Concurrency Layers:
      Layer 1: HMAC SHA-256 Signature Verification via 'x-chapa-signature'
      Layer 2: Redis Distributed Lock on tx_ref to prevent race conditions across Celery/Gunicorn workers
      Layer 3: DB select_for_update() row lock inside transaction.atomic()
      Layer 4: Strict Idempotency Check (if order.payment_status == PAID, return 200 OK immediately)
      Layer 5: Transition order state to PAID and trigger notification dispatch
    """
    signature = request.headers.get("x-chapa-signature") or request.headers.get("X-Chapa-Signature")
    if not ChapaClient.verify_webhook_signature(request.body, signature):
        logger.warning(f"Chapa webhook REJECTED: Invalid HMAC signature from {request.META.get('REMOTE_ADDR')}")
        return Response(
            {"error": "Unauthorized signature"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload = request.data
    tx_ref = payload.get("tx_ref") or payload.get("trx_ref") or payload.get("reference")
    if not tx_ref:
        return Response({"error": "Missing transaction reference"}, status=status.HTTP_400_BAD_REQUEST)

    lock_key = f"lock:payment:chapa:webhook:{tx_ref}"
    try:
        with acquire_redis_lock(lock_key, timeout=20):
            with transaction.atomic():
                # Locate order by transaction_reference or order_number encoded in tx_ref
                order = None
                query = Q(transaction_reference=tx_ref)
                if "-" in tx_ref:
                    # tx_ref format: GECH-ORD-12345-XXXX
                    parts = tx_ref.split("-")
                    if len(parts) >= 3:
                        order_num = f"{parts[1]}-{parts[2]}"
                        query |= Q(order_number=order_num)

                order = Order.objects.select_for_update().filter(query).first()
                if not order:
                    logger.error(f"Webhook received for unknown transaction ref: {tx_ref}")
                    return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

                # Strict Idempotency check
                if order.payment_status == OrderPaymentStatus.PAID:
                    logger.info(f"Webhook already processed for Order #{order.order_number} ({tx_ref})")
                    return Response({"status": "already_processed", "order_id": str(order.id)}, status=status.HTTP_200_OK)

                event_status = payload.get("status", "").lower()
                if event_status in ("success", "paid", "completed"):
                    order.payment_status = OrderPaymentStatus.PAID
                    order.transaction_reference = tx_ref
                    order.save(update_fields=["payment_status", "transaction_reference", "updated_at"])

                    # Log Stock Movement Audit entries
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

                    # Credit seller escrow for each sub-order
                    for sub_order in order.sub_orders.all():
                        try:
                            WalletService.credit_escrow(sub_order)
                        except Exception as e:
                            logger.error(f"Error crediting escrow for sub_order {sub_order.id}: {e}")

                    # Dispatch notifications
                    if order.customer:
                        NotificationService.send_notification(
                            user=order.customer,
                            type=Notification.NotificationType.ORDER_UPDATE,
                            title="Payment Successful",
                            message=f"Your payment for order #{order.order_number} was successfully confirmed.",
                            related_link=f"/customer/orders/{order.id}",
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

                    logger.info(f"Payment CONFIRMED for Order #{order.order_number} via Chapa webhook ({tx_ref})")
                    return Response({"status": "success", "order_id": str(order.id)}, status=status.HTTP_200_OK)

                elif event_status in ("failed", "cancelled"):
                    order.payment_status = OrderPaymentStatus.FAILED
                    order.save(update_fields=["payment_status", "updated_at"])
                    logger.warning(f"Payment FAILED for Order #{order.order_number} via Chapa webhook ({tx_ref})")
                    return Response({"status": "payment_failed"}, status=status.HTTP_200_OK)

                return Response({"status": "received", "event_status": event_status}, status=status.HTTP_200_OK)

    except ConcurrentTransactionError:
        logger.info(f"Concurrent webhook in-flight for tx_ref: {tx_ref}")
        return Response({"status": "processing_in_progress"}, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def verify_transaction_view(request, tx_ref: str):
    """
    Direct server-to-server transaction verification proxy.
    Automatically confirms and transitions order to PAID on Chapa success.
    """
    result = ChapaClient.verify_transaction(tx_ref)
    
    # Check if verification succeeded
    is_success = (
        result.get("status") == "success"
        and result.get("data", {}).get("status") in ("success", "paid")
    ) or (result.get("status") == "success" and not result.get("data"))

    if is_success:
        with transaction.atomic():
            order = None
            query = Q(transaction_reference=tx_ref)
            if "-" in tx_ref:
                parts = tx_ref.split("-")
                if len(parts) >= 3:
                    order_num = f"{parts[1]}-{parts[2]}"
                    query |= Q(order_number=order_num)

            order = Order.objects.select_for_update().filter(query).first()
            if order and order.payment_status != OrderPaymentStatus.PAID:
                order.payment_status = OrderPaymentStatus.PAID
                order.transaction_reference = tx_ref
                order.save(update_fields=["payment_status", "transaction_reference", "updated_at"])

                # Log Stock Movement Audit
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
                                    notes=f"Order {order.order_number} Paid (Direct Verification).",
                                )
                            except WarehouseStock.DoesNotExist:
                                pass

                # Credit seller escrow for each sub-order
                for sub_order in order.sub_orders.all():
                    try:
                        WalletService.credit_escrow(sub_order)
                    except Exception as e:
                        logger.error(f"Error crediting escrow for sub_order {sub_order.id}: {e}")

                # Notifications
                if order.customer:
                    NotificationService.send_notification(
                        user=order.customer,
                        type=Notification.NotificationType.ORDER_UPDATE,
                        title="Payment Successful",
                        message=f"Your payment for order #{order.order_number} was successfully confirmed.",
                        related_link=f"/customer/orders/{order.id}",
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

    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_supported_banks_view(request):
    """
    Retrieves the list of supported Ethiopian banks and mobile money rails (cached 24h).
    """
    force_refresh = request.query_params.get("refresh", "").lower() in ("true", "1")
    banks = ChapaClient.get_supported_banks(force_refresh=force_refresh)
    return Response({"success": True, "banks": banks})
