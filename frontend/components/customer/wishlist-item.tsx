import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPrice } from "./product-price";

interface WishlistItemProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock?: boolean;
  onRemove?: (id: string) => void;
  onAddToCart?: (id: string) => void;
}

export function WishlistItem({ 
  id, 
  name, 
  slug, 
  price, 
  originalPrice, 
  image, 
  inStock = true,
  onRemove,
  onAddToCart
}: WishlistItemProps) {
  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <Link href={`/products/${slug}`} className="relative h-32 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <img 
          src={image} 
          alt={name} 
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/products/${slug}`}>
              <h3 className="line-clamp-2 text-base font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition-colors">
                {name}
              </h3>
            </Link>
            <div className="mt-2">
              <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            </div>
          </div>
          
          {onRemove && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onRemove(id)}
              className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove from wishlist</span>
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button 
            onClick={() => onAddToCart && onAddToCart(id)} 
            disabled={!inStock}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
