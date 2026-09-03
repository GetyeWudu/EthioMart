/**
 * frontend/app/admin/customers/page.tsx
 * =====================================
 * Admin Customer Management Hub — Live Buyer Profiles, Spending Metrics,
 * Verification Controls, and Account Status Moderation.
 */

"use client";

import { useCustomers, CustomerStatsCards, CustomerTable } from "@/features/customers";
import { Users, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminCustomersPage() {
  const {
    customers,
    totalCount,
    stats,
    filters,
    setFilterParam,
    resetFilters,
    isLoading,
    refetch,
    toggleStatus,
    verifyEmail,
  } = useCustomers();

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Customer Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global directory of all registered marketplace buyers, lifetime GMV expenditures, and account moderation.
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
            Refresh Directory
          </Button>
        </div>
      </div>

      {/* Analytical KPI Summary Cards */}
      <CustomerStatsCards stats={stats} isLoading={isLoading} />

      {/* Dynamic Filterable Customer Table */}
      <CustomerTable
        customers={customers}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilterParam}
        onResetFilters={resetFilters}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onVerifyEmail={verifyEmail}
      />
    </div>
  );
}
