/**
 * frontend/app/admin/vendors/page.tsx
 * ===================================
 * Admin Control Hub — Vendor Management & Moderation Queue.
 */

"use client";

import { useAdminVendors, VendorModerationTable } from "@/features/vendors";
import { RefreshCw, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminVendorsPage() {
  const {
    vendors,
    totalCount,
    filters,
    isLoading,
    refetch,
    setFilterParam,
  } = useAdminVendors();

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Store className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Vendor Management & Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review KYC documents, approve active merchants, configure commission rates, and manage suspensions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Moderation Table */}
      <VendorModerationTable
        vendors={vendors}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilterParam}
        isLoading={isLoading}
      />
    </div>
  );
}
