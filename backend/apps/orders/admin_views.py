from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Order.objects.all().prefetch_related(
            'sub_orders__items__variant__product', 
            'sub_orders__vendor', 
            'customer'
        )
