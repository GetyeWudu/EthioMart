"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Package, Truck, MoreVertical, XCircle, Search, Printer, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export function OrderTable({ orders = [], onRefresh }: { orders?: any[], onRefresh?: () => void }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest First");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 gap-1"><CheckCircle2 className="h-3 w-3" /> Delivered</Badge>;
      case "DISPATCHED":
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><Truck className="h-3 w-3" /> Dispatched</Badge>;
      case "READY_FOR_DISPATCH":
        return <Badge className="bg-amber-100 text-amber-800 gap-1"><Package className="h-3 w-3" /> Ready</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      case "PENDING":
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
  };

  const handleMarkReady = async (subOrderId: string) => {
    try {
      await api.post(`/seller-orders/${subOrderId}/mark_ready_for_dispatch/`);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleMarkDispatched = async (subOrderId: string) => {
    try {
      await api.post(`/seller-orders/${subOrderId}/mark_dispatched/`);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || "Failed to dispatch order");
    }
  };

  const handleMarkDelivered = async (subOrderId: string) => {
    try {
      await api.post(`/seller-orders/${subOrderId}/mark_delivered/`);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || "Failed to mark as delivered");
    }
  };

  /** Returns the lowest-priority status from an item list (the sub-order's effective state) */
  const getSubOrderStatus = (items: any[]): string => {
    if (!items || items.length === 0) return "PENDING";
    const priority = ["PENDING", "PROCESSING", "READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"];
    for (const s of priority) {
      if (items.some((i: any) => i.status === s)) return s;
    }
    return "PENDING";
  };

  const filteredOrders = orders.filter((order) => {
    const orderNum = order.order_number || order.order?.order_number || "";
    const customerName = `${order.customer?.first_name || order.order?.customer?.user?.first_name || ""} ${order.customer?.last_name || order.order?.customer?.user?.last_name || ""}`;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((i: any) => i.variant_details?.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === "All") return matchesSearch;
    
    const matchesStatus = order.items?.some((item: any) => item.status === activeTab);
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "Newest First") {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortBy === "Oldest First") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    if (sortBy === "Highest Amount") {
      return parseFloat(b.sub_total || "0") - parseFloat(a.sub_total || "0");
    }
    if (sortBy === "Lowest Amount") {
      return parseFloat(a.sub_total || "0") - parseFloat(b.sub_total || "0");
    }
    return 0;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Left */}
        <div className="relative w-full sm:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, customers, or SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters Right */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={activeTab} onValueChange={(val) => setActiveTab(val || "All")}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                <SelectItem value="READY_FOR_DISPATCH" className="text-xs">Ready for Dispatch</SelectItem>
                <SelectItem value="DISPATCHED" className="text-xs">Dispatched</SelectItem>
                <SelectItem value="DELIVERED" className="text-xs">Delivered</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => setSortBy(val || "Newest First")}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Newest First" className="text-xs">Newest First</SelectItem>
                <SelectItem value="Oldest First" className="text-xs">Oldest First</SelectItem>
                <SelectItem value="Highest Amount" className="text-xs">Highest Amount</SelectItem>
                <SelectItem value="Lowest Amount" className="text-xs">Lowest Amount</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3 font-medium">Order ID & Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Sub Total</th>
              <th className="px-5 py-3 font-medium">Status (Items)</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-10 w-10 mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm">No orders found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <Link href={`/seller/orders/${order.id}`}>
                        <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer">
                          #SUB-{order.id.slice(0, 8).toUpperCase()}
                        </Badge>
                      </Link>
                      {(order.order_number || order.order?.order_number) && (
                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                          #{order.order_number || order.order?.order_number}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="font-medium text-slate-900 dark:text-slate-200">
                        {order.customer?.first_name || order.order?.customer?.user?.first_name || 'Customer'} {order.customer?.last_name || order.order?.customer?.user?.last_name || ''}
                      </p>
                      <p className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{order.shipping_address?.city || order.order?.shipping_address?.city || 'Addis Ababa'} - {order.shipping_address?.address_line1 || order.order?.shipping_address?.address_line1 || 'Bole'}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-3">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative h-12 w-12 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                            <Image src={item.variant_details?.product?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"} alt="Thumbnail" fill className="object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <Link href={`/seller/orders/${order.id}`} className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600">
                              {item.variant_details?.product?.title || 'Product'}
                            </Link>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.variant_details?.attribute_values?.map((attr: any) => (
                                <span key={attr.id} className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                  {attr.attribute_name}: {attr.value}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white align-top font-mono">
                    ETB {parseFloat(order.sub_total || '0').toFixed(2)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs h-12">
                           {getStatusBadge(item.status)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right align-top">
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/seller/orders/${order.id}`} className="inline-flex items-center justify-center h-8 text-xs w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        View Details
                      </Link>

                      {/* Contextual action button based on derived sub-order status */}
                      {(() => {
                        const subStatus = getSubOrderStatus(order.items);
                        if (subStatus === "PENDING" || subStatus === "PROCESSING") {
                          return (
                            <Button size="sm" className="h-8 text-xs w-40 justify-start bg-slate-800 hover:bg-slate-900 text-white" onClick={() => handleMarkReady(order.id)}>
                              <Package className="mr-2 h-3.5 w-3.5" />
                              Mark Ready
                            </Button>
                          );
                        }
                        if (subStatus === "READY_FOR_DISPATCH") {
                          return (
                            <Button size="sm" className="h-8 text-xs w-40 justify-start bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleMarkDispatched(order.id)}>
                              <Truck className="mr-2 h-3.5 w-3.5" />
                              Mark Dispatched
                            </Button>
                          );
                        }
                        if (subStatus === "DISPATCHED") {
                          return (
                            <Button size="sm" className="h-8 text-xs w-40 justify-start bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleMarkDelivered(order.id)}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Mark Delivered
                            </Button>
                          );
                        }
                        if (subStatus === "DELIVERED") {
                          return (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Settled
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
