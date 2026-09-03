from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.carts.views import CartViewSet, CartItemViewSet

router = DefaultRouter()
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'carts/items', CartItemViewSet, basename='cart-items')

urlpatterns = [
    path('', include(router.urls)),
]
