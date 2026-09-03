"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  TrendingUp, 
  Wallet, 
  ShoppingCart, 
  Package, 
  Eye, 
  Plus, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  RotateCw,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVendorProfile, KYCStatusBanner } from "@/features/vendors";
import { useAuthStore } from "@/stores/auth-store";
import { ClerkDashboard } from "@/components/seller/clerk-dashboard";
import { SalesOverview } from "@/components/seller/sales-overview";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function SellerDashboard() {
  const { profile } = useVendorProfile();
  const user = useAuthStore((s) => s.user);

  const [timeRange, setTimeRange] = useState("30d");
  const { data: analyticsData, isLoading, mutate } = useSWR(`/vendors/me/analytics/?range=${timeRange}`, fetcher);
  const { data: walletData } = useSWR('/vendors/me/wallet/', fetcher);

  if (user?.vendor_staff_role === "INVENTORY_CLERK") {
    return <ClerkDashboard />;
  }

  const kpis = analyticsData?.kpis || {
    available_balance: walletData?.available_balance || 0,
    escrow_balance: walletData?.escrow_balance || 0,
    total_withdrawn: walletData?.total_withdrawn || 0,
    range_gross_gmv: 0,
    range_net_earnings: 0,
    total_gross_gmv: 0,
    total_net_earnings: 0,
    active_orders: 0,
    dispatched_orders: 0,
    delivered_orders: 0,
    units_sold: 0,
    low_stock_count: 0,
  };

  const recentOrders: any[] = analyticsData?.recent_orders || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Live KYC Compliance Banner */}
      <KYCStatusBanner profile={profile} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Merchant Command Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time store performance, multi-party escrow balances, and order fulfillment queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => mutate()} 
            className="h-9 text-xs font-bold gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Link href="/seller/products/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Quick-Action Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link 
          href="/seller/orders?tab=Pending"
          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 block">Pending Dispatch</span>
              <span className="text-sm font-black text-amber-950 dark:text-white font-mono">{kpis.active_orders} Orders</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/seller/earnings"
          className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-200 block">In Escrow (48h Hold)</span>
              <span className="text-sm font-black text-blue-950 dark:text-white font-mono">
                ETB {kpis.escrow_balance.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/seller/earnings"
          className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 block">Available Payout</span>
              <span className="text-sm font-black text-emerald-950 dark:text-white font-mono">
                ETB {kpis.available_balance.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link 
          href="/seller/inventory?low_stock=true"
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 block">Low Stock Alerts</span>
              <span className="text-sm font-black text-rose-950 dark:text-white font-mono">{kpis.low_stock_count} SKUs</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Metric Cards (ETB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Net Earnings (ETB)</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.total_net_earnings.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">+20.1% vs last month</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Sub-Orders</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.active_orders} In Pipeline
            </span>
            <p className="text-[11px] text-slate-400 mt-1">{kpis.dispatched_orders} in transit</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Products & Units Sold</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.units_sold} Units
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Across all active catalog items</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesOverview />
        </div>

        {/* Recent Orders Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Store Orders</h2>
              <Link href="/seller/orders" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders recorded yet. Promote your products to start selling!
                </div>
              ) : (
                recentOrders.map((ord) => (
                  <div key={ord.id} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                        <span>#{ord.order_number}</span>
                        <Badge variant="outline" className="text-[9px] font-bold">
                          {ord.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 block">{ord.customer_name} • {ord.items_count} items</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        ETB {ord.total_amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400">{ord.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Link href="/seller/orders" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                Manage All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
