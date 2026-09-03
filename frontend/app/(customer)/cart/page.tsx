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
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-6 text-slate-400">
          <ShoppingCart className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
          Looks like you haven't added anything to your cart yet. Browse our categories and find something you love.
        </p>
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
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
          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap">
             <ShieldCheck className="w-3.5 h-3.5" />
             Verified & Secure Checkout
          </div>
        </div>

        {/* Production-Level Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-8">
          <ol className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </li>
            <li>
              <Link href="/products" className="hover:text-primary transition-colors">
                Shop
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </li>
            <li aria-current="page" className="text-slate-900 dark:text-slate-100 font-medium">
              Shopping Cart
            </li>
          </ol>
          <div className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 px-3 py-1 rounded text-xs font-semibold border border-slate-100 dark:border-slate-800 hidden sm:block">
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
