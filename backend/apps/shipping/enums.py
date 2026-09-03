from django.db import models


class ShippingClass(models.TextChoices):
    STANDARD = "STANDARD", "Standard"
    HEAVY = "HEAVY", "Heavy"
    BULKY = "BULKY", "Bulky"
    FRAGILE = "FRAGILE", "Fragile"
    DIGITAL = "DIGITAL", "Digital"
