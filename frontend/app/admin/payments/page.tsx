"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  RotateCw, 
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BatchPayoutModal } from "@/components/admin/batch-payout-modal";
import api from "@/lib/api";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [syncingTxRef, setSyncingTxRef] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);

  // SWR Live Feeds
  const { data: summaryData, mutate: mutateSummary } = useSWR('/admin/payments/escrow-summary/', fetcher);
  const { data: txnsData, error: txnsError, isLoading: txnsLoading, mutate: mutateTxns } = useSWR('/admin/payments/transactions/', fetcher);
  const { data: payoutsData, mutate: mutatePayouts } = useSWR('/admin/payments/payouts/', fetcher);

  const kpiData = summaryData?.kpis || {
    total_platform_gmv: 0,
    active_escrow_held: 0,
    platform_net_revenue: 0,
    platform_vat_liability: 0,
    held_orders_count: 0,
    pending_payouts_count: 0,
  };

  const transactions: any[] = txnsData?.results || [];
  const payouts: any[] = payoutsData?.results || [];
  const pendingPayouts = payouts.filter(p => p.status === 'PENDING');

  const handleSyncSingle = async (txRef: string) => {
    setSyncingTxRef(txRef);
    try {
      const res = await api.post(`/admin/payments/sync/${txRef}/`);
      toast.success(res.data?.detail || "Transaction reconciled successfully with Chapa!");
      mutateTxns();
      mutateSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reconcile transaction with Chapa.");
    } finally {
      setSyncingTxRef(null);
    }
  };

  const handleSyncAllPending = async () => {
    setIsSyncingAll(true);
    try {
      const res = await api.post("/admin/payments/sync-pending/");
      toast.success(res.data?.message || "Reconciled all pending transactions.");
      mutateTxns();
      mutateSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to sync pending transactions.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const refreshAll = () => {
    mutateSummary();
    mutateTxns();
    mutatePayouts();
    toast.info("Refreshed payment and escrow ledger feeds.");
  };

  const filteredTxns = transactions.filter(tx => {
    const matchesSearch = 
      tx.txRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.chapaReference && tx.chapaReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === "ALL" || tx.method.toLowerCase().includes(methodFilter.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getMethodBadge = (method: string) => {
    const m = (method || "").toLowerCase();
    if (m.includes("telebirr")) {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">📱 Telebirr</Badge>;
    }
    if (m.includes("cbe") || m.includes("cbebirr")) {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-bold">🏦 CBE Birr</Badge>;
    }
    if (m.includes("awash")) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold">🏛️ Awash Bank</Badge>;
    }
    return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-bold">💳 Chapa Card / Gateway</Badge>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payments & Platform Escrow</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Chapa gateway transaction feed, multi-party escrow audit trail, and automated seller disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncAllPending} 
            disabled={isSyncingAll}
            className="h-9 text-xs font-bold gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            Sync Pending ({transactions.filter(t => t.status === 'PENDING').length})
          </Button>

          <BatchPayoutModal 
            pendingPayouts={pendingPayouts} 
            onSuccess={() => { mutatePayouts(); mutateSummary(); }} 
          />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshAll} 
            className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Platform GMV</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ETB {kpiData.total_platform_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">Gross transactions processed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Escrow (Held 5m)</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ETB {kpiData.active_escrow_held.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
              {kpiData.held_orders_count} sub-orders in dispute window
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Net Revenue</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ETB {kpiData.platform_net_revenue.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Net intermediation commission</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Output VAT (15%)</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ETB {kpiData.platform_vat_liability.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">MoR Form 1142 Tax Liability</p>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TxRef, customer, or order #..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-2 text-slate-600 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <select 
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-2 text-slate-600 dark:text-slate-300"
            >
              <option value="ALL">All Payment Rails</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe">CBE Birr</option>
              <option value="chapa">Chapa / Card</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tx Reference</th>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Customer Consignee</th>
                <th className="px-5 py-3.5 text-right">Amount (ETB)</th>
                <th className="px-5 py-3.5">Payment Rail</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Escrow State</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {txnsLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading Chapa transaction ledger...
                  </td>
                </tr>
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    No transactions matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((tx) => {
                  const isSyncingThis = syncingTxRef === tx.txRef;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.txRef}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500">
                        #{tx.orderId}
                      </td>
                      <td className="px-5 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{tx.customerName}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{tx.customerEmail || tx.customerPhone}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        ETB {tx.amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        {getMethodBadge(tx.method)}
                      </td>
                      <td className="px-5 py-4">
                        {tx.status === "PAID" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> PAID
                          </Badge>
                        ) : tx.status === "PENDING" ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" /> PENDING
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 mr-1" /> FAILED
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.escrowState.includes('HELD')
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                            : tx.escrowState === 'RELEASED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {tx.escrowState}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {tx.date}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === "PENDING" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSyncSingle(tx.txRef)}
                              disabled={isSyncingThis}
                              className="h-7 text-[11px] px-2 font-bold text-indigo-600 hover:text-indigo-700"
                              title="Query Chapa Verification API"
                            >
                              <RotateCw className={`w-3 h-3 mr-1 ${isSyncingThis ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedTxn(tx)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Inspect Payload & Audit Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Inspection Dialog */}
      <Dialog open={!!selectedTxn} onOpenChange={(open) => !open && setSelectedTxn(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto text-xs">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
                Transaction Audit: {selectedTxn?.txRef}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Gateway verification logs, webhook signatures, and escrow breakdown.
            </DialogDescription>
          </DialogHeader>

          {selectedTxn && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Chapa Reference</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedTxn.chapaReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gross Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">ETB {selectedTxn.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer Consignee</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedTxn.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Webhook Verified At</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedTxn.webhookVerifiedAt || 'Direct Polling'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Raw Gateway Response Payload:
                </span>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedTxn.rawPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
