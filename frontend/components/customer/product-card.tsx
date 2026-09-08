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
    <div className="group relative flex flex-col rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300 dark:hover:border-slate-700 dark:bg-slate-900/60 overflow-hidden">
      {/* Top Badges */}
      <div className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5 z-10 flex flex-col gap-1">
        {isNew && (
          <Badge className="bg-blue-500 text-white border-transparent rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 shadow-sm text-[9px] sm:text-[10px] font-semibold tracking-wide">
            New
          </Badge>
        )}
        {promotionBadge ? (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-transparent rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 shadow-sm text-[9px] sm:text-[10px] font-bold tracking-wide">
            🏷️ {promotionBadge} {discountPercentage ? `(-${discountPercentage}%)` : ''}
          </Badge>
        ) : discountPercentage ? (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-transparent rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 shadow-sm text-[9px] sm:text-[10px] font-bold tracking-wide">
            🔥 {discountPercentage}%
          </Badge>
        ) : null}
      </div>

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleWishlist}
        className={`absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-10 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-900/90 ${
          isWishlisted 
            ? "text-rose-600 dark:text-rose-500 opacity-100" 
            : "text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-500 opacity-100"
        }`}
      >
        <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isWishlisted ? "fill-current" : ""}`} />
        <span className="sr-only">Add to wishlist</span>
      </Button>

      {/* Image Container */}
      <div className="relative h-[110px] sm:h-[190px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/50">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <Image
            src={getImageUrl(image, id)}
            alt={name || "Product image"}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1"
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-2 sm:p-3 bg-white dark:bg-slate-900/60 rounded-b-xl sm:rounded-b-2xl">
        {/* Rating & Vendor Hub Location */}
        <div className="mb-1 flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {(rating || 0).toFixed(1)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              ({reviewsCount || 0})
            </span>
          </div>

          {vendorLocation && (
            <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
              <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
              <span className="truncate">{vendorLocation.split(",")[0]}</span>
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block min-h-[28px] sm:min-h-[36px]">
          <h3 className="line-clamp-2 text-[11px] sm:text-sm font-bold text-slate-900 hover:text-primary dark:text-slate-100 dark:hover:text-primary transition-colors leading-snug">
            {name}
          </h3>
        </Link>

        {/* Pricing & Cash Savings */}
        <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-1 sm:gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
              ETB {(price || 0).toFixed(0)}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {originalPrice && (
                <span className="text-[9px] sm:text-[11px] text-slate-400 line-through dark:text-slate-500 font-semibold">
                  ETB {(originalPrice || 0).toFixed(0)}
                </span>
              )}
              {cashSavings > 0 && (
                <span className="hidden sm:inline text-[9px] sm:text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded">
                  Save {cashSavings.toLocaleString()} ETB
                </span>
              )}
            </div>
          </div>

          {isSuspended ? (
            <div className="h-6 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-[9px] sm:text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-bold tracking-wide shrink-0 cursor-not-allowed">
              <AlertTriangle className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">Suspended</span>
            </div>
          ) : isOutOfStock ? (
            <div className="h-6 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-[9px] sm:text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold tracking-wide shrink-0 cursor-not-allowed">
              <span className="text-[9px]">Out</span>
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              className="h-6 sm:h-7 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 text-[9px] sm:text-[10px] shadow-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition-colors font-bold tracking-wide shrink-0"
            >
              <ShoppingCart className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
