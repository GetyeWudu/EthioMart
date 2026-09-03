from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.views import OrderViewSet, SellerOrderViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'seller-orders', SellerOrderViewSet, basename='seller-order')

urlpatterns = [
    path('', include(router.urls)),
]
