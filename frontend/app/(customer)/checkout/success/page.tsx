"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Home,
  Printer,
  CreditCard,
  Loader2,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import api from "@/lib/api";

import { useEffect, useState, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const txRef =
    searchParams.get("tx_ref") ||
    searchParams.get("trx_ref") ||
    searchParams.get("reference");
  const { clearCart } = useCartStore();

  const [pollCount, setPollCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const maxPolls = 15; // 15 polls * 2 seconds = 30 seconds max wait
  const verifyAttemptedRef = useRef(false);

  // Poll order status every 2 seconds while PENDING
  const {
    data: order,
    error,
    isLoading,
    mutate,
  } = useSWR(orderId ? `/orders/${orderId}/` : null, fetcher, {
    refreshInterval: (latestData) => {
      if (!latestData || latestData.payment_status === "PAID" || latestData.payment_status === "FAILED") {
        return 0;
      }
      return pollCount < maxPolls ? 2000 : 0;
    },
    onSuccess: (data) => {
      if (data && data.payment_status !== "PAID") {
        setPollCount((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    // Clear the cart when landing on success page
    clearCart();

    // Trigger proactive verification check once in background
    const targetRef = txRef || order?.transaction_reference;
    if (targetRef && !verifyAttemptedRef.current) {
      verifyAttemptedRef.current = true;
      setIsVerifying(true);
      api
        .get(`/payments/verify/${targetRef}/`)
        .then(() => {
          mutate();
        })
        .catch((err) => {
          console.warn("Chapa verification check error:", err);
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, [txRef, order?.transaction_reference, clearCart, mutate]);

  const handleManualRefresh = async () => {
    setIsVerifying(true);
    const targetRef = txRef || order?.transaction_reference;
    if (targetRef) {
      try {
        await api.get(`/payments/verify/${targetRef}/`);
      } catch (err) {
        console.warn("Manual refresh verify error:", err);
      }
    }
    await mutate();
    setIsVerifying(false);
  };

  // 1. Initial Loading State (Fetching order details)
  if (isLoading && !order) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[75vh] flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin flex items-center justify-center"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connecting to Secure Gateway...</h2>
        <p className="text-slate-500 text-sm">Retrieving your order information...</p>
      </div>
    );
  }

  // 2. Order Not Found State
  if (!order && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[75vh] flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Order Not Found</h2>
        <p className="text-slate-500 mb-6 max-w-md">We could not locate the details for this order. Please check your order history or contact support.</p>
        <div className="flex gap-4">
          <Link href="/customer/orders">
            <Button variant="default">View My Orders</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === "PAID";
  const isFailed = order.payment_status === "FAILED";
  const isTimedOut = !isPaid && !isFailed && pollCount >= maxPolls;

  // 3. Confirming Order State (While PENDING and polling)
  if (!isPaid && !isFailed && !isTimedOut) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 min-h-[75vh] flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center relative overflow-hidden">
          {/* Top glowing ambient effect */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Animated Spinner Icon */}
          <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
            <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-950/70 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Confirming Your Order...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            Please wait while we verify your transaction securely with Chapa gateway. This usually takes just a few seconds.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 mb-6 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Amount:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ETB {Number(order.total_amount).toLocaleString("en-ET", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                Awaiting Gateway Confirmation
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            <span>Please do not close or refresh this window...</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Polling Timeout / Asynchronous Confirmation Pending
  if (isTimedOut) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 min-h-[75vh] flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center">
          <div className="h-16 w-16 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Clock className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Payment Processing
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            Your transaction was received! If you paid via mobile money (Telebirr / CBEBirr), it may take a minute for the network to dispatch the confirmation webhook.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-6 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Total:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ETB {Number(order.total_amount).toLocaleString("en-ET", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              variant="default"
              disabled={isVerifying}
              onClick={handleManualRefresh}
              className="w-full font-semibold"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isVerifying ? "animate-spin" : ""}`} />
              {isVerifying ? "Checking Status..." : "Refresh Payment Status"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/customer/orders")}
              className="w-full font-semibold"
            >
              <Package className="mr-2 h-4 w-4" />
              View in Order History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Payment Failed State
  if (isFailed) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 min-h-[75vh] flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-3xl border border-rose-200 dark:border-rose-950 shadow-2xl p-8 text-center">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Payment Incomplete
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            The payment gateway indicated that this transaction was not completed or was cancelled. Your card or wallet was not debited.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              variant="default"
              onClick={() => router.push(`/customer/orders/${order.id}`)}
              className="w-full font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Retry Payment
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="w-full font-semibold">
                <Home className="mr-2 h-4 w-4" />
                Return to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 6. Confirmed & Paid State (Full celebratory receipt)
  const actualShippingFee = Number(order.total_shipping_fee || 0);
  const actualDiscount = Number(order.discount_applied || 0);
  const destinationCity =
    order.shipping_address?.city || order.shipping_address?.sub_city || "Addis Ababa";
  const deliveryLabel =
    order.delivery_method === "PICKUP"
      ? `Station Pickup (${destinationCity})`
      : `Standard Delivery (${destinationCity})`;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 min-h-[70vh] flex flex-col items-center justify-center">
      {/* Receipt Container */}
      <div className="max-w-xl w-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative animate-in fade-in-50 duration-500">
        {/* Receipt Header */}
        <div className="px-8 py-10 text-center relative overflow-hidden bg-emerald-600">
          <div className="absolute -right-10 -top-10 h-32 w-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-black opacity-10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Payment Successful!
            </h1>
            <p className="text-emerald-50 text-sm font-medium opacity-90">
              Thank you for shopping with EthioMart
            </p>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                Order Number
              </p>
              <p className="font-bold text-slate-900 dark:text-white font-mono text-base">
                #{order.order_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                Date Paid
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800 border-dashed border-b-2" />

          {/* Items breakdown */}
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Order Summary
            </p>

            {order.sub_orders?.flatMap((subOrder: any) =>
              subOrder.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm items-center py-1"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.variant_details?.product?.title || "Product"}{" "}
                    <span className="text-slate-400 text-xs">
                      (x{item.quantity})
                    </span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ETB{" "}
                    {(Number(item.unit_price) * item.quantity).toLocaleString(
                      "en-ET",
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
              ))
            )}

            {/* Dynamic Real Shipping Line */}
            <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">
                {deliveryLabel}
              </span>
              <span
                className={`font-bold font-mono ${
                  actualShippingFee > 0
                    ? "text-slate-900 dark:text-white"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {actualShippingFee > 0
                  ? `ETB ${actualShippingFee.toLocaleString("en-ET", {
                      minimumFractionDigits: 2,
                    })}`
                  : "Free"}
              </span>
            </div>

            {/* Dynamic Real Discount Line */}
            {actualDiscount > 0 && (
              <div className="flex justify-between text-sm items-center text-emerald-600 dark:text-emerald-400">
                <span>Discount ({order.coupon_code || "Promo"})</span>
                <span className="font-bold font-mono">
                  -ETB{" "}
                  {actualDiscount.toLocaleString("en-ET", {
                    minimumFractionDigits: 2,
                  })}
                </span>
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
                <p className="text-xs text-slate-400 font-bold mb-0.5">
                  Payment Method
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Chapa Gateway
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    PAID
                  </span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-400 font-bold mb-0.5">Total Paid</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-serif">
                ETB{" "}
                {Number(order.total_amount).toLocaleString("en-ET", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={() => router.push("/customer/orders")}
          >
            <Package className="mr-2 h-5 w-5" />
            Track Order
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 font-semibold"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-5 w-5 text-slate-500" />
            Save Receipt
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
        >
          <Home className="h-4 w-4" />
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}
