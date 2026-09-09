"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Store,
  Phone,
  Search,
  X,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_DOT: Record<string, string> = {
  PAID: "bg-emerald-500",
  DELIVERED: "bg-emerald-500",
  SHIPPED: "bg-blue-500",
  DISPATCHED: "bg-blue-500",
  PROCESSING: "bg-amber-500",
  READY_FOR_DISPATCH: "bg-amber-500",
  PENDING: "bg-slate-400",
  CANCELLED: "bg-rose-500",
};

export function OrderTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusOpen, setStatusOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const { data: response, error, isLoading } = useSWR("/admin/orders/", fetcher);
  const orders: any[] = Array.isArray(response) ? response : response?.results || [];

  const toggleExpand = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PAID":
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold gap-1 uppercase tracking-wide">
            <CheckCircle2 className="h-2.5 w-2.5" /> {s}
          </Badge>
        );
      case "SHIPPED":
      case "DISPATCHED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 text-[10px] font-bold gap-1 uppercase tracking-wide">
            <Truck className="h-2.5 w-2.5" /> {s}
          </Badge>
        );
      case "PROCESSING":
      case "READY_FOR_DISPATCH":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-bold gap-1 uppercase tracking-wide">
            <Package className="h-2.5 w-2.5" /> {s}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wide">
            CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="gap-1 text-[10px] font-bold uppercase tracking-wide"
          >
            <Clock className="h-2.5 w-2.5" /> {s || "PENDING"}
          </Badge>
        );
    }
  };

  const cleanOrderNumber = (num: string) => {
    if (!num) return "N/A";
    return num.replace(/^#?ORD-#?ORD-/, "ORD-").replace(/^#/, "");
  };

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a: any, b: any) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });
  }, [orders]);

  const filteredOrders = React.useMemo(() => {
    return sortedOrders.filter((o: any) => {
      const cleanNum = cleanOrderNumber(o.order_number);
      const cust = o.customer_details;
      const custName = `${cust?.first_name || ""} ${cust?.last_name || ""}`.toLowerCase();
      const custEmail = (cust?.email || "").toLowerCase();
      const custPhone = (cust?.phone_number || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !q ||
        cleanNum.toLowerCase().includes(q) ||
        custName.includes(q) ||
        custEmail.includes(q) ||
        custPhone.includes(q);

      const payStatus = (o.payment_status || "").toUpperCase();
      const ordStatus = (o.status || "").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" || payStatus === statusFilter || ordStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedOrders, searchQuery, statusFilter]);

  const hasFilter = searchQuery !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-4">
      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Toolbar: Search on left, attractive dropdown on right */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          {/* Search — left */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, phone…"
              className="w-full pl-9.5 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-[#1261C9]/20 focus:border-[#1261C9] text-slate-900 dark:text-white placeholder:text-slate-400 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right controls: Attractive Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {/* Status dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setStatusOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs min-w-[135px]"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Status"}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {statusOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-[300] w-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xl py-1.5 text-xs">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                        statusFilter === opt.value
                          ? "text-[#1261C9] dark:text-[#4D8FE0] font-bold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          STATUS_DOT[opt.value] ?? "bg-slate-400"
                        }`}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Reset</span>
              </button>
            )}

            {/* Result count */}
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600 shrink-0">
              {filteredOrders.length} orders
            </span>
          </div>
        </div>

        {/* Table: Essential columns on mobile, full columns on desktop */}
        <div className="overflow-x-auto w-full" onClick={() => setStatusOpen(false)}>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold text-[11px] whitespace-nowrap">
              <tr>
                <th className="w-8 sm:w-10 px-2 sm:px-3 py-3.5 text-center" />
                <th className="px-3 sm:px-4 py-3.5 min-w-[120px]">Order ID</th>
                <th className="hidden sm:table-cell px-4 py-3.5 min-w-[180px]">Customer</th>
                <th className="hidden md:table-cell px-4 py-3.5">Date</th>
                <th className="px-2.5 sm:px-4 py-3.5">Payment</th>
                <th className="px-3 sm:px-4 py-3.5 text-right">Amount</th>
                <th className="px-2.5 sm:px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1261C9] mb-2" />
                    <p className="text-xs">Loading orders…</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-rose-500 text-xs">
                    Failed to load orders. Please refresh.
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No orders found
                    </p>
                    {hasFilter && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="mt-2 text-[11px] text-[#1261C9] dark:text-[#4D8FE0] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const cleanNum = cleanOrderNumber(order.order_number);
                  const cust = order.customer_details;
                  const custFullName = `${cust?.first_name || "Customer"} ${cust?.last_name || ""}`.trim();
                  const custPhone = cust?.phone_number || "";
                  const totalAmt = parseFloat(order.total_amount || 0);
                  const isExpanded = expandedOrders[order.id];

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="w-8 sm:w-10 px-2 sm:px-3 py-3 sm:py-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            onClick={(e) => toggleExpand(order.id, e)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block whitespace-nowrap" title={`#${cleanNum}`}>
                            #{cleanNum}
                          </span>
                          {/* Mobile-only inline customer & date */}
                          <div className="sm:hidden mt-0.5 min-w-0">
                            <span className="font-medium text-slate-700 dark:text-slate-300 block text-[11px] truncate max-w-[120px]" title={custFullName}>
                              {custFullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(order.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1261C9] to-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {custFullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block text-[12px] truncate max-w-[200px]" title={custFullName}>
                                {custFullName}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={custPhone || cust?.email}>
                                {custPhone && (
                                  <Phone className="w-2.5 h-2.5 inline mr-0.5" />
                                )}
                                {custPhone || cust?.email || "No contact"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          {getStatusBadge(order.payment_status)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-mono font-black text-slate-900 dark:text-white text-xs sm:text-[13px] whitespace-nowrap">
                          ETB{" "}
                          {totalAmt.toLocaleString("en-ET", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 sm:py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 h-7 px-2.5 sm:px-3 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-[#EBF2FC] hover:border-[#A8C4ED] hover:text-[#0D4FA8] dark:hover:bg-[#1261C9]/8 dark:hover:text-[#4D8FE0] transition-colors shadow-2xs"
                          >
                            <span className="hidden xs:inline sm:inline">View</span> <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>

                      {/* Expandable sub-orders drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-950/40">
                          <td
                            colSpan={7}
                            className="px-5 py-4 border-b border-slate-200 dark:border-slate-800"
                          >
                            <div className="pl-10 pr-4 py-2 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Vendor Sub-Orders &amp; Fulfillment Splits (
                                  {order.sub_orders?.length || 0})
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  Delivery:{" "}
                                  {order.delivery_method === "PICKUP"
                                    ? "Station Pickup"
                                    : "Doorstep Delivery"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                {order.sub_orders?.map((sub: any) => {
                                  const subTotal = parseFloat(sub.sub_total || 0);
                                  const cut = subTotal * 0.1;
                                  const vName =
                                    sub.vendor_name ||
                                    sub.vendor?.store_name ||
                                    "Merchant Store";

                                  return (
                                    <div
                                      key={sub.id}
                                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
                                    >
                                      <div className="flex flex-wrap justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                                          <Store className="w-3.5 h-3.5 text-[#1261C9]" />
                                          <Link
                                            href={`/admin/sellers/${sub.vendor_id || sub.vendor?.id || ""}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="hover:underline text-[#1261C9] dark:text-[#4D8FE0]"
                                          >
                                            {vName}
                                          </Link>
                                          <span className="font-mono text-[10px] text-slate-400">
                                            (#SUB-{String(sub.id).slice(0, 8).toUpperCase()})
                                          </span>
                                        </div>
                                        {getStatusBadge(
                                          sub.derived_status ||
                                            sub.items?.[0]?.status ||
                                            "PENDING"
                                        )}
                                      </div>

                                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {sub.items?.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="py-2.5 flex gap-3 items-center justify-between"
                                          >
                                            <div className="flex items-center gap-3 min-w-0">
                                              <div className="relative h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 shrink-0">
                                                <Image
                                                  src={
                                                    item.variant_details?.product?.images?.[0]?.image_url ||
                                                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"
                                                  }
                                                  alt="Product"
                                                  fill
                                                  className="object-cover"
                                                />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                  {item.variant_details?.product?.title || "Product"}
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-400">
                                                  SKU: {item.variant_details?.sku || "N/A"} · Qty:{" "}
                                                  {item.quantity}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right font-mono font-bold text-slate-900 dark:text-white shrink-0 text-xs">
                                              ETB{" "}
                                              {parseFloat(item.unit_price || 0).toLocaleString(
                                                "en-ET",
                                                { minimumFractionDigits: 2 }
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">
                                          Subtotal:{" "}
                                          <strong className="text-slate-900 dark:text-white font-mono">
                                            ETB {subTotal.toFixed(2)}
                                          </strong>
                                        </span>
                                        <span className="font-semibold text-[#1261C9] dark:text-[#4D8FE0] font-mono">
                                          Platform 10%: ETB {cut.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredOrders.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              GMV:{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                ETB{" "}
                {filteredOrders
                  .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
                  .toLocaleString("en-ET", { minimumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
