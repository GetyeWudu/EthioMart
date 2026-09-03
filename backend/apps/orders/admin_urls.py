from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.admin_views import AdminOrderViewSet

from apps.vendors.views import AdminCommissionsListView
from apps.payments.analytics_views import AdminAnalyticsOverviewView

router = DefaultRouter()
router.register(r'orders', AdminOrderViewSet, basename='admin-order')

urlpatterns = [
    path('commissions/', AdminCommissionsListView.as_view(), name='admin-commissions'),
    path('analytics/', AdminAnalyticsOverviewView.as_view(), name='admin-analytics-view'),
    path('', include(router.urls)),
]
