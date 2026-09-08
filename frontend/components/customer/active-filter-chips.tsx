"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, RotateCcw } from "lucide-react";

interface ActiveFilterChipsProps {
  categoryName?: string;
  totalCount?: number;
}

export function ActiveFilterChips({ categoryName, totalCount }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category");
  const deals = searchParams.get("deals") === "true" || searchParams.get("on_sale") === "true";
  const inStock = searchParams.get("in_stock") === "true";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const search = searchParams.get("search");

  const hasActiveFilters = Boolean(
    category || deals || inStock || minPrice || maxPrice || search
  );

  if (!hasActiveFilters) return null;

  const removeFilter = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    // Preserve sort if present
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  let priceLabel = "";
  if (minPrice && maxPrice) {
    priceLabel = `${Number(minPrice).toLocaleString()} – ${Number(maxPrice).toLocaleString()} ETB`;
  } else if (minPrice) {
    priceLabel = `Over ${Number(minPrice).toLocaleString()} ETB`;
  } else if (maxPrice) {
    priceLabel = `Under ${Number(maxPrice).toLocaleString()} ETB`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 mb-4">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        Active Filters:
      </span>

      {/* Search Query Chip */}
      {search && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm">
          Keyword: "{search}"
          <button
            type="button"
            onClick={() => removeFilter(["search"])}
            className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors p-0.5"
            aria-label="Remove search filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Category Chip */}
      {category && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-sm">
          Category: {categoryName || category}
          <button
            type="button"
            onClick={() => removeFilter(["category"])}
            className="hover:text-slate-950 dark:hover:text-white transition-colors p-0.5"
            aria-label="Remove category filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Deals & Discounts Chip */}
      {deals && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 shadow-sm">
          🏷️ On Sale / Deals
          <button
            type="button"
            onClick={() => removeFilter(["deals", "on_sale"])}
            className="hover:text-rose-900 dark:hover:text-rose-100 transition-colors p-0.5"
            aria-label="Remove deals filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* In Stock Only Chip */}
      {inStock && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm">
          ✓ In Stock Only
          <button
            type="button"
            onClick={() => removeFilter(["in_stock"])}
            className="hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors p-0.5"
            aria-label="Remove in stock filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Price Bracket Chip */}
      {priceLabel && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shadow-sm">
          Price: {priceLabel}
          <button
            type="button"
            onClick={() => removeFilter(["min_price", "max_price"])}
            className="hover:text-amber-950 dark:hover:text-amber-100 transition-colors p-0.5"
            aria-label="Remove price filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Clear All Action */}
      <button
        type="button"
        onClick={clearAllFilters}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors underline underline-offset-2 ml-1"
      >
        <RotateCcw className="w-3 h-3" />
        Clear All
      </button>
    </div>
  );
}
