"""
apps/payments/urls.py
=====================
URL routes for Chapa Payment Gateway & Webhook verification.
"""

from django.urls import path
from . import views

urlpatterns = [
    path("chapa/webhook/", views.handle_chapa_webhook, name="chapa-webhook"),
    path("verify/<str:tx_ref>/", views.verify_transaction_view, name="chapa-verify"),
    path("banks/", views.get_supported_banks_view, name="chapa-banks"),
]
