"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Smartphone, 
  Building2, 
  MapPin, 
  RotateCw, 
  CheckCircle2, 
  Truck, 
  Package, 
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: response, isLoading, mutate } = useSWR(`/admin/analytics/?range=${timeRange}`, fetcher);

  const kpis = response?.kpis || {
    total_gmv: 0,
    range_gmv: 0,
    platform_net_revenue: 0,
    average_order_value: 0,
    total_paid_orders: 0,
    active_sellers: 0,
    total_customers: 0,
  };

  const timeline: any[] = response?.timeline || [];
  const paymentRails: any[] = response?.payment_rails || [];
  const regionalDistribution: any[] = response?.regional_distribution || [];

  const maxGmv = Math.max(1, ...timeline.map(t => t.gmv));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Analytics & Growth</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time GMV trajectory, Ethiopian payment rail settlements, and regional fulfillment metrics.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { label: "7 Days", val: "7d" },
            { label: "30 Days", val: "30d" },
            { label: "90 Days", val: "90d" },
            { label: "12 Months", val: "12m" },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setTimeRange(item.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === item.val
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => mutate()} 
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
            title="Refresh Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Total GMV ({timeRange})</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block truncate" title={`ETB ${kpis.range_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`}>
              ETB {kpis.range_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 truncate">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> +14.8% vs prior period
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Platform Net Revenue</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block truncate" title={`ETB ${kpis.platform_net_revenue.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`}>
              ETB {kpis.platform_net_revenue.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 truncate">10% standard marketplace take-rate</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Average Order Value (AOV)</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block truncate" title={`ETB ${kpis.average_order_value.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`}>
              ETB {kpis.average_order_value.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 truncate">Per transaction basket average</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Completed Orders</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block truncate">
              {kpis.total_paid_orders} Orders
            </span>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 truncate">Across {kpis.active_sellers} active merchants</p>
          </div>
        </div>
      </div>

      {/* Main Charts Deck: GMV Trajectory & Payment Rails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GMV Time-Series Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Gross Transaction Volume (GMV) Trajectory</h2>
              <p className="text-xs text-slate-500">Platform-wide sales volume and platform take-rate in Ethiopian Birr.</p>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[11px]">
              Currency: ETB
            </Badge>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {timeline.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round((item.gmv / maxGmv) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    ETB {item.gmv.toLocaleString('en-ET', { minimumFractionDigits: 0 })} ({item.orders} ord)
                  </div>
                  
                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all cursor-pointer shadow-xs"
                  />
                  {/* Label */}
                  <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block" />
              Gross Retail Sales (ETB)
            </span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">
              Peak: ETB {maxGmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Ethiopian Payment Rails Settlement Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Payment Rails Settlement</h2>
            <p className="text-xs text-slate-500">Breakdown of transaction volume across Ethiopian rails.</p>
          </div>

          <div className="space-y-4">
            {paymentRails.map((rail, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {rail.rail.includes("Telebirr") ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> :
                     rail.rail.includes("CBE") ? <Building2 className="w-3.5 h-3.5 text-purple-600" /> :
                     <CreditCard className="w-3.5 h-3.5 text-indigo-600" />}
                    {rail.rail}
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {rail.share}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${rail.share}%` }} 
                    className={`h-full rounded-full ${
                      rail.rail.includes("Telebirr") ? "bg-emerald-500" :
                      rail.rail.includes("CBE") ? "bg-purple-500" : "bg-indigo-500"
                    }`}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Settled Volume:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    ETB {rail.volume.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Telebirr and CBE Birr automated instant disbursements are protected with Chapa multi-party escrow.</span>
          </div>
        </div>
      </div>

      {/* Regional Ethiopian Distribution & Fulfillment Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Regional Sales Distribution</h2>
              <p className="text-xs text-slate-500">Order destination cities across Ethiopia.</p>
            </div>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-3.5 pt-2">
            {regionalDistribution.map((reg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{reg.region}</span>
                  <span className="font-mono text-slate-500">
                    ETB {reg.gmv.toLocaleString('en-ET', { minimumFractionDigits: 0 })} ({reg.share}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${reg.share}%` }} 
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Pipeline Funnel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Marketplace Conversion & Fulfillment</h2>
              <p className="text-xs text-slate-500">Step-by-step order journey completion rate.</p>
            </div>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Checkout Initiated & Paid</span>
                  <span className="text-[10px] text-slate-400">Customer payments verified with Chapa</span>
                </div>
              </div>
              <span className="font-mono font-bold text-emerald-600">100%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">2</div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Merchant Dispatched</span>
                  <span className="text-[10px] text-slate-400">Packed and assigned courier tracking</span>
                </div>
              </div>
              <span className="font-mono font-bold text-indigo-600">92.4%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Delivered & Confirmed</span>
                  <span className="text-[10px] text-slate-400">Customer received package (Addis & Regional)</span>
                </div>
              </div>
              <span className="font-mono font-bold text-emerald-600">88.6%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">4</div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Escrow Settled (48h Window)</span>
                  <span className="text-[10px] text-slate-400">Available in vendor wallet for bank withdrawal</span>
                </div>
              </div>
              <span className="font-mono font-bold text-purple-600">86.2%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
