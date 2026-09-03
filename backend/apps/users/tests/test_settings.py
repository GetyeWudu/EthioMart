"""
apps/users/tests/test_settings.py
=================================
Tests for Platform Settings & Economics (/api/v1/settings/).
Enforces: Public settings endpoint open; mutations restricted to Super Admin.
"""

from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import CustomUser
from apps.core_settings.models import PlatformSetting
from apps.core_settings.services import SettingsService


class PlatformSettingsTests(APITestCase):
    def setUp(self):
        SettingsService.seed_defaults()
        self.super_admin = CustomUser.objects.create_superuser(
            email="su.settings@gechexpress.com",
            password="SuperPassword123!",
            first_name="Super",
            last_name="Admin",
        )
        self.ops_admin = CustomUser.objects.create_user(
            email="ops.settings@gechexpress.com",
            password="OpsPassword123!",
            first_name="Ops",
            last_name="Admin",
            role=CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=False,
        )

    def test_public_settings_accessible_unauthenticated(self):
        url = reverse("core_settings:public-settings")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        settings_dict = response.data["settings"]
        
        self.assertIn("platform_name", settings_dict)
        self.assertIn("maintenance_mode", settings_dict)
        self.assertNotIn("base_commission_rate", settings_dict)  # is_public=False

    def test_super_admin_can_update_commission_rate(self):
        self.client.force_authenticate(user=self.super_admin)
        url = reverse("core_settings:admin-setting-detail", kwargs={"key": "base_commission_rate"})
        
        response = self.client.patch(url, {"value": "12.50"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["value"], "12.50")

        # Verify through service (tests cache update & DB update)
        val = SettingsService.get("base_commission_rate")
        self.assertEqual(val, Decimal("12.50"))

    def test_operational_admin_forbidden_from_updating_settings(self):
        self.client.force_authenticate(user=self.ops_admin)
        url = reverse("core_settings:admin-setting-detail", kwargs={"key": "base_commission_rate"})
        
        response = self.client.patch(url, {"value": "15.00"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
