"""
apps/users/urls.py
==================
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomerRegisterView,
    SellerRegisterView,
    LoginView,
    LogoutView,
    GoogleAuthView,
    EmailVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordChangeView,
    CurrentUserView,
    StaffProvisionView,
    CustomerAddressListView,
    CustomerAddressDetailView,
    AdminCustomerListView,
    AdminCustomerStatsView,
    AdminCustomerDetailView,
    AdminCustomerToggleStatusView,
    AdminCustomerVerifyEmailView,
)

app_name = "users"

urlpatterns = [
    # Registration & Auth
    path("register/customer/", CustomerRegisterView.as_view(), name="register-customer"),
    path("register/seller/", SellerRegisterView.as_view(), name="register-seller"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("google/", GoogleAuthView.as_view(), name="google-auth"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    
    # Account Verification & Password
    path("verify-email/", EmailVerificationView.as_view(), name="verify-email"),
    path("password/reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password/reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),

    # Current User Profile
    path("me/", CurrentUserView.as_view(), name="current-user"),

    # Staff Provisioning (Super Admin)
    path("admin/staff/", StaffProvisionView.as_view(), name="staff-provision"),

    # Admin Customer Management
    path("admin/customers/", AdminCustomerListView.as_view(), name="admin-customer-list"),
    path("admin/customers/stats/", AdminCustomerStatsView.as_view(), name="admin-customer-stats"),
    path("admin/customers/<uuid:pk>/", AdminCustomerDetailView.as_view(), name="admin-customer-detail"),
    path("admin/customers/<uuid:pk>/toggle-status/", AdminCustomerToggleStatusView.as_view(), name="admin-customer-toggle-status"),
    path("admin/customers/<uuid:pk>/verify-email/", AdminCustomerVerifyEmailView.as_view(), name="admin-customer-verify-email"),

    # Addresses
    path("addresses/", CustomerAddressListView.as_view(), name="address-list"),
    path("addresses/<uuid:pk>/", CustomerAddressDetailView.as_view(), name="address-detail"),
]
