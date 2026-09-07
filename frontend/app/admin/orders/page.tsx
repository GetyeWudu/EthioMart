"use client";

import useSWR from "swr";
import { OrderTable } from "@/components/admin/order-table";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  TrendingUp,
  Truck,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminOrdersPage() {
  const { data: ordersData } = useSWR("/admin/orders/", fetcher);
  const { data: analyticsData } = useSWR("/admin/analytics/?range=30d", fetcher);

  const rawOrders: any[] = Array.isArray(ordersData)
    ? ordersData
    : ordersData?.results || [];

  const totalOrders =
    rawOrders.length > 0
      ? rawOrders.length
      : analyticsData?.kpis?.total_paid_orders || 0;

  const gmv =
    analyticsData?.kpis?.total_gmv ||
    rawOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const inFulfillment = rawOrders.filter((o) => {
    const s = (o.status || "").toUpperCase();
    return (
      s === "PROCESSING" ||
      s === "READY_FOR_DISPATCH" ||
      s === "SHIPPED" ||
      s === "DISPATCHED"
    );
  }).length;

  const completedOrders = rawOrders.filter((o) => {
    const s = (o.status || "").toUpperCase();
    return s === "DELIVERED" || s === "PAID";
  }).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Orders
            </h1>
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] h-5"
            >
              Live
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multi-vendor transaction log · fulfillment splits · commission
            tracking
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Orders
            </span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalOrders.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">All-time volume</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Gross Value
            </span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ETB{" "}
              {Number(gmv).toLocaleString("en-ET", {
                minimumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              via Chapa
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              In Fulfillment
            </span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {inFulfillment}
            </span>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
              Active dispatch queue
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Delivered
            </span>
            <div className="p-2 rounded-xl text-teal-600 bg-teal-50 dark:bg-teal-950/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {completedOrders}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Successfully fulfilled
            </p>
          </div>
        </div>
      </div>

      <OrderTable />
    </div>
  );
}
