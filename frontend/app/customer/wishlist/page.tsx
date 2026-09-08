"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Heart, ShoppingBag, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function WishlistPage() {
  const { data: wishlistData, error, isLoading, mutate } = useSWR("/wishlists/", fetcher);
  const addItem = useCartStore((s) => s.addItem);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const items: any[] = Array.isArray(wishlistData) ? wishlistData : (wishlistData?.results || []);

  const handleRemove = async (productId: string) => {
    try {
      setRemovingId(productId);
      await api.post("/wishlists/toggle/", { product_id: productId });
      toast.success("Item removed from your wishlist.");
      mutate();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to remove item.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    const variantId = product.variants?.[0]?.id || product.id;
    try {
      await addItem(variantId, 1);
      toast.success(`${product.title || product.name} added to cart!`);
    } catch (err) {
      toast.error("Failed to add product to cart.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">My Wishlist</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {items.length} saved product{items.length === 1 ? "" : "s"} ready for checkout
          </p>
        </div>

        {items.length > 0 && (
          <Link href="/products">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              Browse More
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
          Loading your wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your wishlist is currently empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save items you love by tapping the heart icon on any product page to track price drops and stock levels.
            </p>
          </div>
          <Link href="/products" className="inline-block pt-2">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm">
              <ShoppingBag className="w-3.5 h-3.5" /> Start Exploring Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item.product || item;
            const price = Number(product.base_price || product.price || 0);
            const inStock = product.status === "ACTIVE";
            const imageUrl = product.primary_image || product.images?.[0]?.image_url || "/placeholder-product.png";

            return (
              <div 
                key={item.id || product.id} 
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={product.title || product.name || "Product"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemove(product.id)}
                    disabled={removingId === product.id}
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-rose-600 dark:bg-slate-950/90"
                  >
                    <Trash2 className={`h-4 w-4 ${removingId === product.id ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Remove from wishlist</span>
                  </Button>
                </div>

                <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                      {product.vendor?.store_name || "EthioMart"}
                    </span>
                    <Link href={`/products/${product.slug || product.id}`} className="hover:underline">
                      <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                        {product.title || product.name}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        ETB {price.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${inStock ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {inStock ? 'In Stock' : 'Unavailable'}
                      </Badge>
                    </div>
                    
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                      disabled={!inStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
