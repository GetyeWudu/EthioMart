/**
 * frontend/features/vendors/components/admin/vendor-moderation-table.tsx
 * ====================================================================
 * Admin vendor moderation table with search, status pills, trust tiers,
 * and quick-navigation to review vendor details.
 */

"use client";

import Link from "next/link";
import {
  Store,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KYCStatusBadge, TrustTierBadge } from "../kyc/kyc-status-badge";
import { AdminVendorListItem, VendorStatus } from "../../types";

interface VendorModerationTableProps {
  vendors: AdminVendorListItem[];
  totalCount: number;
  filters: { status?: string; vendor_type?: string; tier?: string; search?: string };
  onFilterChange: (key: string, value: string) => void;
  isLoading?: boolean;
}

const STATUS_PILLS = [
  { value: "ALL", label: "All Stores" },
  { value: "PENDING_REVIEW", label: "Pending KYC", badgeClass: "bg-amber-500 text-white" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DRAFT", label: "Draft" },
];

export function VendorModerationTable({
  vendors,
  totalCount,
  filters,
  onFilterChange,
  isLoading = false,
}: VendorModerationTableProps) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Vendor Moderation Queue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Review regulatory KYC documents, manage store statuses, and configure commission rates.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="Search store or email..."
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {STATUS_PILLS.map((pill) => {
            const isActive = (filters.status || "ALL") === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => onFilterChange("status", pill.value)}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">Store Name & Merchant</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Trust Tier</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Commission</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                  Loading vendors...
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                  No vendors found matching the selected filters.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shrink-0 font-bold">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {vendor.store_name}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {vendor.seller_email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <KYCStatusBadge status={vendor.status} />
                  </td>

                  <td className="px-6 py-4">
                    <TrustTierBadge tier={vendor.tier} />
                  </td>

                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {vendor.vendor_type === "PLATFORM" ? "Direct Platform" : "3rd-Party"}
                  </td>

                  <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {vendor.commission_rate}%
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/vendors/${vendor.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
