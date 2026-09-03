"""
Management command: python manage.py createsuperadmin
Interactively or non-interactively creates a Super Admin.
"""

from django.core.management.base import BaseCommand
from apps.users.models import CustomUser


class Command(BaseCommand):
    help = "Creates a Super Admin user with role=ADMIN, is_staff=True, and is_superuser=True."

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Super admin email")
        parser.add_argument("--password", type=str, help="Super admin password")
        parser.add_argument("--first-name", type=str, default="Super", help="First name")
        parser.add_argument("--last-name", type=str, default="Admin", help="Last name")
        parser.add_argument("--phone", type=str, default="+251900000000", help="Phone number")

    def handle(self, *args, **options):
        email = options.get("email") or input("Email: ").strip()
        password = options.get("password") or input("Password: ").strip()
        first_name = options.get("first_name") or "Super"
        last_name = options.get("last_name") or "Admin"
        phone = options.get("phone") or "+251900000000"

        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User with email '{email}' already exists."))
            return

        user = CustomUser.objects.create_superuser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            role=CustomUser.Role.ADMIN,
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully created Super Admin user: {user.email} (ID: {user.id})"))
