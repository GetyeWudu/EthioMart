from django.test import TestCase
from apps.core_settings.models import PlatformSetting
from apps.core_settings.services import SettingsService

class PlatformSettingsTests(TestCase):
    def test_seed_defaults(self):
        SettingsService.seed_defaults()
        currency = SettingsService.get("default_currency")
        self.assertEqual(currency, "ETB")
        escrow = SettingsService.get("escrow_hold_hours")
        self.assertEqual(escrow, 48)
