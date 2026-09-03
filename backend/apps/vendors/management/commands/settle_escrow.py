from django.core.management.base import BaseCommand
from apps.vendors.tasks import auto_settle_delivered_orders


class Command(BaseCommand):
    help = "Run the 5-minute automated escrow delivery settlement task to move pending funds to available balances."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Running automated delivery escrow settlement..."))
        result = auto_settle_delivered_orders()
        self.stdout.write(
            self.style.SUCCESS(
                f"Settlement complete! Processed {result.get('total_eligible', 0)} eligible orders: "
                f"{result.get('settled', 0)} settled, {result.get('failed', 0)} failed."
            )
        )
