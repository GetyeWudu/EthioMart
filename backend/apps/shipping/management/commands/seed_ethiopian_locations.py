from django.core.management.base import BaseCommand
from apps.shipping.models import ShippingZone, ZoneSubCity


class Command(BaseCommand):
    help = "Seed standardized Ethiopian administrative regions/cities and sub-cities"

    def handle(self, *args, **options):
        locations = [
            {
                "code": "ADD",
                "name": "Addis Ababa",
                "sub_cities": [
                    "Bole",
                    "Kirkos",
                    "Yeka",
                    "Arada",
                    "Lideta",
                    "Addis Ketema",
                    "Gullele",
                    "Nifas Silk-Lafto",
                    "Kolfe Keranio",
                    "Akaky Kaliti",
                    "Lemi Kura",
                ],
            },
            {
                "code": "BHR",
                "name": "Bahir Dar",
                "sub_cities": [
                    "Belay Zeleke",
                    "Fasilo",
                    "Gish Abay",
                    "Shimbit",
                    "Tana",
                    "Hidar 11",
                    "Shum Abo",
                    "Sefene Selam",
                    "Ginbot 20",
                ],
            },
            {
                "code": "GDR",
                "name": "Gondar",
                "sub_cities": [
                    "Fasil",
                    "Arada",
                    "Zobel",
                    "Maraki",
                    "Azezo",
                    "Jantekel",
                    "Adebabay Eyesus",
                ],
            },
        ]

        total_sub_cities = 0
        for loc in locations:
            zone, _ = ShippingZone.objects.get_or_create(
                code=loc["code"],
                defaults={"name": loc["name"], "is_active": True},
            )
            zone.name = loc["name"]
            zone.is_active = True
            zone.save()

            for sc_name in loc["sub_cities"]:
                ZoneSubCity.objects.get_or_create(
                    zone=zone,
                    name=sc_name,
                    defaults={"code": sc_name.upper().replace(" ", "_")},
                )
                total_sub_cities += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {len(locations)} zones and {total_sub_cities} sub-cities."
            )
        )
