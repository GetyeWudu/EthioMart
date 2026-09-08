/**
 * frontend/features/vendors/components/admin/vendor-moderation-table.tsx
 * ====================================================================
 * Admin vendor moderation table with search on the left, inline dropdowns
 * on the right, trust tier badges, and quick-navigation to review vendor details.
 * Enterprise production-grade styling.
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  RotateCcw,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KYCStatusBadge, TrustTierBadge } from "../kyc/kyc-status-badge";
import { DeleteVendorIssueDialog } from "./vendor-action-dialogs";
import { vendorService } from "../../services/vendor-service";
import { AdminVendorListItem } from "../../types";
import { cn } from "@/lib/utils";

interface VendorModerationTableProps {
  vendors: AdminVendorListItem[];
  totalCount: number;
  filters: { status?: string; vendor_type?: string; tier?: string; search?: string };
  onFilterChange: (key: string, value: string) => void;
  onResetFilters?: () => void;
  onDeleteSuccess?: () => void;
  isLoading?: boolean;
}

export function VendorModerationTable({
  vendors,
  totalCount,
  filters,
  onFilterChange,
  onResetFilters,
  onDeleteSuccess,
  isLoading = false,
}: VendorModerationTableProps) {
  const router = useRouter();
  const [vendorToDelete, setVendorToDelete] = useState<AdminVendorListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDeleteConfirm = async (reason: string, category?: string) => {
    if (!vendorToDelete) return;
    setIsDeleting(true);
    try {
      await vendorService.suspendVendor(
        vendorToDelete.id,
        `Sanctioned & Terminated [${category}]: ${reason}`
      );
      setVendorToDelete(null);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else if (onResetFilters) {
        onResetFilters();
      }
    } catch (err: any) {
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== "ALL") ||
    (filters.tier && filters.tier !== "ALL") ||
    (filters.vendor_type && filters.vendor_type !== "ALL") ||
    Boolean(filters.search && filters.search.trim() !== "")
  );

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onFilterChange("status", "ALL");
      onFilterChange("tier", "ALL");
      onFilterChange("vendor_type", "ALL");
      onFilterChange("search", "");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs backdrop-blur-md overflow-hidden">
      {/* Enterprise Filter Toolbar: Search on LEFT, Inline Dropdowns on RIGHT */}
      <div className="p-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* LEFT: Search Bar */}
          <div className="relative flex-1 max-w-sm lg:max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="Search store name, merchant email, or TIN..."
              className="pl-9.5 pr-8 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all font-normal shadow-2xs w-full"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* RIGHT: Inline Dropdowns: 2-col on mobile, flex on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            {/* Status Dropdown */}
            <div className="w-full sm:w-auto">
              <Select
                value={filters.status || "ALL"}
                onValueChange={(val) => onFilterChange("status", val || "ALL")}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 px-3.5 w-full sm:min-w-[130px] transition-all">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl text-xs z-[300] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending KYC</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trust Tier Dropdown */}
            <div className="w-full sm:w-auto">
              <Select
                value={filters.tier || "ALL"}
                onValueChange={(val) => onFilterChange("tier", val || "ALL")}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 px-3.5 w-full sm:min-w-[125px] transition-all">
                  <SelectValue placeholder="Trust Tier" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl text-xs z-[300] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl">
                  <SelectItem value="ALL">All Trust Tiers</SelectItem>
                  <SelectItem value="VIP">VIP Merchant</SelectItem>
                  <SelectItem value="TRUSTED">Trusted Merchant</SelectItem>
                  <SelectItem value="PROBATION">Probation Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Merchant Type Dropdown */}
            <div className="w-full sm:w-auto col-span-2 sm:col-span-1">
              <Select
                value={filters.vendor_type || "ALL"}
                onValueChange={(val) => onFilterChange("vendor_type", val || "ALL")}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 px-3.5 w-full sm:min-w-[120px] transition-all">
                  <SelectValue placeholder="Merchant Type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl text-xs z-[300] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PLATFORM">Direct Platform</SelectItem>
                  <SelectItem value="THIRD_PARTY">3rd-Party</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters action */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-10 px-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl gap-1.5 transition-colors col-span-2 sm:col-span-1 shadow-2xs font-semibold"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content: Essential columns on mobile, full columns on desktop */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold whitespace-nowrap">
            <tr>
              <th className="px-4 sm:px-5 py-3.5 min-w-[180px] sm:min-w-[220px]">Store Name &amp; Merchant</th>
              <th className="px-3 sm:px-4 py-3.5">Status</th>
              <th className="hidden sm:table-cell px-4 py-3.5">Trust Tier</th>
              <th className="hidden md:table-cell px-4 py-3.5">Type</th>
              <th className="hidden lg:table-cell px-4 py-3.5">Commission</th>
              <th className="hidden md:table-cell px-4 py-3.5">Registered</th>
              <th className="px-3 sm:px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Loading moderation queue...</span>
                  </div>
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      No merchants found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                      No stores matched your active filters or search query.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReset}
                        className="text-xs rounded-xl h-8 gap-1.5 border-slate-200 dark:border-slate-800"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset All Filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="group hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                >
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                    <Link
                      href={`/admin/vendors/${vendor.id}`}
                      className="flex items-center gap-2.5 sm:gap-3 group/store cursor-pointer min-w-0"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 text-indigo-600 dark:from-indigo-950/60 dark:to-indigo-900/30 dark:text-indigo-400 shrink-0 font-bold border border-indigo-100/80 dark:border-indigo-900/50 shadow-2xs group-hover/store:border-indigo-400 group-hover/store:scale-105 transition-all">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate text-xs sm:text-sm group-hover/store:text-indigo-600 dark:group-hover/store:text-indigo-400 transition-colors" title={vendor.store_name}>
                          {vendor.store_name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5 font-mono" title={vendor.seller_email}>
                          {vendor.seller_email}
                        </span>
                        {/* Mobile-only inline pills */}
                        <div className="sm:hidden flex items-center gap-1.5 mt-1">
                          <TrustTierBadge tier={vendor.tier} />
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                            {vendor.commission_rate}% cut
                          </span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="px-3 sm:px-4 py-3.5 sm:py-4 whitespace-nowrap">
                    <KYCStatusBadge status={vendor.status} />
                  </td>

                  <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                    <TrustTierBadge tier={vendor.tier} />
                  </td>

                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border truncate",
                        vendor.vendor_type === "PLATFORM"
                          ? "bg-indigo-50/70 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40"
                          : "bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800"
                      )}
                    >
                      {vendor.vendor_type === "PLATFORM" ? "Direct Platform" : "3rd-Party"}
                    </span>
                  </td>

                  <td className="hidden lg:table-cell px-4 py-4 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {vendor.commission_rate}%
                  </td>

                  <td className="hidden md:table-cell px-4 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-3 sm:px-4 py-3.5 sm:py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVendorToDelete(vendor);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded-lg transition-colors"
                        title={`Issue sanction & delete ${vendor.store_name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enterprise Table Footer Summary */}
      <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{vendors.length}</span> of{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> merchants
        </span>
        {hasActiveFilters && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Filtered results active
          </span>
        )}
      </div>

      {/* Issue Card Confirmation Dialog for Deletion/Sanction */}
      {vendorToDelete && (
        <DeleteVendorIssueDialog
          isOpen={Boolean(vendorToDelete)}
          onClose={() => setVendorToDelete(null)}
          onConfirm={handleDeleteConfirm}
          storeName={vendorToDelete.store_name}
          sellerEmail={vendorToDelete.seller_email}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
