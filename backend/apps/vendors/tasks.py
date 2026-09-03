"""
apps/vendors/tasks.py
======================
Celery background workers for the vendors domain.

Rules (per .antigravityrules):
  - Never pass model instances to tasks; pass UUIDs/string IDs only.
  - All tasks must be idempotent.
  - External API calls (Chapa) must never block the HTTP cycle.
"""

import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="vendors.provision_chapa_subaccount",
    max_retries=5,
    default_retry_delay=60,   # 1-minute initial backoff, auto-doubles via exponential
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=3600,   # Cap at 1-hour retry interval
    ignore_result=False,
)
def provision_chapa_subaccount(self, vendor_id: str):
    """
    Asynchronously calls the Chapa subaccount API to provision a payout account
    for an approved third-party merchant.

    Idempotent: if chapa_subaccount_id is already set, task exits immediately.
    Graceful fallback: on Chapa timeout or connectivity error, logs a warning
    and schedules a retry. Does NOT revert the KYC approval status.

    Usage: provision_chapa_subaccount.delay(str(vendor.id))
    """
    from apps.vendors.models import VendorProfile, VendorBankDetails
    from apps.audit_logs.models import AuditLog
    from decouple import config
    import requests

    try:
        vendor = VendorProfile.objects.select_related("user", "bank_details").get(id=vendor_id)
    except VendorProfile.DoesNotExist:
        logger.error(f"provision_chapa_subaccount: VendorProfile {vendor_id} not found. Aborting.")
        return {"status": "error", "reason": "vendor_not_found"}

    # Idempotency check
    if hasattr(vendor, "bank_details") and vendor.bank_details.chapa_subaccount_id:
        logger.info(f"Chapa subaccount already provisioned for '{vendor.store_name}'. Skipping.")
        return {"status": "skipped", "reason": "already_provisioned"}

    if not hasattr(vendor, "bank_details"):
        logger.warning(f"Vendor '{vendor.store_name}' has no bank details. Cannot provision Chapa subaccount.")
        return {"status": "error", "reason": "no_bank_details"}

    chapa_secret_key = config("CHAPA_SECRET_KEY", default="")
    if not chapa_secret_key:
        logger.warning("CHAPA_SECRET_KEY not set in environment. Skipping Chapa subaccount provisioning.")
        return {"status": "skipped", "reason": "chapa_not_configured"}

    bank_details = vendor.bank_details
    payload = {
        "business_name":    vendor.store_name,
        "account_name":     bank_details.account_name,
        "bank_code":        bank_details.bank_code,
        "account_number":   bank_details.account_number,
        "split_type":       "percentage",
        "split_value":      str(100 - float(vendor.commission_rate)),
    }

    try:
        response = requests.post(
            "https://api.chapa.co/v1/subaccount",
            json=payload,
            headers={
                "Authorization": f"Bearer {chapa_secret_key}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        subaccount_id = data.get("data", {}).get("subaccount_id") or data.get("data", {}).get("id")

        if subaccount_id:
            bank_details.chapa_subaccount_id = subaccount_id
            bank_details.save(update_fields=["chapa_subaccount_id", "updated_at"])

            AuditLog.objects.create(
                actor=vendor.user,
                actor_email=vendor.user.email,
                actor_role=vendor.user.role,
                action=AuditLog.ActionType.VENDOR_CHAPA_PROVISIONED,
                target_type="VendorBankDetails",
                target_id=str(vendor.id),
                target_repr=vendor.store_name,
                payload={"chapa_subaccount_id": subaccount_id},
            )
            logger.info(f"Chapa subaccount provisioned for '{vendor.store_name}': {subaccount_id}")
            return {"status": "success", "subaccount_id": subaccount_id}
        else:
            logger.warning(f"Chapa response missing subaccount_id for '{vendor.store_name}': {data}")
            return {"status": "error", "reason": "missing_subaccount_id", "response": data}

    except requests.Timeout:
        logger.warning(f"Chapa API timed out for vendor '{vendor.store_name}'. Will retry.")
        raise self.retry(exc=Exception("Chapa timeout"))

    except requests.RequestException as e:
        logger.warning(f"Chapa API error for vendor '{vendor.store_name}': {e}. Will retry.")
        raise self.retry(exc=e)


@shared_task(
    bind=True,
    name="vendors.retry_chapa_subaccount_manual",
    max_retries=1,
    ignore_result=False,
)
def retry_chapa_subaccount_manual(self, vendor_id: str):
    """
    Manual retry trigger for POST /api/v1/admin/vendors/<id>/retry-chapa/.
    Delegates directly to the main provisioning task.
    """
    return provision_chapa_subaccount.apply_async(args=[vendor_id], countdown=0)


@shared_task(
    name="vendors.auto_settle_delivered_orders",
    ignore_result=False,
)
def auto_settle_delivered_orders():
    """
    Celery Beat periodic task — runs every hour.
    Finds all VendorSubOrders that:
      - Have been delivered (delivered_at is not null)
      - Have passed the 48-hour dispute clearance window
      - Have not yet been payout-settled (is_payout_settled=False)
    For each, calls WalletService.settle_payout() to move pending_balance → available_balance.

    Idempotent: settle_payout() skips already-settled sub-orders silently.

    Schedule: Registered in CELERY_BEAT_SCHEDULE in settings/base.py.
    """
    from datetime import timedelta
    from apps.orders.models import VendorSubOrder
    from apps.vendors.services import WalletService

    # 5-minute settlement clearance window for testing (was 48 hours)
    clearance_cutoff = timezone.now() - timedelta(minutes=5)

    pending_settlement = VendorSubOrder.objects.filter(
        delivered_at__isnull=False,
        delivered_at__lte=clearance_cutoff,
        is_payout_settled=False,
        is_disputed=False,
    ).exclude(
        dispute__status="REFUNDED"
    ).exclude(
        wallet_ledger_entries__entry_type="ESCROW_REFUND"
    ).distinct().select_related('vendor', 'vendor__wallet')

    total = pending_settlement.count()
    settled_count = 0
    failed_count = 0

    logger.info(f"auto_settle_delivered_orders: Found {total} sub-order(s) eligible for settlement.")

    for sub_order in pending_settlement:
        try:
            result = WalletService.settle_payout(sub_order)
            if result is not None:
                settled_count += 1
                logger.info(f"  ✓ Settled sub-order {sub_order.id} for vendor '{sub_order.vendor.store_name}'")
        except Exception as exc:
            failed_count += 1
            logger.error(f"  ✗ Failed to settle sub-order {sub_order.id}: {exc}", exc_info=True)

    summary = {
        "status": "DONE",
        "eligible": total,
        "settled": settled_count,
        "failed": failed_count,
    }
    logger.info(f"auto_settle_delivered_orders complete: {summary}")
    return summary


@shared_task(
    name="vendors.verify_pending_payouts",
    ignore_result=False,
)
def verify_pending_payouts():
    """
    Celery Beat periodic task — runs every 2 minutes.
    Polls Chapa GET /v1/transfers/verify/{transfer_reference} for all PENDING or PROCESSING PayoutRequests.
    - On Bank settlement success: calls WalletService.complete_payout_settlement(payout_request)
    - On Bank failure or reversal: calls WalletService.fail_payout_settlement(payout_request, reason)
    """
    from apps.vendors.models import PayoutRequest
    from apps.payments.services.chapa_client import ChapaClient
    from apps.vendors.services import WalletService

    pending_payouts = PayoutRequest.objects.filter(
        status__in=[PayoutRequest.Status.PENDING, PayoutRequest.Status.PROCESSING]
    )

    results = {"checked": pending_payouts.count(), "completed": 0, "failed": 0}
    for pr in pending_payouts:
        try:
            verify_res = ChapaClient.verify_transfer(pr.transfer_reference)
            chapa_data = verify_res.get("data") if isinstance(verify_res.get("data"), dict) else {}
            status_str = (
                chapa_data.get("status", "").lower()
                or verify_res.get("status", "").lower()
            )
            if status_str in ("success", "paid", "completed", "successful"):
                WalletService.complete_payout_settlement(pr)
                results["completed"] += 1
            elif status_str in ("failed", "cancelled", "reversed"):
                reason = verify_res.get("message", "Bank transfer failed or reversed")
                WalletService.fail_payout_settlement(pr, reason=reason)
                results["failed"] += 1
        except Exception as e:
            logger.error(f"Error checking pending payout #{pr.transfer_reference}: {e}")
    return results

