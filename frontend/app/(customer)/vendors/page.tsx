/**
 * frontend/app/(customer)/vendors/page.tsx
 * ========================================
 * Public marketplace store directory page with live search & vendor grid.
 */

"use client";

import { usePublicVendors, VendorGrid } from "@/features/vendors";
import { Store, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PublicVendorsPage() {
  const { stores, totalCount, search, setSearch, isLoading } = usePublicVendors();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-14 shadow-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Verified Ethiopian Merchants
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Discover Verified Local & National Stores
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/80 leading-relaxed">
              Explore authentic handcrafted goods, fashion, electronics, and specialty products directly from certified merchants across Ethiopia.
            </p>

            {/* Search Box */}
            <div className="pt-2">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stores by name, city, or specialty..."
                  className="pl-11 pr-4 py-3 h-12 bg-white text-slate-900 dark:bg-slate-900 dark:text-white border-0 shadow-lg rounded-2xl text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                All Stores ({totalCount})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse official brands and third-party verified sellers.
              </p>
            </div>
          </div>

          <VendorGrid stores={stores} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
