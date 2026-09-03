from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.promotions.views import SellerPromotionViewSet, AdminPromotionViewSet, CouponValidationView

router = DefaultRouter()
router.register(r'seller/promotions', SellerPromotionViewSet, basename='seller-promotions')
router.register(r'admin/promotions', AdminPromotionViewSet, basename='admin-promotions')

urlpatterns = [
    path('promotions/validate-coupon/', CouponValidationView.as_view(), name='validate-coupon'),
    path('', include(router.urls)),
]
