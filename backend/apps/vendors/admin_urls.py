"""
apps/vendors/admin_urls.py
===========================
Admin moderation URL routing for /api/v1/admin/vendors/.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("",                                         views.AdminVendorListView.as_view(),       name="admin-vendor-list"),
    path("<uuid:vendor_id>/",                        views.AdminVendorDetailView.as_view(),     name="admin-vendor-detail"),
    path("<uuid:vendor_id>/approve/",                views.AdminVendorApproveView.as_view(),    name="admin-vendor-approve"),
    path("<uuid:vendor_id>/reject/",                 views.AdminVendorRejectView.as_view(),     name="admin-vendor-reject"),
    path("<uuid:vendor_id>/suspend/",                views.AdminVendorSuspendView.as_view(),    name="admin-vendor-suspend"),
    path("<uuid:vendor_id>/reactivate/",             views.AdminVendorReactivateView.as_view(), name="admin-vendor-reactivate"),
    path("<uuid:vendor_id>/commission/",             views.AdminVendorCommissionView.as_view(), name="admin-vendor-commission"),
    path("<uuid:vendor_id>/retry-chapa/",            views.AdminVendorRetryChapаView.as_view(), name="admin-vendor-retry-chapa"),
    path("commissions/",                             views.AdminCommissionsListView.as_view(),  name="admin-commissions-list"),
]
