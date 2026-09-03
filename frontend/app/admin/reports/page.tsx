"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  Building2, 
  Download, 
  FileText, 
  Filter, 
  Loader2, 
  RotateCw, 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2,
  Store,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { API_URL } from "@/lib/api";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("mor_1142");
  const [taxRegime, setTaxRegime] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Build query string
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("start_date", startDate);
  if (endDate) queryParams.append("end_date", endDate);
  if (taxRegime !== "ALL") queryParams.append("tax_regime", taxRegime);

  const apiEndpoint = `/admin/payments/mor-report/?${queryParams.toString()}`;
  const { data: response, error, isLoading, mutate } = useSWR(apiEndpoint, fetcher);

  const reportData = response?.data || {
    period: "All Time",
    kpis: {
      total_gross_gmv: 0,
      platform_fee_gross: 0,
      platform_fee_net: 0,
      platform_vat_liability: 0,
      vendor_net_payouts: 0,
      records_count: 0,
    },
    entries: [],
  };

  const kpis = reportData.kpis;
  const entries: any[] = reportData.entries || [];

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      if (entries.length === 0) {
        toast.error("No data entries to export for the selected period.");
        setIsExporting(false);
        return;
      }

      // 1. Build CSV Rows from loaded report data
      const isMoR = reportType === "mor_1142";
      const isPayouts = reportType === "seller_payouts";

      let docTitle = "MINISTRY OF REVENUES (MoR) - ETHIOPIA - FORM 1142";
      if (reportType === "gmv_revenue") docTitle = "GECHEXPRESS MARKETPLACE - GMV & REVENUE REPORT";
      if (isPayouts) docTitle = "GECHEXPRESS MARKETPLACE - SELLER PAYOUTS & COMMISSIONS AUDIT";

      const rows: string[][] = [
        [docTitle],
        ["Platform", "GechExpress Marketplace", "Currency", "ETB"],
        ["Period", reportData.period || "All Time", "Export Date", new Date().toLocaleString('en-ET')],
        [],
        [
          "Entry ID",
          "Transaction Date",
          "Merchant Store",
          "Merchant TIN",
          "Tax Regime",
          "Order Number",
          "Sub-Order ID",
          "Gross Retail GMV (ETB)",
          "Platform Fee (Gross ETB)",
          "Merchant Net Payout (ETB)"
        ]
      ];

      entries.forEach((item: any) => {
        rows.push([
          item.entry_id || "",
          item.date || "",
          `"${(item.vendor_name || "").replace(/"/g, '""')}"`,
          item.tin_number || "N/A",
          item.tax_regime || "TOT_REGISTERED",
          item.order_number || "",
          item.sub_order_id || "",
          Number(item.gross_gmv || 0).toFixed(2),
          Number(item.platform_fee_gross || 0).toFixed(2),
          Number(item.vendor_net_payout || 0).toFixed(2)
        ]);
      });

      // Totals Summary Line
      rows.push([]);
      rows.push([
        "TOTALS",
        "",
        "",
        "",
        "",
        "",
        `Count: ${kpis.records_count || entries.length}`,
        Number(kpis.total_gross_gmv || 0).toFixed(2),
        Number(kpis.platform_fee_gross || 0).toFixed(2),
        Number(kpis.platform_fee_net || 0).toFixed(2),
        Number(kpis.platform_vat_liability || 0).toFixed(2),
        Number(kpis.vendor_net_payouts || 0).toFixed(2)
      ]);

      const csvContent = rows.map(r => r.join(",")).join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename = isMoR 
        ? `MoR_Form_1142_Tax_Declaration_${new Date().toISOString().slice(0, 10)}.csv`
        : `GechExpress_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename} successfully!`);
    } catch (err: any) {
      toast.error("Failed to generate CSV export: " + (err?.message || ""));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Accounting & Tax Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ministry of Revenues (MoR) Form 1142 declarations, marketplace GMV, and platform VAT audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={handleExportCSV} 
            disabled={isExporting || entries.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {reportType === 'mor_1142' ? 'Export Form 1142 CSV' : 'Export Report CSV'}
          </Button>
        </div>
      </div>

      {/* Filter Parameters Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Report Parameters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Preset Report Type</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-3 text-slate-700 dark:text-slate-300"
            >
              <option value="mor_1142">MoR Form 1142 (Tax Return)</option>
              <option value="gmv_revenue">Platform Revenue & Gross GMV</option>
              <option value="seller_payouts">Seller Payout & Commission Audit</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Vendor Tax Regime</label>
            <select 
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-3 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Tax Regimes</option>
              <option value="VAT_REGISTERED">VAT Registered (15%)</option>
              <option value="TOT_REGISTERED">Turnover Tax (TOT / Non-VAT)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-3 text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">End Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-3 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Third-Party GMV</span>
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-2 block">
            ETB {kpis.total_gross_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Retail sales collected</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Platform Intermediation Fees</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-2 block">
            ETB {kpis.platform_fee_gross.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Gross commission turnover</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Merchant Net Payouts</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 block">
            ETB {kpis.vendor_net_payouts.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Vendor disbursements</p>
        </div>
      </div>

      {/* Generated Report Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {reportType === 'mor_1142' 
                ? 'MoR Form 1142 Electronic Declaration Audit' 
                : reportType === 'gmv_revenue'
                ? 'Marketplace GMV & Platform Revenue Summary'
                : 'Merchant Payouts & Commission Audit Log'}
            </h3>
            <p className="text-xs text-slate-500">Period: {reportData.period} • {kpis.records_count} transactions recorded</p>
          </div>

          <Button variant="ghost" size="sm" onClick={() => mutate()} className="h-8 text-xs gap-1">
            <RotateCw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tax Entry ID</th>
                <th className="px-5 py-3.5">Merchant Store / TIN</th>
                <th className="px-5 py-3.5">Tax Regime</th>
                <th className="px-5 py-3.5">Order / Sub-Order</th>
                <th className="px-5 py-3.5 text-right">Gross GMV (ETB)</th>
                <th className="px-5 py-3.5 text-right">Platform Fee (Gross)</th>
                <th className="px-5 py-3.5 text-right">Merchant Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Generating tax reconciliation audit...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No transactions recorded for the selected parameters.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.entry_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {item.entry_id}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">{item.date}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{item.vendor_name}</span>
                      <span className="text-[10px] text-slate-400">TIN: {item.tin_number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.tax_regime === 'VAT_REGISTERED' ? 'VAT Registered' : 'TOT / Non-VAT'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-white block">#{item.order_number}</span>
                      <span className="text-[10px] text-slate-400">#{item.sub_order_id}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ETB {item.gross_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ETB {item.platform_fee_gross.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      ETB {item.vendor_net_payout.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
