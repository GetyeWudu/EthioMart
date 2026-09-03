"""
apps/payments/admin_views.py
============================
Admin moderation views for Payments, Multi-Party Escrow, Payouts, and MoR Tax Auditing.
Accessible only to platform administrators (IsAnyAdmin).
"""

import logging
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsAnyAdmin
from apps.orders.models import Order, OrderPaymentStatus
from apps.vendors.models import VendorWallet, VendorLedgerEntry, PayoutRequest
from apps.vendors.services.wallet_service import WalletService
from apps.payments.services.chapa_reconciliation_service import ChapaReconciliationService
from apps.payments.services.mor_tax_export_service import MoRTaxExportService
from apps.payments.services.chapa_client import ChapaClient

logger = logging.getLogger(__name__)


class AdminEscrowSummaryView(APIView):
    """
    GET /api/v1/admin/payments/escrow-summary/
    Returns top-level financial KPIs: GMV, Active Escrow (72h held), Platform Net Revenue, MoR VAT liability.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        tax_summary = MoRTaxExportService.get_tax_summary()
        kpis = tax_summary["kpis"]

        # Aggregate Wallets
        wallets = VendorWallet.objects.all()
        active_escrow_held = sum(w.pending_balance for w in wallets)
        cleared_available_balance = sum(w.available_balance for w in wallets)

        # Aggregate Payouts
        payouts = PayoutRequest.objects.all()
        total_payouts_disbursed = sum(p.disbursed_amount for p in payouts.filter(status=PayoutRequest.Status.COMPLETED))
        pending_payouts_sum = sum(p.requested_amount for p in payouts.filter(status=PayoutRequest.Status.PENDING))
        pending_payouts_count = payouts.filter(status=PayoutRequest.Status.PENDING).count()

        # Count active sub-orders in escrow hold
        held_orders_count = VendorLedgerEntry.objects.filter(
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT,
            sub_order__is_payout_settled=False
        ).count()

        return Response({
            "success": True,
            "currency": "ETB",
            "kpis": {
                "total_platform_gmv": kpis["total_gross_gmv"],
                "active_escrow_held": float(active_escrow_held),
                "cleared_available_balance": float(cleared_available_balance),
                "platform_net_revenue": kpis["platform_fee_net"],
                "platform_vat_liability": kpis["platform_vat_liability"],
                "total_payouts_disbursed": float(total_payouts_disbursed),
                "pending_payouts_sum": float(pending_payouts_sum),
                "pending_payouts_count": pending_payouts_count,
                "held_orders_count": held_orders_count,
            }
        })


class AdminPaymentTransactionsListView(APIView):
    """
    GET /api/v1/admin/payments/transactions/
    List all payment transactions with Chapa references, customer info, and escrow state.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        orders = Order.objects.select_related('customer').prefetch_related('sub_orders').order_by('-created_at')[:100]

        results = []
        for order in orders:
            customer = order.customer
            customer_name = "Guest Customer"
            customer_email = ""
            customer_phone = ""

            if customer:
                customer_name = f"{customer.first_name} {customer.last_name}".strip() or customer.username
                customer_email = customer.email or ""
                customer_phone = getattr(customer, 'phone_number', '') or ""
            elif isinstance(order.shipping_address, dict):
                customer_phone = order.shipping_address.get('phone_number', '')

            # Check escrow state of order
            escrow_state = "UNCONFIRMED"
            if order.payment_status == OrderPaymentStatus.PAID:
                if order.sub_orders.exists():
                    all_settled = all(so.is_payout_settled for so in order.sub_orders.all())
                    escrow_state = "RELEASED" if all_settled else "HELD (72h)"
                else:
                    escrow_state = "HELD"

            tx_ref = order.transaction_reference or f"GECH-ORD-{order.order_number}"

            results.append({
                "id": f"TXN-{str(order.id)[:8].upper()}",
                "uuid": str(order.id),
                "txRef": tx_ref,
                "chapaReference": order.transaction_reference or tx_ref,
                "orderId": order.order_number,
                "orderUuid": str(order.id),
                "customer": f"{customer_name} ({customer_email or customer_phone or 'Direct'})",
                "customerName": customer_name,
                "customerEmail": customer_email,
                "customerPhone": customer_phone,
                "amount": float(order.total_amount),
                "currency": "ETB",
                "method": "Chapa / Telebirr",
                "status": order.payment_status,
                "escrowState": escrow_state,
                "webhookVerifiedAt": order.updated_at.strftime("%d %b %Y, %H:%M") if order.payment_status == OrderPaymentStatus.PAID else None,
                "date": order.created_at.strftime("%d %b %Y, %H:%M"),
                "rawPayload": {
                    "order_number": order.order_number,
                    "tx_ref": tx_ref,
                    "payment_status": order.payment_status,
                    "delivery_method": order.delivery_method,
                    "sub_orders_count": order.sub_orders.count(),
                },
            })

        return Response({"success": True, "count": len(results), "results": results})


