from rest_framework import serializers
from apps.disputes.models import Dispute
from apps.orders.serializers import OrderItemSerializer

class DisputeSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    order_number = serializers.CharField(source='sub_order.order.order_number', read_only=True)
    order_id = serializers.CharField(source='sub_order.order.id', read_only=True)
    items = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = [
            'id', 'sub_order', 'order_id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'vendor', 'vendor_name', 'reason', 'customer_notes', 'evidence_images',
            'disputed_amount', 'refund_amount', 'status', 'admin_notes', 'items',
            'resolved_by', 'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sub_order', 'order_id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'vendor', 'vendor_name', 'disputed_amount', 'refund_amount', 'status',
            'admin_notes', 'resolved_by', 'resolved_at', 'created_at', 'updated_at'
        ]

    def get_items(self, obj):
        if not obj.sub_order:
            return []
        items_data = []
        for it in obj.sub_order.items.select_related('variant__product').all():
            items_data.append({
                'id': str(it.id),
                'product_title': it.variant.product.title if it.variant and it.variant.product else "Product",
                'sku': it.variant.sku if it.variant else "",
                'unit_price': str(it.unit_price),
                'quantity': it.quantity,
                'status': it.status,
            })
        return items_data


class DisputeCreateSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=Dispute.Reason.choices)
    customer_notes = serializers.CharField(required=True)
    evidence_images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
