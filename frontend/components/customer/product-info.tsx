"use client";

import { useState } from "react";
import { Star, Minus, Plus, Heart, Share2, ShieldCheck, Truck, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewsCount: number;
    description: string;
    inStock: boolean;
    sku: string;
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-3xl sm:text-4xl leading-tight font-black text-slate-900 dark:text-white tracking-tight">
            {product.name}
          </h1>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full h-10 w-10 text-slate-500 hover:text-primary border-slate-200 shadow-sm transition-colors">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <a href="#reviews" className="text-sm text-slate-500 hover:text-primary transition-colors hover:underline">
              {product.reviewsCount} Reviews
            </a>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU:</span>
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 rounded-md font-mono text-xs px-2 dark:bg-slate-800 dark:text-slate-400">
              {product.sku}
            </Badge>
            {product.inStock ? (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 ml-2 shadow-none font-semibold">
                In Stock
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">Out of Stock</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex flex-col gap-1 mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wide">ETB</span>
          <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {product.price.toFixed(2)}
          </span>
        </div>
        {product.originalPrice && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through font-medium">
              ETB {product.originalPrice.toFixed(2)}
            </span>
            <Badge className="bg-rose-50 text-rose-600 border-rose-200 shadow-none font-bold">
              Save ETB {(product.originalPrice - product.price).toFixed(2)}
            </Badge>
          </div>
        )}
      </div>



      {/* Actions */}
      <div className="space-y-6 pt-6">
        <div className="space-y-3">
          <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Quantity</span>
          <div className="flex h-11 items-center justify-between rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 w-36 shadow-sm">
            <Button variant="ghost" size="icon" onClick={decrement} className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10" disabled={!product.inStock}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold w-8 text-center">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={increment} className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10" disabled={!product.inStock}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-11 text-[13px] font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white shadow-md transition-all rounded-full tracking-wide" disabled={!product.inStock}>
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              Add to Cart
            </Button>
            
            <Button size="lg" className="flex-1 h-11 text-[13px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all rounded-full tracking-wide" disabled={!product.inStock}>
              <Zap className="h-3.5 w-3.5 mr-2 fill-current" />
              Buy Now
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-11 text-[13px] font-bold border-2 border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors rounded-full tracking-wide"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={cn("h-4 w-4 mr-2 transition-all", isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400")} />
            {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
          </Button>
        </div>
      </div>

      {/* Additional Guarantees */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Free Delivery</span>
            <span className="text-xs text-slate-500">2-3 business days</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">1 Year Warranty</span>
            <span className="text-xs text-slate-500">100% genuine product</span>
          </div>
        </div>
      </div>
    </div>
  );
}
