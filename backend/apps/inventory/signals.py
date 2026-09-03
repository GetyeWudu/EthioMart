import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorStatus
from apps.inventory.services.warehouse_service import WarehouseService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=VendorProfile)
def handle_vendor_profile_saved(sender, instance, created, **kwargs):
    """
    Auto-provisions a default warehouse facility when a vendor is created or approved.
    """
    if created or instance.status == VendorStatus.APPROVED:
        try:
            WarehouseService.create_default_warehouse_for_vendor(instance)
        except Exception as e:
            logger.warning(f"Could not auto-provision default warehouse for vendor {instance.id}: {e}")
