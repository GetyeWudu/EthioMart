from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.shipping.models import ShippingZone, ShippingZoneRate
from apps.shipping.enums import ShippingClass


class Command(BaseCommand):
    help = "Seed tiered Ethiopian shipping zones and realistic inter-city rate matrix"

    def handle(self, *args, **options):
        zones_data = [
            {"code": "ADD", "name": "Addis Ababa"},
            {"code": "BHR", "name": "Bahir Dar"},
            {"code": "GDR", "name": "Gondar"},
            {"code": "ADDIS-C", "name": "Addis Ababa - Central"},
            {"code": "ADDIS-O", "name": "Addis Ababa - Outskirts"},
            {"code": "OROMIA", "name": "Oromia Region"},
            {"code": "AMHARA", "name": "Amhara Region"},
            {"code": "TIGRAY", "name": "Tigray Region"},
            {"code": "SIDAMA", "name": "Sidama Region"},
        ]

        rates_matrix = {
            "ADD": {
                ShippingClass.STANDARD: {"base_fee": Decimal("100.00"), "per_kg_rate": Decimal("20.00"), "min_days": 1, "max_days": 1},
                ShippingClass.HEAVY: {"base_fee": Decimal("300.00"), "per_kg_rate": Decimal("35.00"), "min_days": 1, "max_days": 2},
                ShippingClass.BULKY: {"base_fee": Decimal("800.00"), "per_kg_rate": Decimal("50.00"), "min_days": 2, "max_days": 3},
                ShippingClass.FRAGILE: {"base_fee": Decimal("150.00"), "per_kg_rate": Decimal("25.00"), "min_days": 1, "max_days": 2},
            },
            "BHR": {
                ShippingClass.STANDARD: {"base_fee": Decimal("250.00"), "per_kg_rate": Decimal("30.00"), "min_days": 2, "max_days": 3},
                ShippingClass.HEAVY: {"base_fee": Decimal("600.00"), "per_kg_rate": Decimal("45.00"), "min_days": 3, "max_days": 5},
                ShippingClass.BULKY: {"base_fee": Decimal("1800.00"), "per_kg_rate": Decimal("60.00"), "min_days": 4, "max_days": 6},
                ShippingClass.FRAGILE: {"base_fee": Decimal("320.00"), "per_kg_rate": Decimal("35.00"), "min_days": 2, "max_days": 4},
            },
            "GDR": {
                ShippingClass.STANDARD: {"base_fee": Decimal("280.00"), "per_kg_rate": Decimal("35.00"), "min_days": 3, "max_days": 4},
                ShippingClass.HEAVY: {"base_fee": Decimal("700.00"), "per_kg_rate": Decimal("50.00"), "min_days": 4, "max_days": 6},
                ShippingClass.BULKY: {"base_fee": Decimal("2200.00"), "per_kg_rate": Decimal("70.00"), "min_days": 5, "max_days": 7},
                ShippingClass.FRAGILE: {"base_fee": Decimal("360.00"), "per_kg_rate": Decimal("40.00"), "min_days": 3, "max_days": 5},
            },
            "ADDIS-C": {
                ShippingClass.STANDARD: {"base_fee": Decimal("100.00"), "per_kg_rate": Decimal("20.00"), "min_days": 1, "max_days": 1},
                ShippingClass.HEAVY: {"base_fee": Decimal("300.00"), "per_kg_rate": Decimal("35.00"), "min_days": 1, "max_days": 2},
                ShippingClass.BULKY: {"base_fee": Decimal("800.00"), "per_kg_rate": Decimal("50.00"), "min_days": 2, "max_days": 3},
                ShippingClass.FRAGILE: {"base_fee": Decimal("150.00"), "per_kg_rate": Decimal("25.00"), "min_days": 1, "max_days": 2},
            },
            "ADDIS-O": {
                ShippingClass.STANDARD: {"base_fee": Decimal("130.00"), "per_kg_rate": Decimal("22.00"), "min_days": 1, "max_days": 2},
                ShippingClass.HEAVY: {"base_fee": Decimal("350.00"), "per_kg_rate": Decimal("38.00"), "min_days": 2, "max_days": 3},
                ShippingClass.BULKY: {"base_fee": Decimal("950.00"), "per_kg_rate": Decimal("55.00"), "min_days": 3, "max_days": 5},
                ShippingClass.FRAGILE: {"base_fee": Decimal("180.00"), "per_kg_rate": Decimal("28.00"), "min_days": 1, "max_days": 3},
            },
            "OROMIA": {
                ShippingClass.STANDARD: {"base_fee": Decimal("180.00"), "per_kg_rate": Decimal("25.00"), "min_days": 2, "max_days": 3},
                ShippingClass.HEAVY: {"base_fee": Decimal("450.00"), "per_kg_rate": Decimal("40.00"), "min_days": 3, "max_days": 5},
                ShippingClass.BULKY: {"base_fee": Decimal("1400.00"), "per_kg_rate": Decimal("55.00"), "min_days": 4, "max_days": 6},
                ShippingClass.FRAGILE: {"base_fee": Decimal("240.00"), "per_kg_rate": Decimal("30.00"), "min_days": 2, "max_days": 4},
            },
            "AMHARA": {
                ShippingClass.STANDARD: {"base_fee": Decimal("250.00"), "per_kg_rate": Decimal("30.00"), "min_days": 2, "max_days": 3},
                ShippingClass.HEAVY: {"base_fee": Decimal("600.00"), "per_kg_rate": Decimal("45.00"), "min_days": 3, "max_days": 5},
                ShippingClass.BULKY: {"base_fee": Decimal("1800.00"), "per_kg_rate": Decimal("60.00"), "min_days": 4, "max_days": 6},
                ShippingClass.FRAGILE: {"base_fee": Decimal("320.00"), "per_kg_rate": Decimal("35.00"), "min_days": 2, "max_days": 4},
            },
            "TIGRAY": {
                ShippingClass.STANDARD: {"base_fee": Decimal("300.00"), "per_kg_rate": Decimal("40.00"), "min_days": 4, "max_days": 6},
                ShippingClass.HEAVY: {"base_fee": Decimal("800.00"), "per_kg_rate": Decimal("55.00"), "min_days": 5, "max_days": 8},
                ShippingClass.BULKY: {"base_fee": Decimal("2500.00"), "per_kg_rate": Decimal("75.00"), "min_days": 7, "max_days": 10},
                ShippingClass.FRAGILE: {"base_fee": Decimal("400.00"), "per_kg_rate": Decimal("45.00"), "min_days": 4, "max_days": 7},
            },
            "SIDAMA": {
                ShippingClass.STANDARD: {"base_fee": Decimal("220.00"), "per_kg_rate": Decimal("28.00"), "min_days": 2, "max_days": 4},
                ShippingClass.HEAVY: {"base_fee": Decimal("550.00"), "per_kg_rate": Decimal("42.00"), "min_days": 3, "max_days": 5},
                ShippingClass.BULKY: {"base_fee": Decimal("1600.00"), "per_kg_rate": Decimal("58.00"), "min_days": 5, "max_days": 7},
                ShippingClass.FRAGILE: {"base_fee": Decimal("280.00"), "per_kg_rate": Decimal("32.00"), "min_days": 2, "max_days": 4},
            },
        }

        created_zones = 0
        created_rates = 0

        for z_data in zones_data:
            zone, _ = ShippingZone.objects.get_or_create(
                code=z_data["code"],
                defaults={"name": z_data["name"], "is_active": True},
            )
            zone.name = z_data["name"]
            zone.is_active = True
            zone.save()
            created_zones += 1

            if zone.code in rates_matrix:
                for s_class, rate_info in rates_matrix[zone.code].items():
                    rate, _ = ShippingZoneRate.objects.update_or_create(
                        zone=zone,
                        shipping_class=s_class,
                        defaults={
                            "base_fee": rate_info["base_fee"],
                            "per_kg_rate": rate_info["per_kg_rate"],
                            "estimated_days_min": rate_info["min_days"],
                            "estimated_days_max": rate_info["max_days"],
                        },
                    )
                    created_rates += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_zones} shipping zones and {created_rates} tiered rates with realistic Ethiopian inter-city pricing."
            )
        )
