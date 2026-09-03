import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import VendorProfile, VendorStaff
from .enums import VendorStatus

logger = logging.getLogger(__name__)

@receiver(post_save, sender=VendorProfile)
def create_owner_staff_for_vendor(sender, instance, created, **kwargs):
    if created:
        try:
            VendorStaff.objects.create(
                vendor=instance,
                user=instance.user,
                role=VendorStaff.Role.OWNER,
                assigned_facility=None
            )
            logger.info(f"Auto-provisioned OWNER staff record for {instance.user.email} in {instance.store_name}")
        except Exception as e:
            logger.error(f"Failed to provision OWNER staff record for {instance.id}: {e}")


@receiver(pre_save, sender=VendorProfile)
def sync_vendor_suspension_wallet(sender, instance, **kwargs):
    """
    Automated Two-Rule Payout Lock:
    1. When vendor status changes to SUSPENDED -> Lock payouts immediately.
    2. When vendor status is reinstated to APPROVED -> Unlock payouts.
    """
    if not instance.pk:
        return

    previous = VendorProfile.objects.filter(pk=instance.pk).values("status").first()
    if not previous:
        return

    prev_status = previous["status"]
    new_status = instance.status

    # If status changed to SUSPENDED -> Lock payouts immediately
    if prev_status != VendorStatus.SUSPENDED and new_status == VendorStatus.SUSPENDED:
        if hasattr(instance, "wallet"):
            instance.wallet.is_payout_locked = True
            instance.wallet.lock_reason = "Store suspended by administration."
            instance.wallet.save(update_fields=["is_payout_locked", "lock_reason", "updated_at"])
            logger.info(f"Payouts locked automatically for suspended vendor {instance.store_name} ({instance.id})")

    # If status restored from SUSPENDED to APPROVED -> Unlock payouts
    elif prev_status == VendorStatus.SUSPENDED and new_status == VendorStatus.APPROVED:
        if hasattr(instance, "wallet"):
            instance.wallet.is_payout_locked = False
            instance.wallet.lock_reason = ""
            instance.wallet.save(update_fields=["is_payout_locked", "lock_reason", "updated_at"])
            logger.info(f"Payouts unlocked automatically for reinstated vendor {instance.store_name} ({instance.id})")

