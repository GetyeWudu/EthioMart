/**
 * frontend/features/customers/components/admin/customer-table.tsx
 * ===============================================================
 * Dynamic, Interactive Customer Management Table with Real-time Search,
 * Status Filters, ETB Currency Formatting, and Inspection Drawers.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  Download,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  Lock,
  Unlock,
  Mail,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminCustomerItem, CustomerFilterParams } from "../../types";

interface CustomerTableProps {
  customers: AdminCustomerItem[];
  totalCount: number;
  filters: CustomerFilterParams;
  onFilterChange: (key: keyof CustomerFilterParams, value: string) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
  onToggleStatus: (customerId: string, targetActive?: boolean) => Promise<any>;
  onVerifyEmail: (customerId: string) => Promise<any>;
}

const STATUS_PILLS = [
  { value: "ALL", label: "All Buyers" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Suspended / Inactive" },
  { value: "VERIFIED", label: "Verified Email" },
  { value: "UNVERIFIED", label: "Unverified" },
];

export function CustomerTable({
  customers,
  totalCount,
  filters,
  onFilterChange,
  onResetFilters,
  isLoading = false,
  onToggleStatus,
  onVerifyEmail,
}: CustomerTableProps) {
  const router = useRouter();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatETB = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const handleActionToggle = async (customer: AdminCustomerItem) => {
    try {
      setActionLoadingId(customer.id);
      await onToggleStatus(customer.id, !customer.is_active);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActionVerify = async (customer: AdminCustomerItem) => {
    try {
      setActionLoadingId(customer.id);
      await onVerifyEmail(customer.id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!customers || customers.length === 0) return;
    const headers = ["ID", "Full Name", "Email", "Phone", "Status", "Email Verified", "Total Orders", "Total Spent (ETB)", "Joined Date"];
    const rows = customers.map((c) => [
      c.id,
      `"${c.full_name}"`,
      c.email,
      c.phone_number || "",
      c.is_active ? "Active" : "Suspended",
      c.is_email_verified ? "Yes" : "No",
      c.total_orders,
      c.total_spent,
      c.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gechexpress_customers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm relative z-10">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Left: Search Bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="Search buyer name, email, phone..."
              className="pl-10 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange("search", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Dropdowns & Export */}
          <div ref={dropdownRef} className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setStatusOpen(!statusOpen); setSortOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {STATUS_PILLS.find((p) => p.value === (filters.status || "ALL"))?.label || "Status"}
              </button>

              {statusOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-[200] w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg py-1 text-xs">
                  {STATUS_PILLS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onFilterChange("status", opt.value);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                        (filters.status || "ALL") === opt.value
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setSortOpen(!sortOpen); setStatusOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sort By
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-[200] w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg py-1 text-xs">
                  {[
                    { val: "-created_at", lbl: "Joined: Newest First" },
                    { val: "created_at", lbl: "Joined: Oldest First" },
                    { val: "-total_spent", lbl: "Spend: Highest First" },
                    { val: "total_spent", lbl: "Spend: Lowest First" },
                    { val: "-total_orders", lbl: "Orders: Most First" },
                    { val: "first_name", lbl: "Name: A to Z" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        onFilterChange("ordering", opt.val);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                        (filters.ordering || "-created_at") === opt.val
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={customers.length === 0}
              className="gap-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs shrink-0 py-1.5 h-auto"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-b-3xl pb-2">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer Details</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold">Total Orders</th>
                <th className="px-6 py-4 font-semibold">Total Spent (ETB)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-40 bg-slate-100 dark:bg-slate-900 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                        <User className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        No customers found
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No registered buyer accounts matched your search or status filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="rounded-xl text-xs mt-2 border-slate-200 dark:border-slate-800"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isPositive = parseFloat(customer.total_spent) > 0;
                  const isActionLoading = actionLoadingId === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-950/50 font-bold text-sm shrink-0 uppercase border border-indigo-200/50 dark:border-indigo-800/50 group-hover:scale-105 transition-transform">
                            {customer.first_name?.[0] || customer.email?.[0] || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {customer.full_name || "Anonymous Buyer"}
                              </span>
                              {customer.is_email_verified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                              {customer.email}
                            </span>
                            {customer.phone_number && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-mono">
                                {customer.phone_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(customer.created_at)}
                      </td>

                      {/* Total Orders */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                          {customer.total_orders}
                        </div>
                      </td>

                      {/* Total Spent (ETB) */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {formatETB(customer.total_spent)} ETB
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[11px] font-semibold gap-1">
                            <ShieldAlert className="h-3 w-3" /> Suspended
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={isActionLoading}
                            className="inline-flex items-center justify-center h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-slate-200 dark:border-slate-800">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="gap-2 text-xs font-semibold rounded-xl cursor-pointer py-2"
                            >
                              <User className="h-4 w-4 text-indigo-600" />
                              View Profile & Orders
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleActionToggle(customer)}
                              className={`gap-2 text-xs font-semibold rounded-xl cursor-pointer py-2 ${
                                customer.is_active ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {customer.is_active ? (
                                <>
                                  <Lock className="h-4 w-4 text-rose-500" />
                                  Suspend Buyer Account
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 text-emerald-500" />
                                  Activate Buyer Account
                                </>
                              )}
                            </DropdownMenuItem>

                            {!customer.is_email_verified && (
                              <DropdownMenuItem
                                onClick={() => handleActionVerify(customer)}
                                className="gap-2 text-xs font-semibold rounded-xl cursor-pointer py-2 text-blue-600"
                              >
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                Mark Email Verified
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${customer.email}`)}
                              className="gap-2 text-xs font-medium rounded-xl cursor-pointer py-2 text-slate-600 dark:text-slate-400"
                            >
                              <Mail className="h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>
  );
}
