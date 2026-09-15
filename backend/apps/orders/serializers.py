from rest_framework import serializers
from apps.orders.models import Order, VendorSubOrder, OrderItem
from apps.carts.serializers import CartProductVariantSerializer
from apps.shipping.serializers import ShipmentTrackingSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    variant_details = CartProductVariantSerializer(source='variant', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'variant', 'variant_details', 'warehouse', 'quantity', 'unit_price', 'status']
        read_only_fields = ['id', 'unit_price']


class VendorSubOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    order_id = serializers.UUIDField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    created_at = serializers.DateTimeField(source='order.created_at', read_only=True)
    payment_status = serializers.CharField(source='order.payment_status', read_only=True)
    delivery_method = serializers.CharField(source='order.delivery_method', read_only=True)
    shipping_address = serializers.JSONField(source='order.shipping_address', read_only=True)
    customer = serializers.SerializerMethodField()
    derived_status = serializers.CharField(read_only=True)
    active_dispute = serializers.SerializerMethodField()
    can_dispute = serializers.SerializerMethodField()
    is_within_inspection_window = serializers.SerializerMethodField()
    inspection_expires_at = serializers.SerializerMethodField()
    escrow_hold_minutes = serializers.SerializerMethodField()
    shipment = ShipmentTrackingSerializer(read_only=True)

    class Meta:
        model = VendorSubOrder
        fields = [
            'id', 'order_id', 'vendor', 'vendor_name',
            'order_number', 'created_at', 'payment_status', 'delivery_method', 'shipping_address', 'customer',
            'sub_total', 'shipping_fee', 'coupon_code', 'discount_applied',
            'dispatched_at', 'delivered_at', 'is_payout_settled',
            'derived_status',
            'active_dispute',
            'can_dispute',
            'is_within_inspection_window',
            'inspection_expires_at',
            'escrow_hold_minutes',
            'shipment',
            'items',
        ]
        read_only_fields = ['id', 'order_id', 'sub_total', 'shipping_fee', 'dispatched_at', 'delivered_at', 'is_payout_settled']

    def get_escrow_hold_minutes(self, obj):
        try:
            from apps.core_settings.services import SettingsService
            return int(SettingsService.get("escrow_hold_minutes", default=10))
        except Exception:
            return 10

    def get_can_dispute(self, obj):
        if obj.is_payout_settled or getattr(obj, 'is_disputed', False):
            return False
        if getattr(obj, 'dispute', None):
            return False
        if obj.derived_status != 'DELIVERED' and not obj.delivered_at:
            return False
        return obj.is_within_inspection_window()

    def get_is_within_inspection_window(self, obj):
        return obj.is_within_inspection_window()

    def get_inspection_expires_at(self, obj):
        if not obj.delivered_at:
            return None
        try:
            from apps.core_settings.services import SettingsService
            from datetime import timedelta
            hold_minutes = int(SettingsService.get("escrow_hold_minutes", default=10))
            return (obj.delivered_at + timedelta(minutes=hold_minutes)).isoformat()
        except Exception:
            return None

    def get_active_dispute(self, obj):
        dispute = getattr(obj, 'dispute', None)
        if not dispute:
            return None
        return {
            'id': str(dispute.id),
            'status': dispute.status,
            'reason': dispute.reason,
        }

    def get_customer(self, obj):
        customer = getattr(obj.order, 'customer', None)
        if not customer:
            return None
        return {
            'id': str(customer.id),
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'email': customer.email,
        }


class OrderSerializer(serializers.ModelSerializer):
    sub_orders = VendorSubOrderSerializer(many=True, read_only=True)
    customer_details = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'customer', 'customer_details', 'total_amount', 'total_shipping_fee', 'payment_status', 'delivery_method', 'shipping_address', 'coupon_code', 'discount_applied', 'sub_orders', 'created_at']
        read_only_fields = ['id', 'order_number', 'customer', 'total_amount', 'total_shipping_fee', 'payment_status', 'created_at']

    def get_customer_details(self, obj):
        if not obj.customer:
            phone = obj.shipping_address.get('phone_number', '') if isinstance(obj.shipping_address, dict) else ''
            return {
                'id': None,
                'first_name': 'Guest',
                'last_name': 'Customer',
                'email': 'guest@gechexpress.com',
                'phone_number': phone,
            }
        phone = getattr(obj.customer, 'phone_number', '') or (obj.shipping_address.get('phone_number', '') if isinstance(obj.shipping_address, dict) else '')
        return {
            'id': str(obj.customer.id),
            'first_name': obj.customer.first_name or 'Customer',
            'last_name': obj.customer.last_name or '',
            'email': obj.customer.email,
            'phone_number': phone,
        }
