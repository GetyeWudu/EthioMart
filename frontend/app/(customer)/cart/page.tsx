"use client";

import { useEffect, useState } from "react";
import { CartItem } from "@/components/customer/cart-item";
import { CartSummary } from "@/components/customer/cart-summary";
import { ShoppingCart, ArrowLeft, Home, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, getTotalPrice, updateQuantity, removeItem } = useCartStore();
  const subtotal = getTotalPrice();
  const discount = 0; // Dynamic discount can be added later

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  const hasItems = items.length > 0;

  if (!hasItems) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-16 md:pt-48 md:pb-32 flex flex-col items-center justify-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#1261C9]/10 dark:bg-[#1261C9]/20 mb-6 text-[#1261C9] shadow-inner">
          <ShoppingCart className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm">
          Looks like you haven't added anything to your cart yet. Browse our verified marketplace products and find something you love.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white font-bold text-sm shadow-lg shadow-[#1261C9]/25 transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      <div className="container mx-auto px-4 pt-28 pb-12 sm:pt-32 max-w-[1200px]">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1" style={{ fontFamily: "serif" }}>
              Shopping Cart
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1261C9]/10 dark:bg-[#1261C9]/20 text-[#1261C9] dark:text-blue-300 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-[#1261C9]/20 whitespace-nowrap shadow-xs">
             <ShieldCheck className="w-3.5 h-3.5 text-[#FF7900]" />
             Verified & Secure Escrow Checkout
          </div>
        </div>

        {/* Production-Level Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-8">
          <ol className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-[#1261C9] transition-colors flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </li>
            <li>
              <Link href="/products" className="hover:text-[#1261C9] transition-colors">
                Shop
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </li>
            <li aria-current="page" className="text-slate-900 dark:text-slate-100 font-semibold">
              Shopping Cart
            </li>
          </ol>
          <div className="bg-[#1261C9]/10 text-[#1261C9] dark:bg-[#1261C9]/20 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-[#1261C9]/20 hidden sm:block">
            {items.length} items in cart
          </div>
        </nav>



        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 lg:max-w-[700px]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6" style={{ fontFamily: "serif" }}>Shopping Cart</h2>
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <CartItem 
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="sticky top-24">
              <CartSummary 
                items={items}
                subtotal={subtotal} 
                discount={discount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
