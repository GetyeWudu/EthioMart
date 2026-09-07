"use client";

import { useState } from "react";
import { OrderTable } from "@/components/seller/order-table";
import { ShoppingCart, PackageOpen, Truck, CheckCircle, XCircle, DollarSign, RefreshCw, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-blue-600">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending</CardTitle>
            <PackageOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Ready / Ship</CardTitle>
            <Truck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600">{readyOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">{deliveredOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Net Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-indigo-600">
              {revenue.toFixed(2)} <span className="text-[10px] text-slate-500 font-sans">ETB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderTable orders={orders} onRefresh={() => mutate()} />
      </>
      )}
    </div>
  );
}
