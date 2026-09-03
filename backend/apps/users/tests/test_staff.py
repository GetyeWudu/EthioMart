"""
apps/users/tests/test_staff.py
==============================
Tests for Staff Provisioning endpoint (/api/v1/auth/admin/staff/).
Enforces: Only Super Admins (is_superuser=True) can provision staff.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import CustomUser


class StaffProvisioningTests(APITestCase):
    def setUp(self):
        # Super Admin
        self.super_admin = CustomUser.objects.create_superuser(
            email="superadmin@gechexpress.com",
            password="SuperPassword123!",
            first_name="Super",
            last_name="Admin",
        )
        # Operational Admin
        self.ops_admin = CustomUser.objects.create_user(
            email="opsadmin@gechexpress.com",
            password="OpsPassword123!",
            first_name="Ops",
            last_name="Staff",
            role=CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=False,
        )
        # Customer
        self.customer = CustomUser.objects.create_user(
            email="customer@gechexpress.com",
            password="CustomerPassword123!",
            first_name="Regular",
            last_name="Buyer",
            role=CustomUser.Role.CUSTOMER,
        )
        self.url = reverse("auth:staff-provision")

    def test_super_admin_can_provision_operational_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        payload = {
            "first_name": "Tigist",
            "last_name": "Lemma",
            "email": "tigist.ops@gechexpress.com",
            "phone_number": "+251911000001",
            "is_superuser": False,
        }
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("temporary_password", response.data)

        # Verify created user in DB
        new_staff = CustomUser.objects.get(email="tigist.ops@gechexpress.com")
        self.assertEqual(new_staff.role, CustomUser.Role.ADMIN)
        self.assertTrue(new_staff.is_staff)
        self.assertFalse(new_staff.is_superuser)
        self.assertTrue(new_staff.is_operational_admin)

    def test_super_admin_can_provision_another_super_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        payload = {
            "first_name": "Haile",
            "last_name": "Gebrselassie",
            "email": "haile.exec@gechexpress.com",
            "is_superuser": True,
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        new_su = CustomUser.objects.get(email="haile.exec@gechexpress.com")
        self.assertTrue(new_su.is_superuser)
        self.assertTrue(new_su.is_super_admin)

    def test_operational_admin_forbidden_from_provisioning_staff(self):
        self.client.force_authenticate(user=self.ops_admin)
        payload = {
            "first_name": "Unauthorized",
            "last_name": "Attempt",
            "email": "fail@gechexpress.com",
            "is_superuser": False,
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_forbidden_from_provisioning_staff(self):
        self.client.force_authenticate(user=self.customer)
        payload = {
            "first_name": "Hacker",
            "last_name": "Attempt",
            "email": "hacker@gechexpress.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
