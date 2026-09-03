"""
apps/disputes/services/dispute_service.py
=========================================
Encapsulates Dispute lifecycle, 48h inspection window validation,
atomic double-entry wallet balance adjustments, and direct Chapa refund calls.
"""

import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.disputes.models import Dispute
from apps.vendors.models import VendorLedgerEntry, VendorWallet, VendorProfile
from apps.payments.services.chapa_client import ChapaClient
from apps.notifications.services import NotificationService

logger = logging.getLogger(__name__)


class DisputeService:

    @classmethod
    @transaction.atomic
    def open_dispute(
        cls,
        sub_order,
        customer,
        reason: str,
        notes: str,
        evidence_images: list = None
    ) -> Dispute:
        """
        Opens a dispute claim within the 48-hour delivery inspection window.
        Freezes vendor escrow funds on the sub-order.
        """
        # 1. 48-Hour Validation
        if sub_order.derived_status != 'DELIVERED':
            raise ValidationError("Disputes can only be filed on delivered orders.")

        if not sub_order.delivered_at:
            sub_order.delivered_at = timezone.now()
            sub_order.save(update_fields=['delivered_at'])

        if not sub_order.is_within_inspection_window():
            raise ValidationError("The 5-minute delivery inspection window has passed.")

        # 2. Re-entry Guard: Check if dispute already exists
        if hasattr(sub_order, 'dispute') or Dispute.objects.filter(sub_order=sub_order).exists():
            raise ValidationError("A dispute has already been filed for this sub-order.")

        # 3. Freeze Sub-Order Escrow
        sub_order.is_disputed = True
        sub_order.save(update_fields=['is_disputed'])

        disputed_amt = Decimal(str(sub_order.total_amount))

        # 4. Create Dispute Record
        dispute = Dispute.objects.create(
            sub_order=sub_order,
            customer=customer,
            vendor=sub_order.vendor,
            reason=reason,
            customer_notes=notes,
            evidence_images=evidence_images or [],
            disputed_amount=disputed_amt,
            status=Dispute.Status.UNDER_REVIEW
        )

        customer_name = customer.get_full_name() or customer.email

        # 5. Notify Seller
        if sub_order.vendor.user:
            NotificationService.send_notification(
                user=sub_order.vendor.user,
                type="DISPUTE_ALERT",
                title="Dispute Claim Filed",
                message=f"Customer {customer_name} filed a dispute for Sub-Order #{str(sub_order.id)[:8].upper()} ({dispute.get_reason_display()}). Escrow is on hold.",
                related_link="/seller/disputes"
            )

        # 6. Notify Customer
        NotificationService.send_notification(
            user=customer,
            type="DISPUTE_ALERT",
            title="Dispute Ticket Received",
            message=f"Your dispute for Order #{sub_order.order.order_number} has been submitted for review. Escrow funds are protected.",
            related_link=f"/customer/orders/{sub_order.order.id}"
        )

        return dispute

    @classmethod
    @transaction.atomic
    def resolve_dispute(
        cls,
        dispute: Dispute,
        action: str,
        admin_notes: str = "",
        resolved_by=None
    ) -> Dispute:
        """
        Resolves a dispute with atomic escrow balance adjustment:
          - 'REFUND_BUYER': Reverses escrow from seller wallet, logs ledger debit, calls Chapa refund API.
          - 'REJECT_CLAIM': Releases escrow into seller available balance net of platform commission.
        """
        if dispute.status not in (Dispute.Status.UNDER_REVIEW,):
            raise ValidationError("Dispute is already resolved.")

        if action not in ('REFUND_BUYER', 'REJECT_CLAIM'):
            raise ValidationError("Action must be 'REFUND_BUYER' or 'REJECT_CLAIM'.")

        sub_order = dispute.sub_order
        vendor = dispute.vendor
        wallet, _ = VendorWallet.objects.get_or_create(vendor=vendor)
        disputed_amt = Decimal(str(dispute.disputed_amount))

        if action == 'REFUND_BUYER':
            dispute.status = Dispute.Status.REFUNDED
            dispute.refund_amount = disputed_amt

            # 1. Reverse Escrow in DB via WalletService
            from apps.vendors.services import WalletService
            WalletService.refund_escrow(sub_order)

            # 2. Direct Chapa Refund Call (with fallback error logging)
            payment_ref = getattr(sub_order.order, 'transaction_reference', '') or getattr(sub_order.order, 'payment_reference', '') or f"GECH-{sub_order.order.order_number}"
            try:
                ChapaClient.initiate_refund(
                    payment_reference=payment_ref,
                    amount=float(disputed_amt),
                    reason=f"Dispute #{dispute.id} Resolved: {dispute.reason}"
                )
            except Exception as e:
                logger.error(f"Chapa automatic refund API failed for Dispute #{dispute.id}: {str(e)}")

            # 3. Notifications
            NotificationService.send_notification(
                user=dispute.customer,
                type="DISPUTE_ALERT",
                title="Dispute Resolved - Refund Approved",
                message=f"Your dispute for Order #{sub_order.order.order_number} has been approved. A refund of ETB {disputed_amt:,.2f} has been issued.",
                related_link=f"/customer/orders/{sub_order.order.id}"
            )
            if vendor.user:
                NotificationService.send_notification(
                    user=vendor.user,
                    type="DISPUTE_ALERT",
                    title="Dispute Resolved (Refunded)",
                    message=f"Dispute for Sub-Order #{str(sub_order.id)[:8].upper()} was resolved in the buyer's favor. Escrow has been reversed.",
                    related_link="/seller/disputes"
                )

        elif action == 'REJECT_CLAIM':
            dispute.status = Dispute.Status.REJECTED

            # 1. Unlock and transition pending escrow balance to withdrawable available balance via WalletService
            from apps.vendors.services import WalletService
            WalletService.settle_payout(sub_order)

            # 2. Notifications
            NotificationService.send_notification(
                user=dispute.customer,
                type="DISPUTE_ALERT",
                title="Dispute Closed",
                message=f"Your claim for Order #{sub_order.order.order_number} has been reviewed and closed by admin.",
                related_link=f"/customer/orders/{sub_order.order.id}"
            )
            if vendor.user:
                NotificationService.send_notification(
                    user=vendor.user,
                    type="DISPUTE_ALERT",
                    title="Dispute Dismissed - Escrow Released",
                    message=f"Dispute for Sub-Order #{str(sub_order.id)[:8].upper()} was dismissed. Funds are now available in your wallet.",
                    related_link="/seller/earnings"
                )

        # Unlock sub-order dispute flag
        sub_order.is_disputed = False
        sub_order.save(update_fields=['is_disputed'])

        dispute.admin_notes = admin_notes
        dispute.resolved_by = resolved_by
        dispute.resolved_at = timezone.now()
        dispute.save()

        return dispute
