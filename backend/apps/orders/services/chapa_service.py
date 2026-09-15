import os
from decouple import config
from django.db import transaction
from apps.orders.models import Order, OrderPaymentStatus
from apps.inventory.models import StockMovement
from apps.inventory.enums import MovementType
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification

from apps.payments.services.chapa_client import ChapaClient
from apps.payments.services.payment_confirmation_service import PaymentConfirmationService

class ChapaPaymentService:
    @staticmethod
    def initialize_payment(order, return_url=None):
        """
        Initializes payment with Chapa (or mock if enabled) and records transaction_reference.
        """
        res = ChapaClient.initialize_transaction(order, return_url=return_url)
        data_part = res.get("data") if res else None
        if isinstance(data_part, dict) and data_part.get("tx_ref"):
            order.transaction_reference = data_part["tx_ref"]
            order.save(update_fields=["transaction_reference", "updated_at"])
        return res

    @staticmethod
    def process_webhook(order_id, transaction_ref=None):
        """
        Called when Chapa sends a webhook or mock confirms payment.
        Transitions Order to PAID via the centralized PaymentConfirmationService.
        """
        order = Order.objects.get(id=order_id)
        if order.payment_status == OrderPaymentStatus.PAID:
            return order

        tx_ref = transaction_ref or order.transaction_reference or f"GECH-{order.order_number}"
        PaymentConfirmationService.confirm_order_payment(
            tx_ref=tx_ref,
            source="mock_or_service",
            skip_chapa_verify=True,
        )
        order.refresh_from_db()
        return order
