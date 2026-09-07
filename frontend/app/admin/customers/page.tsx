"use client";

import { useCustomers, CustomerStatsCards, CustomerTable } from "@/features/customers";
import { RefreshCw, Loader2 } from "lucide-react";
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
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registered buyer profiles · lifetime GMV · account moderation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs self-start sm:self-auto"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <CustomerStatsCards stats={stats} isLoading={isLoading} />

      {/* Table */}
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
