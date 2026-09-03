"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Package, Home, Printer, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import api from "@/lib/api";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref') || searchParams.get('reference');
  const { clearCart } = useCartStore();

  const { data: order, error, isLoading, mutate } = useSWR(
    orderId ? `/orders/${orderId}/` : null,
    fetcher
  );

  useEffect(() => {
    // Clear the cart when landing on success page
    clearCart();

    // Verify transaction with Chapa server
    const targetRef = txRef || order?.transaction_reference;
    if (targetRef) {
      api.get(`/payments/verify/${targetRef}/`).then(() => {
        mutate();
      }).catch((err) => {
        console.warn("Chapa verification fallback error:", err);
      });
    }
  }, [txRef, order?.transaction_reference, clearCart, mutate]);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 min-h-[70vh] flex flex-col items-center justify-center">
        <p className="text-slate-500 mb-4">No order details found.</p>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Return to Storefront
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === "PAID";
  const actualShippingFee = Number(order.total_shipping_fee || 0);
  const actualDiscount = Number(order.discount_applied || 0);
  const destinationCity = order.shipping_address?.city || order.shipping_address?.sub_city || 'Addis Ababa';
  const deliveryLabel = order.delivery_method === 'PICKUP' 
    ? `Station Pickup (${destinationCity})` 
    : `Standard Delivery (${destinationCity})`;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 min-h-[70vh] flex flex-col items-center justify-center">
      
      {/* Receipt Container */}
      <div className="max-w-xl w-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
        
        {/* Receipt Header */}
        <div className={`px-8 py-10 text-center relative overflow-hidden ${isPaid ? "bg-emerald-600" : "bg-indigo-600"}`}>
          <div className="absolute -right-10 -top-10 h-32 w-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle2 className={`h-10 w-10 ${isPaid ? "text-emerald-600" : "text-indigo-600"}`} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Payment Successful!</h1>
            <p className="text-emerald-50 text-sm font-medium opacity-90">Thank you for shopping with GechExpress</p>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Order Number</p>
              <p className="font-bold text-slate-900 dark:text-white font-mono text-base">#{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Date Paid</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800 border-dashed border-b-2" />

          {/* Items breakdown */}
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Order Summary</p>
            
            {order.sub_orders?.flatMap((subOrder: any) => 
              subOrder.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm items-center py-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.variant_details?.product?.title || 'Product'} <span className="text-slate-400 text-xs">(x{item.quantity})</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ETB {(Number(item.unit_price) * item.quantity).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
            
            {/* Dynamic Real Shipping Line */}
            <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">{deliveryLabel}</span>
              <span className={`font-bold font-mono ${actualShippingFee > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {actualShippingFee > 0 ? `ETB ${actualShippingFee.toLocaleString('en-ET', { minimumFractionDigits: 2 })}` : 'Free'}
              </span>
            </div>

            {/* Dynamic Real Discount Line */}
            {actualDiscount > 0 && (
              <div className="flex justify-between text-sm items-center text-emerald-600 dark:text-emerald-400">
                <span>Discount ({order.coupon_code || 'Promo'})</span>
                <span className="font-bold font-mono">-ETB {actualDiscount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800" />

          {/* Total & Payment Method */}
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-0.5">Payment Method</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Chapa Gateway 
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {order.payment_status || 'PAID'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-400 font-bold mb-0.5">Total Paid</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-serif">
                ETB {Number(order.total_amount).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={() => router.push("/customer/orders")}>
            <Package className="mr-2 h-5 w-5" />
            Track Order
          </Button>
          <Button variant="outline" size="lg" className="flex-1 font-semibold" onClick={() => window.print()}>
            <Printer className="mr-2 h-5 w-5 text-slate-500" />
            Save Receipt
          </Button>
        </div>
        
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
          <Home className="h-4 w-4" />
          Return to Storefront
        </Link>
      </div>

    </div>
  );
}
