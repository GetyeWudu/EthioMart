import os
from decouple import config
from django.db import transaction
from apps.orders.models import Order, OrderPaymentStatus
from apps.inventory.models import StockMovement
from apps.inventory.enums import MovementType
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification

from apps.payments.services.chapa_client import ChapaClient

class ChapaPaymentService:
    @staticmethod
    def initialize_payment(order, return_url=None, callback_url=None):
        """
        Initializes payment with Chapa (or mock if enabled) and records transaction_reference.
        """
        res = ChapaClient.initialize_transaction(order, return_url=return_url, callback_url=callback_url)
        data_part = res.get("data") if res else None
        if isinstance(data_part, dict) and data_part.get("tx_ref"):
            order.transaction_reference = data_part["tx_ref"]
            order.save(update_fields=["transaction_reference", "updated_at"])
        return res

    @staticmethod
    @transaction.atomic
    def process_webhook(order_id, transaction_ref=None):
        """
        Called when Chapa sends a webhook (or mock confirms payment).
        Transitions Order to PAID and finalizes stock deduction.
        """
        order = Order.objects.get(id=order_id)
        if order.payment_status == OrderPaymentStatus.PAID:
            return # Already processed

        order.payment_status = OrderPaymentStatus.PAID
        order.save(update_fields=['payment_status'])

        # Finalize stock deduction (convert reserved to actual deduction)
        # Note: Physical stock deduction is now deferred to the 'DISPATCHED' status transition.
        # At payment, we simply log the payment movement.
        for sub_order in order.sub_orders.all():
            for item in sub_order.items.all():
                # We need to find the WarehouseStock
                from apps.inventory.models import WarehouseStock
                stock = WarehouseStock.objects.select_for_update().get(
                    variant=item.variant,
                    warehouse=item.warehouse
                )
                
                # Log to immutable StockMovement ledger
                StockMovement.objects.create(
                    warehouse=item.warehouse,
                    variant=item.variant,
                    movement_type=MovementType.ORDER_FULFILLMENT,
                    quantity_delta=0,
                    balance_after=stock.quantity_on_hand,
                    reference_order_id=str(order.id),
                    notes=f"Order {order.order_number} Paid. Stock remains reserved until dispatched."
                )
                
        # Credit seller escrow for each sub-order and record immutable ledger entry
        from apps.vendors.services.wallet_service import WalletService
        for sub_order in order.sub_orders.all():
            try:
                WalletService.credit_escrow(sub_order)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed crediting escrow for sub_order {sub_order.id}: {e}")

        # Send Notifications for Payment
        if order.customer:
            NotificationService.send_notification(
                user=order.customer,
                type=Notification.NotificationType.ORDER_UPDATE,
                title="Payment Successful",
                message=f"Your payment for order {order.order_number} was successful.",
                related_link=f"/customer/orders/{order.id}"
            )
            
        for sub_order in order.sub_orders.all():
            if sub_order.vendor and sub_order.vendor.user:
                NotificationService.send_notification(
                    user=sub_order.vendor.user,
                    type=Notification.NotificationType.ORDER_UPDATE,
                    title="Order Paid",
                    message=f"Payment for Sub-Order #{sub_order.id.hex[:8].upper()} (Order {order.order_number}) has been confirmed. Please prepare for dispatch.",
                    related_link=f"/seller/orders/{sub_order.id}"
                )

        return order
