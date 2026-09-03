"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  TrendingUp, 
  Wallet, 
  Store, 
  Users, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  Package, 
  ArrowRight,
  Download,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformOverview } from "@/components/admin/platform-overview";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminDashboard() {
  const { data: analyticsData, mutate: mutateAnalytics } = useSWR('/admin/analytics/?range=30d', fetcher);
  const { data: escrowData, mutate: mutateEscrow } = useSWR('/admin/payments/escrow-summary/', fetcher);

  const kpis = analyticsData?.kpis || {
    total_gmv: 0,
    range_gmv: 0,
    platform_net_revenue: 0,
    active_sellers: 0,
    total_customers: 0,
  };

  const ops = analyticsData?.operational_counters || {
    pending_kyc: 0,
    pending_payouts_count: 0,
    pending_payouts_sum: 0,
    active_disputes: 0,
    low_stock_alerts: 0,
  };

  const refreshAll = () => {
    mutateAnalytics();
    mutateEscrow();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global metrics, operational command queues, and system health status for GechExpress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAll} 
            className="h-9 text-xs font-bold gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh Metrics
          </Button>
          <Link href="/admin/reports">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export Global Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Quick-Action Badges Command Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link 
          href="/admin/vendors"
          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 block">Pending KYC Reviews</span>
              <span className="text-sm font-black text-amber-950 dark:text-white font-mono">{ops.pending_kyc} Merchants</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/admin/payments"
          className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 block">Pending Payout Queue</span>
              <span className="text-sm font-black text-indigo-950 dark:text-white font-mono">
                {ops.pending_payouts_count} req (ETB {ops.pending_payouts_sum.toLocaleString('en-ET', { minimumFractionDigits: 0 })})
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/admin/disputes"
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 block">Active Disputes</span>
              <span className="text-sm font-black text-rose-950 dark:text-white font-mono">{ops.active_disputes} Cases</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/admin/inventory"
          className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-200 block">Low Stock Alerts</span>
              <span className="text-sm font-black text-blue-950 dark:text-white font-mono">{ops.low_stock_alerts} SKUs</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Metric Cards (ETB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Platform GMV</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.total_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">+12.5% vs last month</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Fee Revenue</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.platform_net_revenue.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">+15.2% vs last month</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Approved Sellers</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.active_sellers} Merchants
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Verified on GechExpress</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Customers</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.total_customers} Customers
            </span>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Active customer accounts</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Live 30-Day GMV Chart & Live Recent Security Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlatformOverview />
        </div>
        <div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Recent Audit Events</h2>
              <Link href="/admin/audit-logs" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            <AuditLogTable limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
