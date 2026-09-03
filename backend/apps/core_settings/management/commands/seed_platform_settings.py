"""
Management command: python manage.py seed_platform_settings
Seeds platform economics and defaults.
"""

from django.core.management.base import BaseCommand
from apps.core_settings.services import SettingsService


class Command(BaseCommand):
    help = "Seeds database with default platform configuration settings."

    def handle(self, *args, **options):
        self.stdout.write("Seeding platform settings...")
        SettingsService.seed_defaults()
        self.stdout.write(self.style.SUCCESS("Successfully seeded default platform settings."))
