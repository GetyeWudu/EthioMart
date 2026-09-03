"use client";

import { useState } from "react";
import { OrderTable } from "@/components/seller/order-table";
import { ShoppingCart, PackageOpen, Truck, CheckCircle, XCircle, DollarSign, RefreshCw, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import useSWR from "swr";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function OrdersPage() {
  const { data: response, error, isLoading, mutate } = useSWR('/seller-orders/', fetcher);
  const orders = Array.isArray(response) ? response : response?.results || [];

  const totalOrders = orders.length;
  // A sub-order's overall status can be determined by its items' statuses, but for now we'll just check if any item is pending, etc.
  const getSubOrderStatus = (order: any) => {
    if (!order.items || order.items.length === 0) return "Pending";
    if (order.items.some((i: any) => i.status === "PENDING")) return "Pending";
    if (order.items.some((i: any) => i.status === "PROCESSING")) return "Processing";
    if (order.items.some((i: any) => i.status === "READY_FOR_DISPATCH")) return "Ready";
    if (order.items.some((i: any) => i.status === "DISPATCHED")) return "Dispatched";
    if (order.items.every((i: any) => i.status === "DELIVERED")) return "Delivered";
    return "Pending";
  };

  const pendingOrders = orders.filter((o: any) => getSubOrderStatus(o) === "Pending").length;
  const readyOrders = orders.filter((o: any) => getSubOrderStatus(o) === "Ready").length;
  const deliveredOrders = orders.filter((o: any) => getSubOrderStatus(o) === "Delivered").length;
  const revenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.sub_total || '0'), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-0">
      
      {/* Top Back Navigation */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800/60">
        <Link href="/seller" className="flex items-center hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div className="flex flex-col ml-4 border-l border-slate-200 dark:border-slate-700 pl-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">My Orders</h1>
          <span className="text-xs text-slate-500">Manage and fulfill customer orders</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/seller" className="sm:hidden flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">My Orders</h1>
            <Badge variant="secondary" className="bg-slate-200/60 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-sm font-medium">{totalOrders} total</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">Track and manage your order fulfillment pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-300 dark:border-slate-700" onClick={() => mutate()}>
            <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-300 dark:border-slate-700">
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">Failed to load orders.</div>
      ) : (
        <>

      {/* Custom 6-Column Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-blue-200 bg-white shadow-sm dark:border-blue-900/30 dark:bg-slate-950 h-16 sm:h-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Orders</span>
            <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-500">{totalOrders}</span>
        </div>
        
        <div className="flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/30 dark:bg-slate-950 h-16 sm:h-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</span>
            <PackageOpen className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-500">{pendingOrders}</span>
        </div>

        <div className="flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/30 dark:bg-slate-950 h-16 sm:h-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ready / Ship</span>
            <Truck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-500">{readyOrders}</span>
        </div>
        
        <div className="flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 h-16 sm:h-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Delivered</span>
            <CheckCircle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">{deliveredOrders}</span>
        </div>
        
        <div className="flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 h-16 sm:h-20 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net Revenue</span>
            <DollarSign className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-serif">{revenue.toFixed(2)} <span className="text-xs sm:text-sm font-sans text-slate-500">ETB</span></span>
        </div>
      </div>

      <OrderTable orders={orders} onRefresh={() => mutate()} />
      </>
      )}
    </div>
  );
}
