"use client";

import Link from "next/link";
import { use, useState } from "react";
import Image from "next/image";
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
  HelpCircle, 
  CreditCard, 
  Receipt, 
  Printer,
  ShoppingBag
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { DisputeModal } from "@/components/customer/dispute-modal";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, error, isLoading } = useSWR(`/orders/${id}/`, fetcher);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    try {
      setIsRetrying(true);
      const res = await api.post(`/orders/${id}/retry-payment/`);
      if (res.data?.payment?.data?.checkout_url) {
        window.location.href = res.data.payment.data.checkout_url;
      }
    } catch (err: any) {
      console.error("Retry payment failed", err);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3 print:hidden">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading enterprise order hub...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30 p-8 max-w-lg mx-auto print:hidden">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">Failed to load order details.</p>
        <Link href="/customer/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
          &larr; Return to Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === "PAID";
  const actualShippingFee = Number(order.total_shipping_fee || 0);
  const actualDiscount = Number(order.discount_applied || 0);
  const calculatedSubtotal = order.sub_orders?.flatMap((s: any) => s.items || []).reduce((sum: number, item: any) => sum + (Number(item.unit_price) * item.quantity), 0) || (Number(order.total_amount) - actualShippingFee + actualDiscount);
  const calculatedTotal = Math.max(0, calculatedSubtotal + actualShippingFee - actualDiscount);
  const displayTotal = Number(order.total_amount) > 0 && Number(order.total_amount) !== calculatedSubtotal
    ? Number(order.total_amount)
    : calculatedTotal;

  const allItems = order.sub_orders?.flatMap((sub: any) => 
    sub.items?.map((item: any) => ({
      ...item,
      vendorName: sub.vendor_name || sub.vendor?.store_name || "GechExpress Direct"
    })) || []
  ) || [];

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════════════
          1. ON-SCREEN WEB UI (Hidden when printing)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 max-w-7xl mx-auto print:hidden">
        
        {/* Top Enterprise Header Bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link 
                href="/customer/orders" 
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2.5 transition-colors group"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Orders
              </Link>
              
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                  Order #{order.order_number}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isPaid 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                <span>Placed {new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Payment via Chapa Gateway</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isPaid && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className="rounded-xl font-bold text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {isRetrying ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1.5 h-3.5 w-3.5" />}
                  Pay Now
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()} 
                className="rounded-xl font-semibold text-xs h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                Print / Download Invoice
              </Button>
              <Link 
                href="/contact" 
                className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-xl font-semibold text-xs h-9 border border-transparent hover:border-slate-200 dark:hover:border-slate-800" })}
              >
                <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                Need Help?
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Packages, Steppers, Items, Escrow */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Packages & Progress Steppers */}
            {order.sub_orders?.map((subOrder: any, index: number) => {
              const shipment = subOrder.shipment;
              const rawStatus = (subOrder.derived_status === 'DELIVERED' || subOrder.delivered_at || shipment?.status === 'DELIVERED')
                ? 'DELIVERED'
                : (subOrder.derived_status || shipment?.status || 'PENDING');
              const vendorDisplayName = subOrder.vendor_name || subOrder.vendor?.store_name || "GechExpress Direct";

              const stepIndex = (() => {
                if (rawStatus === 'DELIVERED') return 4;
                if (rawStatus === 'DISPATCHED') return 3;
                if (rawStatus === 'PROCESSING' || rawStatus === 'READY_FOR_DISPATCH') return 2;
                return 1;
              })();

              const steps = [
                { title: 'Placed', time: new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) },
                { title: 'Processing', time: stepIndex >= 2 ? 'In Progress' : 'Pending' },
                { title: 'Dispatched', time: subOrder.dispatched_at ? new Date(subOrder.dispatched_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Est: 1-2 days' },
                { title: 'Delivered', time: subOrder.delivered_at ? new Date(subOrder.delivered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Est: 3-5 days' },
              ];

              return (
                <div 
                  key={subOrder.id} 
                  className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        📦
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Package {index + 1} of {order.sub_orders.length}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Fulfilled by <span className="font-semibold text-slate-700 dark:text-slate-300">{vendorDisplayName}</span>
                        </h3>
                      </div>
                    </div>

                    {shipment?.tracking_number ? (
                      <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800">
                        Tracking: {shipment.tracking_number.startsWith('#') ? shipment.tracking_number : `#${shipment.tracking_number}`}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono text-[11px] rounded-lg">
                        Logistics: {order.delivery_method === 'PICKUP' ? 'Station Pickup' : 'Standard Delivery'}
                      </span>
                    )}
                  </div>

                  {/* Connected Stepper */}
                  <div className="relative flex items-center justify-between max-w-xl mx-auto px-4 my-8">
                    <div className="absolute top-5 left-10 right-10 h-1 bg-slate-100 dark:bg-slate-800 -z-0" />
                    <div
                      className="absolute top-5 left-10 h-1 bg-indigo-600 transition-all duration-500 -z-0"
                      style={{ width: `${((stepIndex - 1) / (steps.length - 1)) * 82}%` }}
                    />

                    {steps.map((step, idx) => {
                      const isDone = idx + 1 < stepIndex;
                      const isCurrent = idx + 1 === stepIndex;

                      return (
                        <div key={step.title} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                              isDone
                                ? 'bg-indigo-600 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60'
                                : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                          </div>
                          <span className={`text-xs font-bold mt-2.5 ${isCurrent || isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {step.title}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{step.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipment Event Log */}
                  {shipment?.events && shipment.events.length > 0 && (
                    <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tracking History</h4>
                      {shipment.events.map((evt: any, i: number) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <div className="w-28 shrink-0 text-slate-400 font-mono">
                            {new Date(evt.created_at).toLocaleDateString()} {new Date(evt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{evt.status} <span className="text-slate-400 font-normal">in {evt.location}</span></p>
                            {evt.description && <p className="text-slate-500 text-[11px] mt-0.5">{evt.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Items Ordered Bento Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>🛍️</span> Items Ordered
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  {allItems.length} items total
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.sub_orders?.map((subOrder: any) => {
                  const vendorDisplayName = subOrder.vendor_name || subOrder.vendor?.store_name || "GechExpress Direct";

                  return (
                    <div key={subOrder.id} className="p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-indigo-600" />
                          Store: <span className="text-slate-900 dark:text-white">{vendorDisplayName}</span>
                        </span>

                        {subOrder.active_dispute ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 text-xs font-bold">
                            🛡️ Dispute: {subOrder.active_dispute.status.replace(/_/g, ' ')}
                          </Badge>
                        ) : subOrder.derived_status === "DELIVERED" ? (
                          <DisputeModal 
                            subOrderId={subOrder.id} 
                            vendorName={vendorDisplayName}
                            onSuccess={() => mutate(`/orders/${id}/`)}
                          >
                            <Button variant="outline" size="sm" className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg">
                              ⚠️ Report Issue
                            </Button>
                          </DisputeModal>
                        ) : null}
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {subOrder.items?.map((item: any) => (
                          <div key={item.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Qty: <strong className="text-slate-700 dark:text-slate-300">{item.quantity}</strong> • Unit Price: ETB {Number(item.unit_price).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
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
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                                ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chapa Escrow Protection Card */}
            <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-5 flex items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  🛡️ Chapa Escrow Buyer Protection
                </h4>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 mt-0.5">
                  Funds are securely held in escrow until 48 hours after delivery confirmation and customer inspection.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Payment, Settlement, Address, Cost Breakdown */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Payment & Settlement */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  Payment & Settlement
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Chapa Payment Gateway</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Settlement Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                {order.transaction_reference && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Transaction Reference</span>
                    <div className="bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate border border-slate-200/60 dark:border-slate-800">
                      {order.transaction_reference}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Delivery Address
              </h3>

              <div className="text-xs space-y-2">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {order.customer?.first_name || order.customer?.user?.first_name || 'Customer'} {order.customer?.last_name || order.customer?.user?.last_name || ''}
                </p>
                <p className="text-slate-600 dark:text-slate-400 pl-5">
                  {order.shipping_address?.address_line1 || order.shipping_address?.kebele || 'Bole Sub-City'}, {order.shipping_address?.city || 'Addis Ababa'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 pl-5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {order.shipping_address?.phone_number || '+251 911 000000'}
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200/70 dark:border-slate-800">
                    {order.delivery_method === 'PICKUP' ? 'Station Pickup (Hub)' : 'Doorstep Standard Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Cost Breakdown
              </h3>

              <div className="space-y-3 py-4 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ETB {calculatedSubtotal.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Shipping ({order.delivery_method === 'PICKUP' ? 'Pickup' : 'Standard'})</span>
                  <span className={`font-mono font-bold ${actualShippingFee > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {actualShippingFee > 0 ? `ETB ${actualShippingFee.toLocaleString('en-ET', { minimumFractionDigits: 2 })}` : 'Free'}
                  </span>
                </div>
                {actualDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Promo Discount ({order.coupon_code || 'Voucher'})</span>
                    <span className="font-mono font-bold">-ETB {actualDiscount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Total Paid</span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    ETB {displayTotal.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. DEDICATED EXECUTIVE TAX INVOICE & RECEIPT (Rendered ONLY in print mode)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block bg-white text-slate-900 font-sans p-6 max-w-4xl mx-auto">
        
        {/* Corporate Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xl">
                G
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900" style={{ fontFamily: "serif" }}>
                  GechExpress
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Ethiopia Multi-Vendor Marketplace
                </p>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-800">GechExpress Marketplace PLC</p>
              <p>Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia</p>
              <p>TIN: 0078923412 • VAT Reg: 1548902-8</p>
              <p>support@gechexpress.com • +251 911 23 45 67</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded tracking-wider uppercase mb-2">
              Commercial Tax Invoice
            </span>
            <div className="space-y-1 text-xs">
              <p className="text-slate-500">Invoice No:</p>
              <p className="font-mono font-bold text-sm text-slate-900">INV-{order.order_number}</p>
              <p className="text-slate-500 mt-1">Invoice Date:</p>
              <p className="font-medium text-slate-800">
                {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded uppercase border border-emerald-300">
                ✓ {order.payment_status}
              </div>
            </div>
          </div>
        </div>

        {/* Consignee & Order Metadata 2-Column Grid */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed & Shipped To:
            </span>
            <p className="font-bold text-sm text-slate-900">
              {order.customer?.first_name || order.customer?.user?.first_name || 'Customer'} {order.customer?.last_name || order.customer?.user?.last_name || ''}
            </p>
            <p className="text-slate-600 mt-0.5">
              {order.shipping_address?.address_line1 || order.shipping_address?.kebele || 'Bole'}, {order.shipping_address?.city || 'Addis Ababa'}
            </p>
            <p className="text-slate-600 font-mono">
              Phone: {order.shipping_address?.phone_number || '+251 911 000000'}
            </p>
            <p className="text-slate-500 mt-1">
              Email: {order.customer?.email || order.customer?.user?.email || 'N/A'}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment & Shipping Details:
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Gateway:</span>
              <span className="font-medium text-slate-800">Chapa (Telebirr / Card / Bank)</span>
            </div>
            {order.transaction_reference && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tx Reference:</span>
                <span className="font-mono font-medium text-slate-800">{order.transaction_reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Method:</span>
              <span className="font-medium text-slate-800">
                {order.delivery_method === 'PICKUP' ? 'Station Pickup (Hub)' : 'Doorstep Standard Delivery'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Packages:</span>
              <span className="font-medium text-slate-800">{order.sub_orders?.length || 1} vendor package(s)</span>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-bold w-8">#</th>
                <th className="py-2.5 font-bold">Item Description & Store</th>
                <th className="py-2.5 font-bold">Specifications</th>
                <th className="py-2.5 font-bold text-center w-12">Qty</th>
                <th className="py-2.5 font-bold text-right w-28">Unit Price</th>
                <th className="py-2.5 font-bold text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allItems.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="text-slate-800">
                  <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3">
                    <p className="font-bold text-slate-900">{item.variant_details?.product?.title || 'Product Item'}</p>
                    <p className="text-[10px] text-slate-500">Sold by: {item.vendorName}</p>
                  </td>
                  <td className="py-3 text-[11px] text-slate-600">
                    {item.variant_details?.attribute_values?.map((a: any) => `${a.attribute_name}: ${a.value}`).join(' • ') || 'Standard'}
                  </td>
                  <td className="py-3 text-center font-mono font-medium">{item.quantity}</td>
                  <td className="py-3 text-right font-mono">
                    ETB {Number(item.unit_price).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation Block */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-slate-900">
                ETB {calculatedSubtotal.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Handling:</span>
              <span className="font-mono font-medium text-slate-900">
                {actualShippingFee > 0 ? `ETB ${actualShippingFee.toLocaleString('en-ET', { minimumFractionDigits: 2 })}` : 'Free'}
              </span>
            </div>
            {actualDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Promo Discount ({order.coupon_code || 'Voucher'}):</span>
                <span className="font-mono">-ETB {actualDiscount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-bold text-sm text-slate-900">
              <span>Total Paid:</span>
              <span className="font-mono text-base">
                ETB {displayTotal.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Authentication, Escrow & Footer Seal */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
          <div className="space-y-1 max-w-md">
            <p className="font-semibold text-slate-700">🔒 Official Chapa Escrow Verified Receipt</p>
            <p>This is a computer-generated commercial receipt and tax document. Payment authorized via Chapa Financial Technologies.</p>
            <p>© 2026 GechExpress Inc. All rights reserved. • www.gechexpress.com</p>
          </div>

          <div className="text-right border border-emerald-300 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg">
            <p className="font-black tracking-wider uppercase text-[11px]">PAYMENT VERIFIED</p>
            <p className="font-mono text-[9px] text-emerald-700 mt-0.5">CHAPA ESCROW SETTLED</p>
          </div>
        </div>

      </div>
    </div>
  );
}
