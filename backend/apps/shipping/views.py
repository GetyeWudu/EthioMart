from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import ShippingZone, Shipment
from .serializers import (
    ShippingZoneSerializer,
    ShipmentTrackingSerializer,
    ShippingCalculateRequestSerializer,
)
from .services import ShippingCalculator


class ShippingZoneListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ShippingZoneSerializer
    queryset = ShippingZone.objects.filter(is_active=True).prefetch_related('sub_cities', 'rates').order_by('name')


class ShippingCalculateFeeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ShippingCalculateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        zone_id = serializer.validated_data['zone_id']
        cart_items = serializer.validated_data.get('cart_items', [])

        try:
            result = ShippingCalculator.calculate(cart_items=cart_items, zone_id=zone_id)
            return Response(result, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(
                {'error': str(e.message if hasattr(e, 'message') else e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate shipping fee: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ShipmentTrackingView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ShipmentTrackingSerializer
    lookup_field = 'tracking_number'
    queryset = Shipment.objects.prefetch_related('events')
