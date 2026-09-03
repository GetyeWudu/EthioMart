from django.urls import path
from apps.disputes.views import (
    CustomerDisputeCreateView,
    CustomerDisputeListView,
    SellerDisputeListView,
    SellerDisputeAcceptView,
    AdminDisputeListView,
    AdminDisputeResolutionView,
)

app_name = 'disputes'

urlpatterns = [
    # Customer endpoints
    path('orders/<uuid:sub_order_id>/dispute/', CustomerDisputeCreateView.as_view(), name='customer-dispute-create'),
    path('customer/disputes/', CustomerDisputeListView.as_view(), name='customer-dispute-list'),

    # Seller endpoints
    path('seller/disputes/', SellerDisputeListView.as_view(), name='seller-dispute-list'),
    path('seller/disputes/<uuid:pk>/accept/', SellerDisputeAcceptView.as_view(), name='seller-dispute-accept'),

    # Admin endpoints
    path('admin/disputes/', AdminDisputeListView.as_view(), name='admin-dispute-list'),
    path('admin/disputes/<uuid:pk>/resolve/', AdminDisputeResolutionView.as_view(), name='admin-dispute-resolve'),
]
