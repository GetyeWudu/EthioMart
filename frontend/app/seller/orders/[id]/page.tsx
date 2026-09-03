"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Check, 
  CheckCircle2, 
  Clock, 
  Download, 
  Loader2, 
  ShieldCheck, 
  Store, 
  MapPin, 
  Phone, 
  User, 
  Printer, 
  FileText, 
  AlertCircle,
  Building2,
  Receipt
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function SellerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: subOrder, error, isLoading } = useSWR(`/seller-orders/${id}/`, fetcher);
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3 print:hidden">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading sub-order fulfillment details...</p>
      </div>
    );
  }

  if (error || !subOrder) {
    return (
      <div className="text-center py-20 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30 p-8 max-w-lg mx-auto print:hidden">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">Failed to load seller order details.</p>
        <Link href="/seller/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
          &larr; Return to Orders
        </Link>
      </div>
    );
  }

  const rawStatus = subOrder.derived_status || subOrder.shipment?.status || subOrder.items?.[0]?.status || 'PENDING';
  const isPaid = subOrder.payment_status === 'PAID';
  const subTotal = Number(subOrder.sub_total || 0);
  const shippingFee = Number(subOrder.shipping_fee || 0);
  const discountApplied = Number(subOrder.discount_applied || 0);
  const netEarnings = Math.max(0, subTotal - discountApplied);

  const handleMarkReady = async () => {
    setIsUpdating(true);
    try {
      await api.post(`/seller-orders/${id}/mark_ready_for_dispatch/`);
      toast.success("Package items marked ready for dispatch.");
      mutate(`/seller-orders/${id}/`);
      mutate(`/seller-orders/`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to mark items ready.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = async () => {
    setIsUpdating(true);
    try {
      const res = await api.post(`/seller-orders/${id}/mark_dispatched/`);
      toast.success("Sub-order dispatched! Inventory deducted & escrow credited.");
      mutate(`/seller-orders/${id}/`);
      mutate(`/seller-orders/`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to dispatch sub-order.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    setIsUpdating(true);
    try {
      await api.post(`/seller-orders/${id}/mark_delivered/`);
      toast.success("Sub-order marked as delivered.");
      mutate(`/seller-orders/${id}/`);
      mutate(`/seller-orders/`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to confirm delivery.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── 1. WEB UI (Hidden in print mode) ─────────────────────────────────── */}
      <div className="space-y-6 print:hidden">
        {/* Header Bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link 
                href="/seller/orders" 
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2.5 transition-colors group"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Orders
              </Link>
              
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                  Sub-Order #{subOrder.id.slice(0, 8).toUpperCase()}
                </h1>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  (Parent #{subOrder.order_number})
                </span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isPaid 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isPaid ? 'PAID VIA CHAPA' : 'PAYMENT PENDING'}
                </span>

                <Badge className={`uppercase text-[11px] font-bold ${
                  rawStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  rawStatus === 'DISPATCHED' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                  rawStatus === 'READY_FOR_DISPATCH' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {rawStatus.replace(/_/g, ' ')}
                </Badge>
              </div>

              {subOrder.created_at && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Order Date: {new Date(subOrder.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()} 
                className="rounded-xl font-semibold text-xs h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                Print Packing Slip
              </Button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Items, Warehouse Allocation, Shipment */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Items Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Order Items for Fulfillment ({subOrder.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {subOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 relative">
                        <Image 
                          src={item.variant_details?.product?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"} 
                          alt={item.variant_details?.product?.title || 'Product'} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">
                          {item.variant_details?.product?.title || 'Product Item'}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          SKU: {item.variant_details?.sku || item.variant?.slice(0, 8) || 'SKU-GEN'} • Qty: <strong className="text-slate-900 dark:text-white">{item.quantity}</strong>
                        </p>
                        {item.variant_details?.attribute_values && item.variant_details.attribute_values.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.variant_details.attribute_values.map((attr: any) => (
                              <span key={attr.id} className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">
                                {attr.attribute_name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'DISPATCHED' ? 'bg-indigo-50 text-indigo-700' :
                          item.status === 'READY_FOR_DISPATCH' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          Item Status: {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Unit: ETB {Number(item.unit_price).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</p>
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking & Shipment Events */}
            {subOrder.shipment && (
              <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Shipment & Dispatch Tracking
                  </h3>
                  <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    Tracking: #{subOrder.shipment.tracking_number}
                  </span>
                </div>

                {subOrder.shipment.events && subOrder.shipment.events.length > 0 ? (
                  <div className="space-y-2.5">
                    {subOrder.shipment.events.map((evt: any, i: number) => (
                      <div key={i} className="flex gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                        <div className="w-28 shrink-0 text-slate-400 font-mono">
                          {new Date(evt.created_at).toLocaleDateString()} {new Date(evt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{evt.status} <span className="text-slate-400 font-normal">in {evt.location}</span></p>
                          {evt.description && <p className="text-slate-500 text-[11px] mt-0.5">{evt.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Package ready for courier pickup and transit dispatch.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Actions, Contact, Financials */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Fulfillment Actions Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                Fulfillment Pipeline Actions
              </h3>

              <div className="space-y-2.5">
                {rawStatus === 'PENDING' || rawStatus === 'PROCESSING' ? (
                  <Button 
                    onClick={handleMarkReady} 
                    disabled={isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs h-10 shadow-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    Mark Ready for Dispatch
                  </Button>
                ) : null}

                {rawStatus === 'READY_FOR_DISPATCH' ? (
                  <Button 
                    onClick={handleDispatch} 
                    disabled={isUpdating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-10 shadow-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                    Dispatch Package to Courier
                  </Button>
                ) : null}

                {rawStatus === 'DISPATCHED' ? (
                  <Button 
                    onClick={handleMarkDelivered} 
                    disabled={isUpdating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-10 shadow-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Confirm Package Delivered
                  </Button>
                ) : null}

                {rawStatus === 'DELIVERED' ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      ✓ Package Delivered Successfully
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                      {subOrder.is_payout_settled ? "Payout settled to available balance." : "Clearing 48h escrow dispute hold."}
                    </p>
                  </div>
                ) : null}

                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="w-full rounded-xl font-semibold text-xs h-9 border-slate-200 dark:border-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Print Packing Slip
                </Button>
              </div>
            </div>

            {/* Customer Delivery Info */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Customer & Delivery Destination
              </h3>

              <div className="text-xs space-y-2">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {subOrder.customer?.first_name || 'Customer'} {subOrder.customer?.last_name || ''}
                </p>
                <p className="text-slate-600 dark:text-slate-400 pl-5">
                  {subOrder.shipping_address?.address_line1 || subOrder.shipping_address?.kebele || 'Bole'}, {subOrder.shipping_address?.city || 'Addis Ababa'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 pl-5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {subOrder.shipping_address?.phone_number || '+251 911 000000'}
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200/70 dark:border-slate-800">
                    {subOrder.delivery_method === 'PICKUP' ? 'Station Pickup (Hub)' : 'Doorstep Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary & Escrow Payout Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Sub-Order Financials & Payout
              </h3>

              <div className="space-y-3 py-4 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Gross Product Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ETB {subTotal.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Promotional Deduction</span>
                    <span className="font-mono font-bold">-ETB {discountApplied.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Seller Revenue</span>
                  <span className="text-[10px] text-slate-400">
                    {subOrder.is_payout_settled ? "Cleared in Available Balance" : "Pending 5m Escrow Clearance"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    ETB {netEarnings.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Escrow badge */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-2.5 border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Secured by <strong>Chapa Multi-Party Escrow</strong>. Funds release to wallet automatically after delivery.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── 2. PRINTABLE PACKING SLIP (Rendered ONLY in print mode) ─────────── */}
      <div className="hidden print:block bg-white text-slate-900 font-sans p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900" style={{ fontFamily: "serif" }}>
              GechExpress
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-1">SELLER PACKING SLIP & DISPATCH MANIFEST</p>
            <p className="text-[10px] text-slate-500">Fulfilled by: {subOrder.vendor_name || 'GechExpress Vendor Store'}</p>
          </div>

          <div className="text-right text-xs space-y-1">
            <span className="inline-block bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded">
              #{subOrder.id.slice(0, 8).toUpperCase()}
            </span>
            <p className="text-slate-500">Parent Order: #{subOrder.order_number}</p>
            {subOrder.shipment?.tracking_number && (
              <p className="font-mono font-bold text-slate-800">Tracking: #{subOrder.shipment.tracking_number}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Deliver To:</span>
            <p className="font-bold text-sm text-slate-900">
              {subOrder.customer?.first_name} {subOrder.customer?.last_name}
            </p>
            <p className="text-slate-600">
              {subOrder.shipping_address?.address_line1 || 'Bole'}, {subOrder.shipping_address?.city || 'Addis Ababa'}
            </p>
            <p className="text-slate-600 font-mono">Phone: {subOrder.shipping_address?.phone_number}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dispatch Details:</span>
            <p className="text-slate-600">Method: <strong>{subOrder.delivery_method === 'PICKUP' ? 'Station Pickup Hub' : 'Doorstep Delivery'}</strong></p>
            <p className="text-slate-600">Payment: <strong>{subOrder.payment_status} (Chapa Gateway)</strong></p>
          </div>
        </div>

        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-2 font-bold w-8">#</th>
                <th className="py-2 font-bold">Product Item</th>
                <th className="py-2 font-bold">SKU / Attributes</th>
                <th className="py-2 font-bold text-center w-12">Qty</th>
                <th className="py-2 font-bold text-right w-24">Price (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subOrder.items?.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 font-bold text-slate-900">{item.variant_details?.product?.title || 'Product Item'}</td>
                  <td className="py-2.5 text-slate-600 font-mono text-[11px]">
                    {item.variant_details?.sku || 'SKU-GEN'} • {item.variant_details?.attribute_values?.map((a: any) => a.value).join(', ') || 'Standard'}
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">
                    ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
          <p>Package verified and sealed by {subOrder.vendor_name || 'GechExpress Vendor'}. Protected by Chapa Escrow.</p>
          <p className="font-mono font-bold">GechExpress Logistics Manifest</p>
        </div>
      </div>
    </div>
  );
}
