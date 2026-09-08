"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArchiveIcon,
  IdCardIcon,
  AvatarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
  DownloadIcon,
  UpdateIcon,
  TokensIcon,
  CardStackIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  Store, 
  Users, 
  Package, 
  ExternalLink,
  Receipt,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformOverview } from "@/components/admin/platform-overview";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { PlatformStatCard } from "@/components/admin/platform-stat-card";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminDashboard() {
  const { data: analyticsData, isLoading, mutate: mutateAnalytics } = useSWR("/admin/analytics/?range=30d", fetcher);
  const { data: escrowData, mutate: mutateEscrow } = useSWR("/admin/payments/escrow-summary/", fetcher);
  const { data: recentOrdersData } = useSWR("/admin/orders/", fetcher);

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

  const escrowKpis = escrowData?.kpis || {
    active_escrow_held: 0,
    platform_vat_liability: 0,
    held_orders_count: 0,
  };

  const rawOrders = Array.isArray(recentOrdersData) ? recentOrdersData : recentOrdersData?.results || [];
  const recentOrders = rawOrders.slice(0, 5);

  const refreshAll = () => {
    mutateAnalytics();
    mutateEscrow();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Ethiopian marketplace metrics, multi-party escrow balances, and operational command queues.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <UpdateIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Feed
          </Button>
          <Link href="/admin/reports">
            <Button size="sm" className="bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white font-bold text-xs gap-1.5 shadow-md shadow-[#1261C9]/20 rounded-xl transition-all">
              <DownloadIcon className="w-3.5 h-3.5" /> Export MoR Form 1142
            </Button>
          </Link>
        </div>
      </div>



      {/* Executive Metric Cards (ETB) - 2 rows x 2 columns grid (including mobile) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
        <Link href="/admin/analytics" className="block cursor-pointer transition-transform hover:scale-[1.02] min-w-0 w-full">
          <PlatformStatCard 
            title="Total Platform GMV" 
            amount={`ETB ${kpis.total_gmv.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`} 
            trend="14.8%" 
            trendUp={true} 
            highlight={true} 
          />
        </Link>

        <Link href="/admin/commissions" className="block cursor-pointer transition-transform hover:scale-[1.02] min-w-0 w-full">
          <PlatformStatCard 
            title="Platform Fee Revenue" 
            amount={`ETB ${kpis.platform_net_revenue.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`} 
            trend="10% Net" 
            trendUp={true} 
          />
        </Link>

        <Link href="/admin/vendors" className="block cursor-pointer transition-transform hover:scale-[1.02] min-w-0 w-full">
          <PlatformStatCard 
            title="Verified Merchants" 
            amount={kpis.active_sellers.toString()} 
            trend="5.2%" 
            trendUp={true} 
          />
        </Link>

        <Link href="/admin/customers" className="block cursor-pointer transition-transform hover:scale-[1.02] min-w-0 w-full">
          <PlatformStatCard 
            title="Registered Customers" 
            amount={kpis.total_customers.toString()} 
            trend="12.4%" 
            trendUp={true} 
          />
        </Link>
      </div>



      {/* Main Charts & Live Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Platform Transaction Trajectory Chart */}
        <div className="lg:col-span-2">
          <PlatformOverview />
        </div>

        {/* Right 1 Col: Live Recent Store Orders Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <ArchiveIcon className="w-4 h-4 text-[#1261C9]" />
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Store Orders</h2>
              </div>
              <Link href="/admin/orders" className="text-xs font-bold text-[#1261C9] dark:text-[#4D8FE0] hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders recorded yet. Marketplace transactions will appear here in real-time.
                </div>
              ) : (
                recentOrders.map((ord: any) => {
                  const cust = ord.customer_details;
                  const custName = `${cust?.first_name || "Customer"} ${cust?.last_name || ""}`.trim();
                  const totalAmt = parseFloat(ord.total_amount || 0);

                  return (
                    <Link
                      key={ord.id}
                      href={`/admin/orders/${ord.id}`}
                      className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors flex items-center justify-between text-xs min-w-0 cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white">
                          <span>#{String(ord.order_number).slice(-8).toUpperCase()}</span>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">
                            {ord.payment_status || "PAID"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {custName} • {ord.sub_orders?.length || 1} sub-order package(s)
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          ETB {totalAmt.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString("en-ET", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Link href="/admin/orders" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl">
                Inspect Global Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Security & Audit Events Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-4 h-4 text-[#1261C9]" />
            <h2 className="font-sans font-black text-slate-900 dark:text-white text-lg tracking-tight">
              Cryptographic Security & System Audit Trail
            </h2>
          </div>
          <Link href="/admin/audit-logs" className="text-xs font-bold text-[#1261C9] dark:text-[#4D8FE0] hover:underline">
            View Complete Trail
          </Link>
        </div>
        <AuditLogTable limit={5} />
      </div>
    </div>
  );
}
