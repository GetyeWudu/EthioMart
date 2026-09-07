"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star, ArrowRight, AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/api";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  isNew?: boolean;
  discountPercentage?: number;
  promotionBadge?: string;
  defaultVariantId?: string;
  hasVariants?: boolean;
  vendorLocation?: string;
  totalAvailableStock?: number;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  rating,
  reviewsCount,
  image,
  isNew,
  discountPercentage,
  promotionBadge,
  defaultVariantId,
  hasVariants,
  vendorLocation,
  totalAvailableStock = 1,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, hasItem } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isSuspended } = useCurrentUser();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isWishlisted = mounted ? hasItem(id) : false;
  const isOutOfStock = totalAvailableStock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariantId || isOutOfStock) return;
    try {
      await addItem(defaultVariantId, 1);
      toast.success("Added to cart");
    } catch (err: any) {
      let msg = "Failed to add to cart";
      if (err.message && typeof err.message === "string") {
        msg = err.message;
      } else if (err.data?.detail && typeof err.data.detail === "string") {
        msg = err.data.detail;
      }
      toast.error(msg);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id, isAuthenticated);
  };

  const cashSavings = originalPrice && originalPrice > price ? Math.round(originalPrice - price) : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/60 overflow-hidden">
      {/* Top Badges */}
      <div className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-10 flex flex-col gap-1">
        {isNew && (
          <Badge className="bg-blue-500 text-white border-transparent rounded-full px-2 py-0.5 shadow-sm text-[10px] font-semibold tracking-wide">
            New
          </Badge>
        )}
        {promotionBadge ? (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-transparent rounded-full px-2 py-0.5 shadow-sm text-[10px] font-bold tracking-wide">
            🏷️ {promotionBadge} {discountPercentage ? `(-${discountPercentage}%)` : ''}
          </Badge>
        ) : discountPercentage ? (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-transparent rounded-full px-2 py-0.5 shadow-sm text-[10px] font-bold tracking-wide">
            🔥 {discountPercentage}% OFF
          </Badge>
        ) : null}
      </div>

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleWishlist}
        className={`absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-900/90 ${
          isWishlisted 
            ? "text-rose-600 dark:text-rose-500 opacity-100" 
            : "text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-500 opacity-100"
        }`}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        <span className="sr-only">Add to wishlist</span>
      </Button>

      {/* Image Container */}
      <div className="relative h-[150px] sm:h-[190px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/50">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <Image
            src={getImageUrl(image, id)}
            alt={name || "Product image"}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 bg-white dark:bg-slate-900/60 rounded-b-2xl">
        {/* Rating & Vendor Hub Location */}
        <div className="mb-1.5 flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {(rating || 0).toFixed(1)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              ({reviewsCount || 0})
            </span>
          </div>

          {vendorLocation && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
              <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
              <span className="truncate">{vendorLocation.split(",")[0]}</span>
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="flex-1">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900 hover:text-primary dark:text-slate-100 dark:hover:text-primary transition-colors leading-snug">
            {name}
          </h3>
        </Link>

        {/* Pricing & Cash Savings */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              ETB {(price || 0).toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {originalPrice && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 line-through dark:text-slate-500 font-semibold">
                  ETB {(originalPrice || 0).toFixed(2)}
                </span>
              )}
              {cashSavings > 0 && (
                <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded">
                  Save {cashSavings.toLocaleString()} ETB
                </span>
              )}
            </div>
          </div>

          {isSuspended ? (
            <div className="h-7 flex items-center justify-center rounded-xl px-2 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-bold tracking-wide shrink-0 cursor-not-allowed">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Suspended
            </div>
          ) : isOutOfStock ? (
            <div className="h-7 flex items-center justify-center rounded-xl px-2 text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold tracking-wide shrink-0 cursor-not-allowed">
              Out of Stock
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              className="h-7 rounded-xl px-2.5 text-[10px] shadow-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition-colors font-bold tracking-wide shrink-0"
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
