from django.db import models
from apps.common.models import BaseModel
from apps.orders.models import VendorSubOrder
from .enums import ShippingClass


class ShippingZone(BaseModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class ZoneSubCity(BaseModel):
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='sub_cities')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30, blank=True)

    class Meta:
        unique_together = ('zone', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.zone.name})"


class ShippingZoneRate(BaseModel):
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='rates')
    shipping_class = models.CharField(max_length=20, choices=ShippingClass.choices)
    base_fee = models.DecimalField(max_digits=10, decimal_places=2)
    per_kg_rate = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_days_min = models.PositiveSmallIntegerField(default=1)
    estimated_days_max = models.PositiveSmallIntegerField(default=3)

    class Meta:
        unique_together = ('zone', 'shipping_class')
        ordering = ['zone', 'shipping_class']

    def __str__(self):
        return f"{self.zone.name} - {self.get_shipping_class_display()} (Base: {self.base_fee} ETB, {self.per_kg_rate} ETB/kg)"


class ShipmentStatus(models.TextChoices):
    PROCESSING = 'PROCESSING', 'Processing'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
    DELIVERED = 'DELIVERED', 'Delivered'


class Shipment(BaseModel):
    sub_order = models.OneToOneField(VendorSubOrder, on_delete=models.CASCADE, related_name='shipment')
    tracking_number = models.CharField(max_length=64, unique=True)
    carrier_name = models.CharField(max_length=100, default='GechExpress Logistics')
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ShipmentStatus.choices, default=ShipmentStatus.PROCESSING)
    current_location = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Shipment {self.tracking_number} for {self.sub_order.id}"


class ShipmentEvent(BaseModel):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='events')
    status = models.CharField(max_length=20, choices=ShipmentStatus.choices)
    location = models.CharField(max_length=150)
    description = models.CharField(max_length=255)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.status} at {self.location} on {self.created_at}"
