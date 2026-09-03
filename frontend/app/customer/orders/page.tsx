"use client";

import { Package, Search, ChevronRight, Loader2, CheckCircle2, Clock, Truck, ShieldCheck, ArrowRight, CreditCard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import api from "@/lib/api";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function OrdersPage() {
  const { data: response, error, isLoading } = useSWR('/orders/', fetcher);
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const orders = Array.isArray(response) ? response : response?.results || [];

  const handleRetryPayment = async (orderId: string) => {
    try {
      setRetryingId(orderId);
      const res = await api.post(`/orders/${orderId}/retry-payment/`);
      if (res.data?.payment?.data?.checkout_url) {
        window.location.href = res.data.payment.data.checkout_url;
      }
    } catch (err: any) {
      console.error("Retry payment failed", err);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesNumber = order.order_number?.toLowerCase().includes(q);
    const matchesProduct = order.sub_orders?.some((sub: any) =>
      sub.items?.some((item: any) =>
        item.variant_details?.product?.title?.toLowerCase().includes(q)
      )
    );
    return matchesNumber || matchesProduct;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "serif" }}>
            My Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            View and track your recent orders & delivery shipments
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Input 
            placeholder="Search by order # or product..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-slate-500">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30 p-8">
          Failed to load orders. Please try again.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-slate-400">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {searchQuery ? "No matching orders found" : "You have no orders yet"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            {searchQuery ? "Try searching with a different order number or keyword." : "Browse our catalog to discover authentic Ethiopian products and start shopping."}
          </p>
          <Link href="/products" className={buttonVariants({ size: "default", className: "rounded-xl font-semibold" })}>
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order: any) => {
            const isPaid = order.payment_status === 'PAID';
            const allItems = order.sub_orders?.flatMap((sub: any) => 
              sub.items?.map((item: any) => ({
                ...item,
                vendorName: sub.vendor_name || sub.vendor?.store_name || "GechExpress Direct"
              })) || []
            ) || [];

            // Compute fulfillment status across suborders
            const derivedFulfillment = (() => {
              const subOrders = order.sub_orders || [];
              if (subOrders.length === 0) return 'PENDING';

              const subStatuses = subOrders.map((sub: any) => 
                sub.shipment?.status || sub.derived_status || sub.items?.[0]?.status || 'PENDING'
              );

              const totalPkgs = subOrders.length;
              const deliveredCount = subStatuses.filter((s: string) => s === 'DELIVERED').length;
              const dispatchedCount = subStatuses.filter((s: string) => s === 'DISPATCHED').length;
              const inTransitCount = dispatchedCount + deliveredCount;
              const processingCount = subStatuses.filter((s: string) => s === 'PROCESSING' || s === 'READY_FOR_DISPATCH').length;

              if (deliveredCount === totalPkgs) return 'DELIVERED';
              if (deliveredCount > 0) return 'PARTIALLY_DELIVERED';
              if (dispatchedCount === totalPkgs) return 'DISPATCHED';
              if (dispatchedCount > 0) return 'PARTIALLY_DISPATCHED';
              if (processingCount > 0) return 'PROCESSING';
              if (subStatuses.every((s: string) => s === 'CANCELLED')) return 'CANCELLED';
              return 'PENDING';
            })();

            const subOrdersCount = order.sub_orders?.length || 1;
            const deliveredCount = (order.sub_orders || []).filter((s: any) => 
              (s.shipment?.status || s.derived_status || s.items?.[0]?.status) === 'DELIVERED'
            ).length;
            const dispatchedCount = (order.sub_orders || []).filter((s: any) => 
              (s.shipment?.status || s.derived_status || s.items?.[0]?.status) === 'DISPATCHED'
            ).length;

            const fulfillmentConfig: Record<string, { label: string; color: string; icon: any }> = {
              PENDING: { label: 'Order Placed', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', icon: Clock },
              PROCESSING: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', icon: Package },
              PARTIALLY_DISPATCHED: { 
                label: `Partially Dispatched (${dispatchedCount}/${subOrdersCount})`, 
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', 
                icon: Truck 
              },
              DISPATCHED: { label: 'Dispatched', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', icon: Truck },
              PARTIALLY_DELIVERED: { 
                label: `Partially Delivered (${deliveredCount}/${subOrdersCount})`, 
                color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', 
                icon: CheckCircle2 
              },
              DELIVERED: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
              CANCELLED: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', icon: Clock },
            };

            const currentStatus = fulfillmentConfig[derivedFulfillment] || fulfillmentConfig.PENDING;
            const StatusIcon = currentStatus.icon;

            return (
              <div 
                key={order.id} 
                className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
              >
                {/* 1. Header Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Order</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">#{order.order_number}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Payment Status Pill */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isPaid 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </span>

                    {/* Fulfillment Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${currentStatus.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {currentStatus.label}
                    </span>
                  </div>
                </div>

                {/* 2. Order Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 my-2">
                  {allItems.map((item: any) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 relative">
                          <Image 
                            src={item.variant_details?.product?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"} 
                            alt={item.variant_details?.product?.title || 'Product'} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 transition-colors">
                            {item.variant_details?.product?.title || 'Product Item'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Sold by: <span className="font-medium text-slate-700 dark:text-slate-300">{item.vendorName}</span> • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total Amount: <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono ml-1">ETB {Number(order.total_amount || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    {!isPaid && (
                      <button
                        onClick={() => handleRetryPayment(order.id)}
                        disabled={retryingId === order.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {retryingId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                        Pay Now
                      </button>
                    )}
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredOrders.length > 0 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white pointer-events-none opacity-50" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white border-transparent">
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white pointer-events-none opacity-50" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
