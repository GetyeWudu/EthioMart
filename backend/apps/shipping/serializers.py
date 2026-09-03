from rest_framework import serializers
from .models import ShippingZone, ZoneSubCity, ShippingZoneRate, Shipment, ShipmentEvent


class ZoneSubCitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoneSubCity
        fields = ['id', 'name', 'code']


class ShippingZoneRateSerializer(serializers.ModelSerializer):
    shipping_class_display = serializers.CharField(source='get_shipping_class_display', read_only=True)

    class Meta:
        model = ShippingZoneRate
        fields = [
            'id',
            'shipping_class',
            'shipping_class_display',
            'base_fee',
            'per_kg_rate',
            'estimated_days_min',
            'estimated_days_max',
        ]


class ShippingZoneSerializer(serializers.ModelSerializer):
    sub_cities = ZoneSubCitySerializer(many=True, read_only=True)
    rates = ShippingZoneRateSerializer(many=True, read_only=True)

    class Meta:
        model = ShippingZone
        fields = ['id', 'name', 'code', 'is_active', 'sub_cities', 'rates']


class ShipmentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentEvent
        fields = ['status', 'location', 'description', 'created_at']


class ShipmentTrackingSerializer(serializers.ModelSerializer):
    events = ShipmentEventSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = ['tracking_number', 'carrier_name', 'status', 'current_location', 'events']


class ShippingCalculateRequestSerializer(serializers.Serializer):
    zone_id = serializers.UUIDField()
    cart_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