class AdminSyncChapaTransactionView(APIView):
    """
    POST /api/v1/admin/payments/sync/<tx_ref>/
    Manual verification trigger querying Chapa verify endpoint directly.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, tx_ref):
        res = ChapaReconciliationService.reconcile_transaction(tx_ref)
        status_code = status.HTTP_200_OK if res.get("success") else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)


class AdminSyncAllPendingTransactionsView(APIView):
    """
    POST /api/v1/admin/payments/sync-pending/
    Batch reconciliation for all transactions lingering in PENDING.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request):
        res = ChapaReconciliationService.sync_all_pending()
        return Response(res, status=status.HTTP_200_OK)


class AdminPayoutsListView(APIView):
    """
    GET /api/v1/admin/payments/payouts/
    List seller withdrawal payout requests.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        payouts = PayoutRequest.objects.select_related('vendor__user').order_by('-created_at')[:100]

        results = []
        for p in payouts:
            results.append({
                "id": f"PAY-{str(p.id)[:8].upper()}",
                "uuid": str(p.id),
                "vendor_name": p.vendor.store_name,
                "vendor_id": str(p.vendor.id),
                "amount": float(p.requested_amount),
                "transfer_fee": float(p.transfer_fee),
                "net_disbursement": float(p.disbursed_amount),
                "bank_name": p.bank_name or "Telebirr",
                "bank_code": p.bank_code or "",
                "account_number": p.account_number or "",
                "account_name": p.account_name or "",
                "status": p.status,
                "chapa_transfer_ref": p.transfer_reference or "N/A",
                "created_at": p.created_at.strftime("%d %b %Y, %H:%M"),
                "processed_at": p.updated_at.strftime("%d %b %Y, %H:%M") if p.status == PayoutRequest.Status.COMPLETED else None,
            })

        return Response({"success": True, "count": len(results), "results": results})


class AdminBatchPayoutDisburseView(APIView):
    """
    POST /api/v1/admin/payments/payouts/batch-disburse/
    Processes multiple selected PayoutRequests via Chapa Transfer API.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request):
        payout_ids = request.data.get("payout_ids", [])
        if not payout_ids or not isinstance(payout_ids, list):
            return Response({"detail": "Provide a list of payout_ids to disburse."}, status=status.HTTP_400_BAD_REQUEST)

        payouts = PayoutRequest.objects.filter(id__in=payout_ids, status=PayoutRequest.Status.PENDING)
        disbursed_count = 0
        failed_count = 0
        total_amount = Decimal('0.00')

        for payout in payouts:
            try:
                # Disburse via ChapaClient
                chapa_res = ChapaClient.initiate_transfer(
                    account_name=payout.account_name,
                    account_number=payout.account_number,
                    amount=payout.disbursed_amount,
                    bank_code=payout.bank_code,
                    reference=payout.transfer_reference,
                )

                if chapa_res.get("status") in ("success", "queued"):
                    WalletService.complete_payout_settlement(payout)
                    disbursed_count += 1
                    total_amount += payout.disbursed_amount
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"Batch payout error for {payout.id}: {str(e)}")
                failed_count += 1

        return Response({
            "success": True,
            "disbursed_count": disbursed_count,
            "failed_count": failed_count,
            "total_disbursed_amount": float(total_amount),
            "message": f"Successfully processed {disbursed_count} payouts totalling ETB {total_amount:,.2f}."
        })


class AdminMoRTaxReportView(APIView):
    """
    GET /api/v1/admin/payments/mor-report/
    Generates preview JSON or downloadable RFC-4180 CSV for Form 1142.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        tax_regime = request.query_params.get("tax_regime")
        format_type = request.query_params.get("format", "json")

        if format_type == "csv":
            csv_content = MoRTaxExportService.generate_form_1142_csv(start_date, end_date, tax_regime)
            response = HttpResponse(csv_content, content_type="text/csv")
            filename = f"MoR_Form_1142_Tax_Declaration_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response

        summary = MoRTaxExportService.get_tax_summary(start_date, end_date, tax_regime)
        return Response({"success": True, "data": summary})
