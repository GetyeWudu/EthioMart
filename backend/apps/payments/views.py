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


from .services.payment_confirmation_service import PaymentConfirmationService


@api_view(["POST"])
@permission_classes([AllowAny])
def handle_chapa_webhook(request):
    """
    High-Assurance Webhook Handler (HMAC SHA-256 Signature Verification + PaymentConfirmationService)
    
    Security & Concurrency:
      - Validates HMAC SHA-256 Signature against 'x-chapa-signature'.
      - Delegates to PaymentConfirmationService which handles:
          * Distributed Redis lock
          * Authoritative Chapa Verify API re-query (checking status, amount & currency)
          * PostgreSQL select_for_update row lock
          * Strict Idempotency guard
          * Stock movement ledger & seller escrow credit
          * Notifications
    """
    signature = request.headers.get("x-chapa-signature") or request.headers.get("X-Chapa-Signature")
    if not ChapaClient.verify_webhook_signature(request.body, signature):
        logger.warning(f"Chapa webhook REJECTED: Invalid HMAC signature from {request.META.get('REMOTE_ADDR')}")
        return Response(
            {"error": "Unauthorized signature"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload = request.data or {}
    tx_ref = payload.get("tx_ref") or payload.get("trx_ref") or payload.get("reference")
    if not tx_ref:
        return Response({"error": "Missing transaction reference"}, status=status.HTTP_400_BAD_REQUEST)

    result = PaymentConfirmationService.confirm_order_payment(tx_ref=tx_ref, source="webhook")
    return Response(result, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def verify_transaction_view(request, tx_ref: str):
    """
    Direct server-to-server transaction verification endpoint.
    Queries Chapa API, validates amount/currency, and confirms order state.
    """
    result = PaymentConfirmationService.confirm_order_payment(tx_ref=tx_ref, source="direct_verify")
    return Response(result, status=status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_supported_banks_view(request):
    """
    Retrieves the list of supported Ethiopian banks and mobile money rails (cached 24h).
    """
    force_refresh = request.query_params.get("refresh", "").lower() in ("true", "1")
    banks = ChapaClient.get_supported_banks(force_refresh=force_refresh)
    return Response({"success": True, "banks": banks})
