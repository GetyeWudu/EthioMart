"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartItem } from "./cart-item";
import { useCartStore } from "@/stores/cart-store";

const MOCK_CART_ITEMS = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 299.99,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop",
    slug: "premium-wireless-headphones"
  }
];

export function MiniCart() {
  const { items, getTotalItems, getTotalPrice, removeItem, updateQuantity } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <Sheet>
      <SheetTrigger className="relative flex items-center justify-center h-10 px-4 gap-2 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium shrink-0 backdrop-blur-sm">
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Cart</span>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
          {totalItems}
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <ShoppingBag className="h-5 w-5 text-indigo-500" />
            Your Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="scale-95 origin-top">
                      <CartItem 
                        key={item.id} 
                        item={item}
                        onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                        onRemove={() => removeItem(item.id)}
                      />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <ShoppingBag className="h-16 w-16 opacity-20" />
              <p>Your cart is empty.</p>
              <Link href="/products" className={buttonVariants({ variant: "outline" })}>
                Start Shopping
              </Link>
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10">
            <div className="flex justify-between items-center mb-4 text-slate-900 dark:text-white font-semibold">
              <span>Subtotal</span>
              <span>ETB {totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/cart" className={buttonVariants({ variant: "outline", className: "w-full border-slate-200 dark:border-slate-700" })}>
                View Cart
              </Link>
              <Link href="/checkout" className={buttonVariants({ className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white" })}>
                Checkout
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
