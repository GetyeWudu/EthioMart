/**
 * frontend/app/admin/vendors/page.tsx
 * ===================================
 * Admin Control Hub — Vendor Management & Moderation Queue.
 */

"use client";

import { useAdminVendors, VendorModerationTable } from "@/features/vendors";
import { RefreshCw, Loader2, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminVendorsPage() {
  const {
    vendors,
    totalCount,
    filters,
    isLoading,
    refetch,
    setFilterParam,
    setFilters,
  } = useAdminVendors();

  const pendingCount = vendors.filter(v => v.status === "PENDING_REVIEW").length;
  const approvedCount = vendors.filter(v => v.status === "APPROVED").length;
  const flaggedCount = vendors.filter(v => v.status === "SUSPENDED" || v.status === "REJECTED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Vendor Management & Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review KYC documents, approve active merchants, configure commission rates, and manage suspensions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-9 gap-1.5 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold px-3.5 bg-white dark:bg-slate-900 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            )}
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setFilterParam("status", "ALL")}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            !filters.status || filters.status === "ALL" ? "border-indigo-400 ring-2 ring-indigo-400/20" : "border-slate-200 dark:border-slate-800 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Merchants</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Registered stores</p>
          </div>
        </div>

        <div 
          onClick={() => setFilterParam("status", "PENDING_REVIEW")}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            filters.status === "PENDING_REVIEW" ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200 dark:border-slate-800 hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending KYC</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {pendingCount}
            </span>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">TIN & Trade licenses pending</p>
          </div>
        </div>

        <div 
          onClick={() => setFilterParam("status", "APPROVED")}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            filters.status === "APPROVED" ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approved Merchants</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {approvedCount}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Active sellers verified</p>
          </div>
        </div>

        <div 
          onClick={() => setFilterParam("status", "SUSPENDED")}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            filters.status === "SUSPENDED" ? "border-rose-400 ring-2 ring-rose-400/20" : "border-slate-200 dark:border-slate-800 hover:border-rose-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suspended / Flagged</span>
            <div className="p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {flaggedCount}
            </span>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Governance sanctions</p>
          </div>
        </div>
      </div>

      {/* Moderation Table */}
      <VendorModerationTable
        vendors={vendors}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilterParam}
        onResetFilters={() => setFilters({ status: "ALL", tier: "ALL", vendor_type: "ALL", search: "" })}
        onDeleteSuccess={() => refetch()}
        isLoading={isLoading}
      />
    </div>
  );
}
