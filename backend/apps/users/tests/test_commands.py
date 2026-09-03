"""
apps/users/tests/test_commands.py
=================================
Tests for management commands: seed_platform_settings and createsuperadmin.
"""

from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from apps.users.models import CustomUser
from apps.core_settings.models import PlatformSetting


class ManagementCommandsTests(TestCase):
    def test_seed_platform_settings_command(self):
        out = StringIO()
        call_command("seed_platform_settings", stdout=out)
        self.assertIn("Successfully seeded default platform settings", out.getvalue())
        self.assertTrue(PlatformSetting.objects.filter(key="base_commission_rate").exists())
        self.assertTrue(PlatformSetting.objects.filter(key="platform_name").exists())

    def test_createsuperadmin_command(self):
        out = StringIO()
        call_command(
            "createsuperadmin",
            email="cli_superadmin@gechexpress.com",
            password="CliPassword123!",
            first_name="Cli",
            last_name="Admin",
            stdout=out,
        )
        self.assertIn("Successfully created Super Admin user", out.getvalue())
        user = CustomUser.objects.get(email="cli_superadmin@gechexpress.com")
        self.assertEqual(user.role, CustomUser.Role.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("CliPassword123!"))
