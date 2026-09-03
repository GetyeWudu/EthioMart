"""
apps/payments/admin_urls.py
===========================
Admin moderation URL routing for /api/v1/admin/payments/.
"""

from django.urls import path
from . import admin_views
from . import analytics_views

urlpatterns = [
    path("analytics/", analytics_views.AdminAnalyticsOverviewView.as_view(), name="admin-payments-analytics"),
    path("transactions/", admin_views.AdminPaymentTransactionsListView.as_view(), name="admin-payment-transactions"),
    path("escrow-summary/", admin_views.AdminEscrowSummaryView.as_view(), name="admin-payment-escrow-summary"),
    path("sync/<str:tx_ref>/", admin_views.AdminSyncChapaTransactionView.as_view(), name="admin-payment-sync"),
    path("sync-pending/", admin_views.AdminSyncAllPendingTransactionsView.as_view(), name="admin-payment-sync-pending"),
    path("payouts/", admin_views.AdminPayoutsListView.as_view(), name="admin-payment-payouts"),
    path("payouts/batch-disburse/", admin_views.AdminBatchPayoutDisburseView.as_view(), name="admin-payment-batch-disburse"),
    path("mor-report/", admin_views.AdminMoRTaxReportView.as_view(), name="admin-payment-mor-report"),
]
