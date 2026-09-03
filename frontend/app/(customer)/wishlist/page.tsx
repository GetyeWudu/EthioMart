"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/customer/product-card";
import { Heart, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import useSWR from "swr";
import api from "@/lib/api";
import { ProductListItem } from "@/features/products/types";

interface WishlistItemPayload {
  id: string;
  product: ProductListItem;
  created_at: string;
}

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { savedProductIds, toggleWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: wishlists, isLoading, mutate } = useSWR<WishlistItemPayload[]>(
    mounted ? (isAuthenticated ? "/wishlists/" : savedProductIds.length > 0 ? `/catalog/products/?ids=${savedProductIds.join(',')}` : null) : null,
    async (url: string) => {
      const res: any = await api.get(url);
      const items = res.data?.results || res.data || res || [];
      if (!isAuthenticated) {
        return items.map((p: any) => ({ id: p.id, product: p, created_at: new Date().toISOString() }));
      }
      return items;
    }
  );

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId, isAuthenticated);
    mutate(); // Refresh the wishlist page
  };

  if (!mounted) return null; // Prevent hydration mismatch

  // Guest users see empty state unless they are logged in since guest lists aren't fully resolved with product payloads in this architecture yet
  const hasItems = wishlists && wishlists.length > 0;

  return (
    <div className="container mx-auto px-4 pt-28 pb-8 md:pt-36 md:pb-12 min-h-[70vh]">
      <div className="mb-8 border-b border-slate-200 pb-8 dark:border-slate-800">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl flex items-center gap-3">
          <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
          My Wishlist
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Save items you love and buy them later.
        </p>
      </div>

      {isLoading && (!wishlists || wishlists.length === 0) ? (
        <div className="py-16 text-center text-slate-500">Loading your saved items...</div>
      ) : !hasItems ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-6 text-slate-300">
            <Heart className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            You haven't saved any items yet. When you find something you like, click the heart icon to save it for later.
          </p>
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-lg text-sm max-w-md w-full">
              Sign in to sync your wishlist across devices.
            </div>
          )}
          <Link href="/products" className={buttonVariants()}>
            <Search className="mr-2 h-4 w-4" />
            Discover Products
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {wishlists.length} items saved
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {wishlists.map((item) => {
              const product = item.product;
              return (
                <div key={item.id} className="relative group flex flex-col [&>div]:flex-1 [&>div]:w-full">
                  <ProductCard 
                    id={product.id}
                    name={product.title}
                    slug={product.slug}
                    price={Number(product.min_price || 0)}
                    originalPrice={undefined}
                    rating={Number(product.avg_rating || 0)}
                    reviewsCount={Number(product.review_count || 0)}
                    image={product.primary_image || "/placeholder.svg"}
                    isNew={false}
                    hasVariants={product.product_type === "CONFIGURABLE_VARIANT"}
                  />
                  <Button 
                    onClick={() => handleRemove(product.id)}
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-slate-900 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900/90 dark:text-white dark:hover:bg-rose-950 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
