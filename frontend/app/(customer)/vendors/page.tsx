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
    <div className="w-full bg-slate-50/50 dark:bg-slate-950 py-10 pt-24 md:pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Simple Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Verified Merchants
            </div>
            <h1 className="text-3xl font-black font-serif tracking-tight text-slate-900 dark:text-white">
              Stores Directory
            </h1>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores by name or specialty..."
              className="pl-11 pr-4 py-3 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 w-full"
            />
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
