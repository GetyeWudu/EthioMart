import re
import uuid
import logging
from typing import Optional
from django.db import transaction
from django.utils.text import slugify
from apps.inventory.models import WarehouseLocation
from apps.vendors.models import VendorProfile

logger = logging.getLogger(__name__)


class WarehouseService:
    """
    Manages physical warehouse and fulfillment facility provisioning.
    """

    @classmethod
    @transaction.atomic
    def create_default_warehouse_for_vendor(cls, vendor: VendorProfile) -> WarehouseLocation:
        """
        Idempotently auto-provisions a primary/default warehouse location
        when a vendor is approved or registered.
        """
        existing = WarehouseLocation.objects.filter(vendor=vendor, is_default=True).first()
        if existing:
            return existing

        clean_slug = re.sub(r"[^A-Za-z0-9]", "", vendor.slug or "STORE")[:8].upper()
        city_name = getattr(vendor, "city", None) or "Addis Ababa"
        wh_code = f"WH-{clean_slug}-01"

        # Ensure code uniqueness if collision exists
        if WarehouseLocation.objects.filter(code=wh_code).exists():
            wh_code = f"WH-{clean_slug}-{uuid.uuid4().hex[:4].upper()}"

        warehouse = WarehouseLocation.objects.create(
            vendor=vendor,
            name=f"Main Facility - {city_name}",
            code=wh_code,
            city=city_name,
            subcity=getattr(vendor, "subcity", "") or "Central",
            street_address=getattr(vendor, "street_address", "") or "Commercial Hub",
            contact_name=vendor.store_name,
            contact_phone=getattr(vendor, "contact_phone", "") or getattr(vendor.user, "phone_number", "") or "",
            is_active=True,
            is_default=True,
            is_pickup_point=False,
        )
        logger.info(f"Auto-provisioned default warehouse '{warehouse.name}' [{warehouse.code}] for vendor {vendor.store_name}.")
        return warehouse

    @classmethod
    def create_warehouse(
        cls,
        vendor: VendorProfile,
        name: str,
        code: str,
        city: str,
        street_address: str,
        subcity: str = "",
        wereda: str = "",
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        contact_name: str = "",
        contact_phone: str = "",
        is_default: bool = False,
        is_pickup_point: bool = False,
    ) -> WarehouseLocation:
        """Creates a new branch or warehouse facility for a vendor."""
        if is_default:
            WarehouseLocation.objects.filter(vendor=vendor, is_default=True).update(is_default=False)

        warehouse = WarehouseLocation.objects.create(
            vendor=vendor,
            name=name,
            code=code.upper().strip(),
            city=city,
            subcity=subcity,
            wereda=wereda,
            street_address=street_address,
            latitude=latitude,
            longitude=longitude,
            contact_name=contact_name,
            contact_phone=contact_phone,
            is_active=True,
            is_default=is_default,
            is_pickup_point=is_pickup_point,
        )
        logger.info(f"Created warehouse '{warehouse.name}' [{warehouse.code}] for vendor {vendor.store_name}.")
        return warehouse
