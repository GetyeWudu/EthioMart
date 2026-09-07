"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  UpdateIcon,
  PlusIcon,
  ClockIcon,
  ArrowRightIcon,
  LockClosedIcon,
  CardStackIcon,
  ExclamationTriangleIcon,
  ArchiveIcon,
  CubeIcon
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVendorProfile, KYCStatusBanner } from "@/features/vendors";
import { useAuthStore } from "@/stores/auth-store";
import { ClerkDashboard } from "@/components/seller/clerk-dashboard";
import { SalesOverview } from "@/components/seller/sales-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
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
            <UpdateIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Link href="/seller/products/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              <PlusIcon className="w-3.5 h-3.5" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Revenue / Earnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</h3>
            <CardStackIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ETB {kpis.total_net_earnings.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              +20.1% from last month
            </p>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Active Order</h3>
            <ArchiveIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              +{kpis.active_orders}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {kpis.dispatched_orders} currently in transit
            </p>
          </div>
        </div>

        {/* Card 3: Total Units Sold */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Product</h3>
            <CubeIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {kpis.units_sold.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Across all catalog items
            </p>
          </div>
        </div>

        {/* Card 4: Available Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Pay Out</h3>
            <CardStackIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ETB {kpis.available_balance.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Ready for withdrawal
            </p>
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
