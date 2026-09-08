"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Package, ShieldCheck, CheckCircle2, ArrowLeft, Clock, Lock, CreditCard, RotateCcw, AlertTriangle } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";

interface CartSummaryProps {
  items?: any[];
  subtotal: number;
  discount?: number;
}

export function CartSummary({ items = [], subtotal, discount = 0 }: CartSummaryProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isSuspended } = useCurrentUser();
  const total = Math.max(0, subtotal - discount);

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!isAuthenticated && !token) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      {/* Header with EthioMart Brand Gradient */}
      <div className="bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] text-white px-5 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#FF7900]" />
          <h2 className="text-base font-bold tracking-tight">Order Summary</h2>
        </div>
        <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
          <Package className="w-3.5 h-3.5" />
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      
      <div className="p-6">
        {/* Pricing Breakdown */}
        <div className="space-y-3 text-sm mb-5">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-900 dark:text-white font-semibold">ETB {subtotal.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span>-ETB {discount.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-end mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white">Total</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Shipping calculated at checkout</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl text-[#1261C9] dark:text-blue-400 font-serif">
              ETB {total.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">VAT inclusive</div>
          </div>
        </div>

        {/* Checkout Button */}
        {isSuspended ? (
          <div className="space-y-2 mb-4">
            <button
              type="button"
              disabled
              className="w-full text-sm font-bold h-12 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Purchasing Suspended
            </button>
            <p className="text-[11px] text-center text-amber-700 dark:text-amber-300/80">
              Your purchasing privileges are suspended. Contact customer support to appeal.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="w-full text-base font-bold h-13 py-3.5 bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white border-0 transition-all flex items-center justify-center gap-2 mb-4 rounded-xl shadow-lg shadow-[#1261C9]/25 cursor-pointer active:scale-[0.99]"
          >
            <ShieldCheck className="w-5 h-5 text-[#FF7900]" />
            Proceed to Checkout
          </button>
        )}

        <div className="text-center mb-6">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-[#1261C9] transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Continue Shopping
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] mb-6">
          <Clock className="w-3.5 h-3.5" />
          Estimated delivery: 3-5 business days across Ethiopia
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#FF7900]" />
            SSL Encrypted
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1261C9]" />
            Buyer Escrow Shield
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#FF7900]" />
            Telebirr • CBE • Cards
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            7-Day Easy Returns
          </div>
        </div>
      </div>
    </div>
  );
}
