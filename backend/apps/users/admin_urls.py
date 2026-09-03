"""
apps/users/admin_urls.py
========================
Admin routing for platform customer management, KYC, and stats.
"""

from django.urls import path
from .views import (
    AdminCustomerListView,
    AdminCustomerStatsView,
    AdminCustomerDetailView,
    AdminCustomerToggleStatusView,
    AdminCustomerVerifyEmailView,
)

urlpatterns = [
    path("", AdminCustomerListView.as_view(), name="admin-customer-list"),
    path("stats/", AdminCustomerStatsView.as_view(), name="admin-customer-stats"),
    path("<uuid:pk>/", AdminCustomerDetailView.as_view(), name="admin-customer-detail"),
    path("<uuid:pk>/toggle-status/", AdminCustomerToggleStatusView.as_view(), name="admin-customer-toggle-status"),
    path("<uuid:pk>/verify-email/", AdminCustomerVerifyEmailView.as_view(), name="admin-customer-verify-email"),
]
