"""
apps/payments/services/mor_tax_export_service.py
================================================
Ministry of Revenues (MoR) Tax Declaration Engine (Ethiopian Tax Authority).
Generates compliant monthly declarations (Form 1142) separating:
  1. Third-Party Marketplace Retail Turnover (Collected for Sellers).
  2. Platform Intermediation Service Fees (GechExpress Revenue).
  3. Output VAT (15%) liability payable by GechExpress to MoR.
"""

import io
import csv
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Q

from apps.vendors.models import VendorLedgerEntry, VendorProfile
from apps.orders.models import Order, OrderPaymentStatus, VendorSubOrder


class MoRTaxExportService:
    """
    Tax aggregation service for Ethiopian Ministry of Revenues reporting.
    """

    @classmethod
    def get_tax_summary(cls, start_date=None, end_date=None, tax_regime=None) -> dict:
        """
        Calculates platform GMV, third-party turnover, platform fee revenue, and 15% VAT.
        """
        ledger_qs = VendorLedgerEntry.objects.filter(entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT)

        if start_date:
            ledger_qs = ledger_qs.filter(created_at__gte=start_date)
        if end_date:
            ledger_qs = ledger_qs.filter(created_at__lte=end_date)
        if tax_regime and tax_regime != "ALL":
            is_vat = (tax_regime == "VAT_REGISTERED")
            ledger_qs = ledger_qs.filter(wallet__vendor__vat_registered=is_vat)

        gross_gmv = Decimal('0.00')
        platform_fee_gross = Decimal('0.00')
        platform_fee_net = Decimal('0.00')
        platform_vat_liability = Decimal('0.00')
        vendor_net_payouts = Decimal('0.00')

        entries_data = []

        for entry in ledger_qs.select_related('wallet__vendor', 'sub_order__order'):
            vendor = entry.wallet.vendor
            sub_order = entry.sub_order
            order = sub_order.order if sub_order else None

            gross = entry.amount or Decimal('0.00')
            comm = entry.commission_deducted or Decimal('0.00')
            p_net = entry.platform_net_revenue or Decimal('0.00')
            p_vat = entry.platform_vat_amount or Decimal('0.00')
            v_payout = entry.net_amount or Decimal('0.00')

            gross_gmv += gross
            platform_fee_gross += comm
            platform_fee_net += p_net
            platform_vat_liability += p_vat
            vendor_net_payouts += v_payout

            entries_data.append({
                "entry_id": f"TAX-{str(entry.id)[:8].upper()}",
                "date": entry.created_at.strftime("%Y-%m-%d %H:%M"),
                "vendor_name": vendor.store_name,
                "tin_number": vendor.tin_number or "N/A",
                "tax_regime": "VAT_REGISTERED" if vendor.vat_registered else "TOT_REGISTERED",
                "order_number": order.order_number if order else "N/A",
                "sub_order_id": f"SUB-{str(sub_order.id)[:8].upper()}" if sub_order else "N/A",
                "gross_gmv": float(gross),
                "platform_fee_gross": float(comm),
                "platform_fee_net": float(p_net),
                "platform_vat_15": float(p_vat),
                "vendor_net_payout": float(v_payout),
            })

        return {
            "period": f"{start_date or 'All Time'} to {end_date or 'Present'}",
            "currency": "ETB",
            "kpis": {
                "total_gross_gmv": float(gross_gmv),
                "platform_fee_gross": float(platform_fee_gross),
                "platform_fee_net": float(platform_fee_net),
                "platform_vat_liability": float(platform_vat_liability),
                "vendor_net_payouts": float(vendor_net_payouts),
                "records_count": len(entries_data),
            },
            "entries": entries_data,
        }

    @classmethod
    def generate_form_1142_csv(cls, start_date=None, end_date=None, tax_regime=None) -> str:
        """
        Generates RFC-4180 CSV content for MoR Form 1142.
        """
        summary = cls.get_tax_summary(start_date=start_date, end_date=end_date, tax_regime=tax_regime)
        entries = summary["entries"]

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Header metadata
        writer.writerow(["MINISTRY OF REVENUES (MoR) - ETHIOPIA", "FORM 1142 - ELECTRONIC MARKETPLACE TAX RETURN"])
        writer.writerow(["Platform Name", "GechExpress Marketplace", "Currency", "ETB"])
        writer.writerow(["Period", summary["period"], "Export Date", timezone.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])

        # Table headers
        writer.writerow([
            "Entry ID",
            "Transaction Date",
            "Merchant Name",
            "Merchant TIN",
            "Tax Regime",
            "Order Number",
            "Sub-Order ID",
            "Gross Retail GMV (ETB)",
            "Platform Service Fee (Gross ETB)",
            "Platform Fee Net (ETB)",
            "Platform 15% VAT (MoR Liability ETB)",
            "Merchant Net Payout (ETB)"
        ])

        for item in entries:
            writer.writerow([
                item["entry_id"],
                item["date"],
                item["vendor_name"],
                item["tin_number"],
                item["tax_regime"],
                item["order_number"],
                item["sub_order_id"],
                f"{item['gross_gmv']:.2f}",
                f"{item['platform_fee_gross']:.2f}",
                f"{item['platform_fee_net']:.2f}",
                f"{item['platform_vat_15']:.2f}",
                f"{item['vendor_net_payout']:.2f}",
            ])

        # Summary Row
        kpis = summary["kpis"]
        writer.writerow([])
        writer.writerow([
            "TOTALS",
            "",
            "",
            "",
            "",
            "",
            f"Count: {kpis['records_count']}",
            f"{kpis['total_gross_gmv']:.2f}",
            f"{kpis['platform_fee_gross']:.2f}",
            f"{kpis['platform_fee_net']:.2f}",
            f"{kpis['platform_vat_liability']:.2f}",
            f"{kpis['vendor_net_payouts']:.2f}",
        ])

        return output.getvalue()
