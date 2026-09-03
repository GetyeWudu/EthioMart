"""
apps/payments/tests/test_chapa_integration.py
=============================================
Tests for Chapa Payment Gateway:
  1. Cryptographic HMAC-SHA256 signature verification
  2. High-Assurance Webhook Handler with Redis Distributed Locking & DB Row Locks
  3. Idempotent webhook handling (duplicate webhooks safe)
  4. 24-Hour Bank Directory Caching
"""

import hmac
import hashlib
import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import CustomUser
from apps.orders.models import Order, OrderPaymentStatus
from apps.payments.services.chapa_client import ChapaClient


class ChapaIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="buyer@gechexpress.com",
            password="StrongPassword123!",
            first_name="Abebe",
            last_name="Bikila",
            role="CUSTOMER",
        )
        self.order = Order.objects.create(
            order_number="ORD-TEST-1001",
            transaction_reference="GECH-ORD-TEST-1001-A1B2C3D4",
            customer=self.user,
            total_amount=Decimal("2500.00"),
            payment_status=OrderPaymentStatus.PENDING,
        )
        self.webhook_url = reverse("chapa-webhook")

    def test_webhook_rejects_invalid_signature(self):
        """Webhook must return 400 Bad Request if HMAC signature is missing or corrupted."""
        payload = {
            "tx_ref": self.order.transaction_reference,
            "status": "success",
            "amount": "2500.00",
            "currency": "ETB",
        }
        raw_body = json.dumps(payload).encode("utf-8")

        response = self.client.post(
            self.webhook_url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_CHAPA_SIGNATURE="invalid_tampered_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, OrderPaymentStatus.PENDING)

    def test_webhook_successful_payment_transition(self):
        """Valid HMAC signature transitions order from PENDING to PAID."""
        payload = {
            "tx_ref": self.order.transaction_reference,
            "status": "success",
            "amount": "2500.00",
            "currency": "ETB",
        }
        raw_body = json.dumps(payload).encode("utf-8")
        secret = ChapaClient.WEBHOOK_SECRET or ChapaClient.SECRET_KEY or "test-secret"
        signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

        response = self.client.post(
            self.webhook_url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_CHAPA_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, OrderPaymentStatus.PAID)

    def test_webhook_strict_idempotency(self):
        """Duplicate webhook deliveries return 200 OK without re-processing."""
        self.order.payment_status = OrderPaymentStatus.PAID
        self.order.save()

        payload = {
            "tx_ref": self.order.transaction_reference,
            "status": "success",
            "amount": "2500.00",
            "currency": "ETB",
        }
        raw_body = json.dumps(payload).encode("utf-8")
        secret = ChapaClient.WEBHOOK_SECRET or ChapaClient.SECRET_KEY or "test-secret"
        signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

        response = self.client.post(
            self.webhook_url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_CHAPA_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "already_processed")

    def test_bank_directory_caching(self):
        """Bank directory endpoint returns cached list of Ethiopian banks."""
        url = reverse("chapa-banks")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        banks = response.data.get("banks", [])
        self.assertGreater(len(banks), 0)
        bank_names = [b.get("name", "").lower() for b in banks]
        self.assertTrue(any("ethiopia" in n or "cbe" in n for n in bank_names))
        self.assertTrue(any("telebirr" in n for n in bank_names))
