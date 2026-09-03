"""
apps/vendors/urls.py
======================
URL routing for all vendor endpoints across all three access layers.
"""

from django.urls import path
from . import views

# ─── Seller Self-Service (/api/v1/vendors/me/) ───────────────────────────────
seller_urlpatterns = [
    path("me/",                        views.SellerProfileView.as_view(),       name="vendor-me"),
    path("me/analytics/",              views.SellerAnalyticsOverviewView.as_view(), name="vendor-me-analytics"),
    path("me/wallet/",                 views.SellerWalletView.as_view(),         name="vendor-me-wallet"),
    path("me/wallet/withdraw/",        views.SellerWithdrawalView.as_view(),     name="vendor-me-withdraw"),
    path("me/payouts/",                views.SellerPayoutRequestListView.as_view(), name="vendor-me-payouts"),
    path("me/ledger/",                 views.SellerLedgerListView.as_view(),     name="vendor-me-ledger"),
    path("me/kyc/",                    views.SellerKYCSubmitView.as_view(),      name="vendor-me-kyc"),
    path("me/bank/",                   views.SellerBankDetailsView.as_view(),    name="vendor-me-bank"),
    path("me/documents/",              views.SellerDocumentListView.as_view(),   name="vendor-me-documents"),
    path("me/documents/<uuid:doc_id>/",views.SellerDocumentDetailView.as_view(),name="vendor-me-document-detail"),
    path("staff/",                     views.SellerStaffListCreateAPIView.as_view(), name="vendor-staff-list"),
    path("staff/<uuid:pk>/",           views.SellerStaffDetailAPIView.as_view(), name="vendor-staff-detail"),
    path("staff/invite-details/",      views.SellerStaffInviteDetailsAPIView.as_view(), name="vendor-staff-invite-details"),
    path("staff/accept-invite/",       views.SellerStaffAcceptInviteAPIView.as_view(), name="vendor-staff-accept-invite"),
]

# ─── Public Storefront (/api/v1/vendors/) ────────────────────────────────────
public_urlpatterns = [
    path("",             views.PublicStoreListView.as_view(),   name="vendor-public-list"),
    path("<slug:slug>/", views.PublicStoreDetailView.as_view(), name="vendor-public-detail"),
]

urlpatterns = seller_urlpatterns + public_urlpatterns
