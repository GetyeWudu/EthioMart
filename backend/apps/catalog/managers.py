"""
apps/catalog/managers.py
========================
Custom QuerySet and Managers for Product Catalog.
Enforces zero-write dynamic delisting for suspended and non-approved merchants.
"""

from django.db import models
from apps.catalog.enums import ProductStatus
from apps.vendors.enums import VendorStatus


class ProductQuerySet(models.QuerySet):
    def live_on_storefront(self):
        """
        Instantly hides all products if the vendor is suspended, rejected, or not active.
        Zero background tasks or heavy database updates required.
        """
        return self.filter(
            status=ProductStatus.ACTIVE,
            vendor__status=VendorStatus.APPROVED
        )
