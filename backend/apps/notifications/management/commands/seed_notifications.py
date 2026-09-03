from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds initial sample notifications for all users so the notification bell is testable."

    def handle(self, *args, **options):
        users = User.objects.all()
        created_count = 0
        for user in users:
            if not Notification.objects.filter(user=user).exists():
                Notification.objects.create(
                    user=user,
                    type="SYSTEM_ALERT",
                    title="Welcome to GechExpress! 🎉",
                    message="Your account is active. Explore multi-vendor marketplace features, orders, and wallet tracking.",
                    related_link="/",
                    is_read=False
                )
                Notification.objects.create(
                    user=user,
                    type="ORDER_UPDATE",
                    title="Escrow & Protection Enabled 🛡️",
                    message="All orders are protected by a 48-hour delivery clearance window and automated escrow settlement.",
                    related_link="/customer/orders" if user.role == "CUSTOMER" else "/seller/orders",
                    is_read=False
                )
                created_count += 2
        self.stdout.write(self.style.SUCCESS(f"Successfully created {created_count} sample notifications."))
