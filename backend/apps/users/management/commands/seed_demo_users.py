"""
Management command: python manage.py seed_demo_users
Creates pre-configured demo users for UI testing.
"""

from django.core.management.base import BaseCommand
from apps.users.models import CustomUser
from apps.core_settings.services import SettingsService


class Command(BaseCommand):
    help = "Seeds database with demo accounts for Super Admin, Ops Admin, Seller, and Customer."

    def handle(self, *args, **options):
        self.stdout.write("Seeding platform settings & demo accounts...")
        SettingsService.seed_defaults()

        demo_users = [
            {
                "email": "admin@gechexpress.com",
                "password": "password123",
                "first_name": "Super",
                "last_name": "Admin",
                "role": CustomUser.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
            },
            {
                "email": "ops@gechexpress.com",
                "password": "password123",
                "first_name": "Operational",
                "last_name": "Admin",
                "role": CustomUser.Role.ADMIN,
                "is_staff": True,
                "is_superuser": False,
                "is_email_verified": True,
            },
            {
                "email": "seller@gechexpress.com",
                "password": "password123",
                "first_name": "Sara",
                "last_name": "Hailu (Seller)",
                "phone_number": "+251911223344",
                "role": CustomUser.Role.SELLER,
                "is_staff": False,
                "is_superuser": False,
                "is_email_verified": True,
            },
            {
                "email": "customer@gechexpress.com",
                "password": "password123",
                "first_name": "Abebe",
                "last_name": "Bikila (Customer)",
                "phone_number": "+251922334455",
                "role": CustomUser.Role.CUSTOMER,
                "is_staff": False,
                "is_superuser": False,
                "is_email_verified": True,
            },
        ]

        for u in demo_users:
            email = u["email"]
            if not CustomUser.objects.filter(email=email).exists():
                CustomUser.objects.create_user(**u)
                self.stdout.write(self.style.SUCCESS(f"Created: {email} ({u['role']})"))
            else:
                self.stdout.write(f"Already exists: {email}")

        self.stdout.write(self.style.SUCCESS("All demo accounts ready for UI login."))
