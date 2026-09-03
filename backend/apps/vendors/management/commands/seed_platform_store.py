"""
apps/vendors/management/commands/seed_platform_store.py
=========================================================
Idempotent seeder for the official GechExpress Direct first-party store.

Usage:
    python manage.py seed_platform_store
"""

from django.core.management.base import BaseCommand
from apps.vendors.services import VendorService


class Command(BaseCommand):
    help = "Seeds or updates the official GechExpress Direct first-party platform store."

    def handle(self, *args, **options):
        self.stdout.write("Seeding GechExpress Direct platform store...")
        try:
            vendor = VendorService.seed_platform_store()
            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Platform store '{vendor.store_name}' seeded successfully. "
                    f"[status={vendor.status}, slug={vendor.slug}]"
                )
            )
        except RuntimeError as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Seed failed: {e}"))
            raise
