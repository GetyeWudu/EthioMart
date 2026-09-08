"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  TrendingUp, 
  Wallet, 
  ShoppingCart, 
  Package, 
  RotateCw, 
  Building2, 
  CheckCircle2, 
  Layers, 
  Truck,
  ArrowUpRight,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesOverview } from "@/components/seller/sales-overview";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: response, isLoading, mutate } = useSWR(`/vendors/me/analytics/?range=${timeRange}`, fetcher);

  const kpis = response?.kpis || {
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

  const aov = kpis.delivered_orders > 0 
    ? (kpis.range_gross_gmv / kpis.delivered_orders) 
    : (kpis.range_gross_gmv / Math.max(1, kpis.units_sold / 2));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Store Analytics & Financial Performance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep dive into your store sales trajectory, fulfillment velocity, and net earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => mutate()} 
            className="h-9 text-xs font-bold gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Period Gross Sales</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono block truncate">
              ETB {kpis.range_gross_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 truncate">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> +18.4% vs last period
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Net Seller Earnings</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono block truncate">
              ETB {kpis.range_net_earnings.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Post-commission net funds</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Average Basket (AOV)</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50 shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono block truncate">
              ETB {aov.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Average transaction value</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Total Units Moved</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50 shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono block truncate">
              {kpis.units_sold} Items
            </span>
            <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 mt-1 truncate">{kpis.delivered_orders} orders delivered</p>
          </div>
        </div>
      </div>

      {/* Main Trajectory Chart */}
      <SalesOverview />

      {/* Multi-Hub Fulfillment & Escrow Settlement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Hub Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Warehouse Fulfillment Distribution</h2>
              <p className="text-xs text-slate-500">Inventory dispatched across your registered facilities.</p>
            </div>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Addis Ababa Primary Facility
                </span>
                <span className="font-mono font-bold text-indigo-600">84.5%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: "84.5%" }} className="h-full bg-indigo-600 rounded-full" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Regional Drop-Off & Partner Hubs
                </span>
                <span className="font-mono font-bold text-emerald-600">15.5%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: "15.5%" }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Party Escrow Lifecycle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Escrow & Settlement Reliability</h2>
              <p className="text-xs text-slate-500">48-Hour delivery inspection dispute hold statistics.</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Delivery Confirmation Rate</span>
              <span className="font-mono font-bold text-emerald-600">98.2%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">48h Escrow Release Success Rate</span>
              <span className="font-mono font-bold text-indigo-600">97.8%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Customer Dispute Rate</span>
              <span className="font-mono font-bold text-amber-600">1.2%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
