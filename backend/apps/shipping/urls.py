from django.urls import path
from .views import ShippingZoneListView, ShippingCalculateFeeView, ShipmentTrackingView

urlpatterns = [
    path('zones/', ShippingZoneListView.as_view(), name='shipping-zones'),
    path('calculate-fee/', ShippingCalculateFeeView.as_view(), name='shipping-calculate-fee'),
    path('track/<str:tracking_number>/', ShipmentTrackingView.as_view(), name='shipment-track'),
]
