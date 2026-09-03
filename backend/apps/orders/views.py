from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.exceptions import ValidationError
from apps.orders.models import Order, VendorSubOrder
from apps.orders.serializers import OrderSerializer, VendorSubOrderSerializer
from apps.orders.services.checkout_service import CheckoutService
from apps.orders.services.chapa_service import ChapaPaymentService
from apps.vendors.services.wallet_service import WalletService
from apps.notifications.services import NotificationService


from apps.orders.models import Order, VendorSubOrder, OrderPaymentStatus

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ('checkout', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.all().prefetch_related('sub_orders__items__variant')
        return Order.objects.filter(customer=self.request.user).prefetch_related('sub_orders__items__variant')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Proactively verify pending transactions with Chapa on demand
        if instance.payment_status == OrderPaymentStatus.PENDING and instance.transaction_reference:
            try:
                from apps.payments.services.chapa_client import ChapaClient
                result = ChapaClient.verify_transaction(instance.transaction_reference)
                if result.get("status") == "success" and (
                    result.get("data", {}).get("status") in ("success", "paid")
                    if isinstance(result.get("data"), dict) else True
                ):
                    instance.payment_status = OrderPaymentStatus.PAID
                    instance.save(update_fields=["payment_status", "updated_at"])
                    from apps.vendors.services.wallet_service import WalletService
                    for sub_order in instance.sub_orders.all():
                        try:
                            WalletService.credit_escrow(sub_order)
                        except Exception:
                            pass
            except Exception:
                pass
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        if request.user.is_authenticated and not request.user.is_active:
            return Response(
                {"detail": "Your account is suspended. Checkout is disabled."},
                status=status.HTTP_403_FORBIDDEN
            )

        cart_id = request.data.get('cart_id')
        delivery_method = request.data.get('delivery_method', 'DOORSTEP')
        shipping_address = request.data.get('shipping_address')
        coupon_code = request.data.get('coupon_code')
        zone_id = request.data.get('zone_id')

        if not cart_id:
            return Response({"detail": "cart_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not zone_id and delivery_method == 'DOORSTEP':
            return Response({"detail": "zone_id is required for doorstep delivery."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                order = CheckoutService.process_checkout(
                    user=request.user,
                    cart_id=cart_id,
                    delivery_method=delivery_method,
                    shipping_address=shipping_address,
                    coupon_code=coupon_code,
                    zone_id=zone_id
                )

                # Initialize payment
                payment_response = ChapaPaymentService.initialize_payment(order)
                if isinstance(payment_response, dict) and payment_response.get("status") == "failed":
                    raise ValidationError(payment_response.get("message", "Payment gateway initialization failed."))

            return Response({
                "order": OrderSerializer(order).data,
                "payment": payment_response
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"An error occurred during checkout: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='retry-payment')
    def retry_payment(self, request, pk=None):
        """
        Re-initializes payment for a PENDING order without rebuilding the cart.
        """
        order = self.get_object()
        if order.payment_status != OrderPaymentStatus.PENDING:
            return Response({"detail": "This order is not pending payment."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment_response = ChapaPaymentService.initialize_payment(order)
            if isinstance(payment_response, dict) and payment_response.get("status") == "failed":
                raise ValidationError(payment_response.get("message", "Payment gateway initialization failed."))
            
            return Response({
                "order": OrderSerializer(order).data,
                "payment": payment_response
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"An error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='mock-chapa-checkout')
    def mock_chapa_checkout(self, request, pk=None):
        """
        Mock endpoint that simulates a successful payment and triggers the webhook logic.
        """
        try:
            order = ChapaPaymentService.process_webhook(pk)
            return Response({"detail": "Payment confirmed and ledger updated.", "order": OrderSerializer(order).data})
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)


class SellerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VendorSubOrderSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return VendorSubOrder.objects.none()
        
        vendor_ids = []
        if hasattr(user, 'vendor_profile'):
            vendor_ids.append(user.vendor_profile.id)
        if hasattr(user, 'vendor_staff_roles'):
            staff_ids = list(user.vendor_staff_roles.filter(is_active=True).values_list('vendor_id', flat=True))
            vendor_ids.extend(staff_ids)
        
        if not vendor_ids:
            return VendorSubOrder.objects.none()

        return (
            VendorSubOrder.objects
            .filter(vendor_id__in=vendor_ids)
            .exclude(order__payment_status='PENDING')
            .select_related('vendor', 'order', 'order__customer')
            .prefetch_related('items__variant__product', 'items__variant__attribute_values__attribute', 'items__warehouse')
            .order_by('-created_at')
        )

    @action(detail=True, methods=['post'])
    def mark_ready_for_dispatch(self, request, pk=None):
        sub_order = self.get_object()
        updated = 0
        for item in sub_order.items.filter(status__in=['PENDING', 'PROCESSING']):
            item.status = 'READY_FOR_DISPATCH'
            item.save(update_fields=['status'])
            updated += 1
        if updated == 0:
            return Response({"detail": "No items eligible for ready status."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": f"Marked {updated} item(s) ready for dispatch.", "data": VendorSubOrderSerializer(sub_order).data})

    @action(detail=True, methods=['post'])
    def mark_dispatched(self, request, pk=None):
        """
        Atomically:
          1. Transitions all READY_FOR_DISPATCH items to DISPATCHED.
          2. Hard-deducts quantity_on_hand and clears quantity_reserved on WarehouseStock.
          3. Logs StockMovement(ORDER_FULFILLMENT) for each item.
          4. Sets dispatched_at timestamp on sub-order.
          5. Credits seller pending_balance via WalletService.credit_escrow().
        """
        from apps.inventory.models import WarehouseStock, StockMovement
        from apps.inventory.enums import MovementType
        from apps.vendors.services import WalletService
        from apps.shipping.models import ShipmentEvent, ShipmentStatus

        sub_order = self.get_object()

        ready_items = list(sub_order.items.filter(status='READY_FOR_DISPATCH').select_related('variant', 'warehouse'))
        if not ready_items:
            return Response(
                {"detail": "No items in READY_FOR_DISPATCH state. Mark items ready before dispatching."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                for item in ready_items:
                    if not item.warehouse:
                        raise ValidationError(f"Item {item.id} has no warehouse assigned. Cannot dispatch.")

                    # Hard stock deduction
                    stock = WarehouseStock.objects.select_for_update().get(
                        variant=item.variant,
                        warehouse=item.warehouse,
                    )
                    stock.quantity_on_hand -= item.quantity
                    stock.quantity_reserved -= item.quantity
                    stock.quantity_on_hand = max(0, stock.quantity_on_hand)
                    stock.quantity_reserved = max(0, stock.quantity_reserved)
                    stock.save(update_fields=['quantity_on_hand', 'quantity_reserved'])

                    # Immutable stock ledger entry
                    StockMovement.objects.create(
                        warehouse=item.warehouse,
                        variant=item.variant,
                        movement_type=MovementType.ORDER_FULFILLMENT,
                        quantity_delta=-item.quantity,
                        balance_after=stock.quantity_on_hand,
                        reference_order_id=sub_order.id,
                        performed_by=request.user,
                        notes=f"Dispatched — sub-order #{str(sub_order.id)[:8].upper()}",
                    )

                    # Transition item status
                    item.status = 'DISPATCHED'
                    item.save(update_fields=['status'])

                # Stamp dispatch timestamp
                sub_order.dispatched_at = timezone.now()
                sub_order.save(update_fields=['dispatched_at'])

                # Seed ShipmentEvent if Shipment exists
                if hasattr(sub_order, 'shipment'):
                    sub_order.shipment.status = ShipmentStatus.DISPATCHED
                    sub_order.shipment.save(update_fields=['status'])
                    ShipmentEvent.objects.create(
                        shipment=sub_order.shipment,
                        status=ShipmentStatus.DISPATCHED,
                        location=sub_order.vendor.store_name,
                        description="Package handed over to local courier service"
                    )

                # Credit seller escrow (pending_balance) + create VendorLedgerEntry
                WalletService.credit_escrow(sub_order)

                # Send dispatch notification to customer
                if sub_order.order.customer:
                    NotificationService.send_notification(
                        user=sub_order.order.customer,
                        type="ORDER_UPDATE",
                        title="Package Dispatched 🚚",
                        message=f"Your package from {sub_order.vendor.store_name} for order #{sub_order.order.order_number} has been dispatched.",
                        related_link=f"/customer/orders/{sub_order.order.id}"
                    )

        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except WarehouseStock.DoesNotExist:
            return Response(
                {"detail": "Stock record not found for one or more items. Dispatch aborted."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        sub_order.refresh_from_db()
        return Response({
            "detail": f"Sub-order dispatched. {len(ready_items)} item(s) deducted from inventory. Seller escrow credited.",
            "data": VendorSubOrderSerializer(sub_order).data,
        })

    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        """
        Delivery signal endpoint.
        Callable by the authenticated seller (or courier in Sprint 3).
        Sets delivered_at timestamp. The actual escrow-to-available balance release
        is handled by the auto_settle_delivered_orders Celery Beat task after 48h.
        """
        sub_order = self.get_object()

        from apps.shipping.models import ShipmentEvent, ShipmentStatus

        with transaction.atomic():
            sub_order.items.exclude(status='CANCELLED').update(status='DELIVERED')
            sub_order.delivered_at = timezone.now()
            sub_order.save(update_fields=['delivered_at'])

            if hasattr(sub_order, 'shipment') and sub_order.shipment:
                sub_order.shipment.status = ShipmentStatus.DELIVERED
                sub_order.shipment.save(update_fields=['status'])
                ShipmentEvent.objects.create(
                    shipment=sub_order.shipment,
                    status=ShipmentStatus.DELIVERED,
                    location=sub_order.vendor.store_name,
                    description="Package delivered to customer consignee"
                )

            # Send delivery notification to customer
            if sub_order.order.customer:
                NotificationService.send_notification(
                    user=sub_order.order.customer,
                    type="ORDER_UPDATE",
                    title="Package Delivered ✅",
                    message=f"Your package from {sub_order.vendor.store_name} for order #{sub_order.order.order_number} has been delivered. You have 48 hours to inspect and report any issues.",
                    related_link=f"/customer/orders/{sub_order.order.id}"
                )

        sub_order.refresh_from_db()
        return Response({
            "detail": (
                "Order marked as delivered. Seller funds will be released to available balance "
                "after 48-hour dispute clearance window."
            ),
            "data": VendorSubOrderSerializer(sub_order).data,
        })

