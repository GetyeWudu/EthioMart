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
  MoreHorizontal, 
  Package, 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  ExternalLink,
  Store,
  User,
  Phone,
  Search,
  MapPin
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function OrderTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const { data: response, error, isLoading } = useSWR('/admin/orders/', fetcher);
  const orders = Array.isArray(response) ? response : response?.results || [];

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PAID":
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold gap-1 uppercase"><CheckCircle2 className="h-3 w-3" /> {s}</Badge>;
      case "SHIPPED":
      case "DISPATCHED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 text-[10px] font-bold gap-1 uppercase"><Truck className="h-3 w-3" /> {s}</Badge>;
      case "PROCESSING":
      case "READY_FOR_DISPATCH":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-bold gap-1 uppercase"><Package className="h-3 w-3" /> {s}</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 text-[10px] font-bold gap-1 uppercase">CANCELLED</Badge>;
      default:
        return <Badge variant="outline" className="gap-1 text-[10px] font-bold uppercase"><Clock className="h-3 w-3" /> {s || 'PENDING'}</Badge>;
    }
  };

  const totalGMV = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);
  const totalPlatformFees = totalGMV * 0.10; // 10% commission

  const openFulfillmentSplits = orders.reduce((count: number, order: any) => {
    const pendingSubOrders = order.sub_orders?.filter((sub: any) => 
      sub.items?.some((item: any) => item.status === 'PENDING' || item.status === 'PROCESSING' || item.status === 'READY_FOR_DISPATCH')
    ).length || 0;
    return count + pendingSubOrders;
  }, 0);

  const cleanOrderNumber = (num: string) => {
    if (!num) return "N/A";
    return num.replace(/^#?ORD-#?ORD-/, 'ORD-').replace(/^#/, '');
  };

  const filteredOrders = orders.filter((order: any) => {
    const cleanNum = cleanOrderNumber(order.order_number);
    const cust = order.customer_details;
    const custName = `${cust?.first_name || ''} ${cust?.last_name || ''}`.toLowerCase();
    const custEmail = (cust?.email || '').toLowerCase();
    const custPhone = (cust?.phone_number || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return (
      cleanNum.toLowerCase().includes(q) ||
      custName.includes(q) ||
      custEmail.includes(q) ||
      custPhone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* KPI Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Marketplace GMV</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {totalGMV.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl dark:bg-indigo-950/50 dark:text-indigo-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Est. Platform Intermediation Fees (10%)</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {totalPlatformFees.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/50 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Sub-Order Fulfillments</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">{openFulfillmentSplits} Packages</h3>
          </div>
        </div>
      </div>

      {/* Orders Feed Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Global Order Feed</h2>
            <p className="text-xs text-slate-500">Live transaction stream across all merchants and multi-vendor packages.</p>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 w-10"></th>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer Consignee</th>
                <th className="px-5 py-3.5">Order Date</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Total Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading marketplace orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-rose-500">
                    Failed to load global orders.
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const cleanNum = cleanOrderNumber(order.order_number);
                  const cust = order.customer_details;
                  const custFullName = `${cust?.first_name || 'Customer'} ${cust?.last_name || ''}`.trim();
                  const custPhone = cust?.phone_number || '';
                  const totalAmt = parseFloat(order.total_amount || 0);

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-5 py-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white" 
                            onClick={() => toggleExpand(order.id)}
                          >
                            {expandedOrders[order.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{cleanNum}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {custFullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">{custFullName}</span>
                              <span className="text-[11px] text-slate-400 block truncate flex items-center gap-1">
                                {custPhone && <Phone className="w-2.5 h-2.5 inline" />} {custPhone || cust?.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-[11px]">
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(order.payment_status)}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                          ETB {totalAmt.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                          >
                            Details <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </td>
                      </tr>
                      
                      {/* Expanded Sub-Orders Drawer */}
                      {expandedOrders[order.id] && (
                        <tr className="bg-slate-50/75 dark:bg-slate-900/40">
                          <td colSpan={7} className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="pl-9 pr-4 py-2 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Vendor Sub-Orders & Fulfillment Splits ({order.sub_orders?.length || 0})
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  Delivery: {order.delivery_method === 'PICKUP' ? 'Station Pickup (Hub)' : 'Doorstep Delivery'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                {order.sub_orders?.map((subOrder: any) => {
                                  const subTotal = parseFloat(subOrder.sub_total || 0);
                                  const platformCut = subTotal * 0.10;
                                  const vendorDisplayName = subOrder.vendor_name || subOrder.vendor?.store_name || "Merchant Store";

                                  return (
                                    <div key={subOrder.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                                      <div className="flex flex-wrap justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                                          <Store className="w-3.5 h-3.5 text-indigo-600" />
                                          <Link 
                                            href={`/admin/sellers/${subOrder.vendor_id || subOrder.vendor?.id || ''}`}
                                            className="hover:underline text-indigo-600 dark:text-indigo-400"
                                          >
                                            {vendorDisplayName}
                                          </Link>
                                          <span className="font-mono text-[10px] text-slate-400">
                                            (#SUB-{String(subOrder.id).slice(0, 8).toUpperCase()})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {getStatusBadge(subOrder.derived_status || subOrder.items?.[0]?.status || 'PENDING')}
                                        </div>
                                      </div>
                                      
                                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {subOrder.items?.map((item: any) => (
                                          <div key={item.id} className="py-2.5 flex gap-3 items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                              <div className="relative h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 shrink-0">
                                                <Image 
                                                  src={item.variant_details?.product?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"} 
                                                  alt="Thumbnail" 
                                                  fill 
                                                  className="object-cover" 
                                                />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                  {item.variant_details?.product?.title || 'Product'}
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-400">
                                                  SKU: {item.variant_details?.sku || 'N/A'} • Qty: {item.quantity}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right font-mono font-bold text-slate-900 dark:text-white shrink-0">
                                              ETB {parseFloat(item.unit_price || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Subtotal: <strong className="text-slate-900 dark:text-white font-mono">ETB {subTotal.toFixed(2)}</strong></span>
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">Platform 10% Cut: ETB {platformCut.toFixed(2)}</span>
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
      </div>
    </div>
  );
}
