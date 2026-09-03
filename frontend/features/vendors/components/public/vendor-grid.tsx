/**
 * frontend/features/vendors/components/public/vendor-grid.tsx
 * ==========================================================
 * Responsive grid showcasing approved stores on the marketplace.
 */

"use client";

import { Store, Search } from "lucide-react";
import { VendorCard } from "./vendor-card";
import { PublicStore } from "../../types";

interface VendorGridProps {
  stores: PublicStore[];
  isLoading?: boolean;
}

export function VendorGrid({ stores, isLoading = false }: VendorGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <Store className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          No stores found
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          No approved merchant stores match your search query. Try searching for another brand or location.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {stores.map((store) => (
        <VendorCard key={store.slug} store={store} />
      ))}
    </div>
  );
}
