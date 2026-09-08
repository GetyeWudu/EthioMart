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
  ChevronDown,
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
    link.setAttribute("download", `ethiomart_customers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm relative z-10">
        {/* Top Control Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Left: Search Bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="Search buyer name, email, phone..."
              className="pl-9 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl h-9 shadow-2xs focus:ring-2 focus:ring-indigo-500/20"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange("search", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Dropdowns & Export */}
          <div ref={dropdownRef} className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setStatusOpen(!statusOpen); setSortOpen(false); }}
                className="w-full sm:w-auto h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {STATUS_PILLS.find((p) => p.value === (filters.status || "ALL"))?.label || "Status"}
                  </span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${statusOpen ? "rotate-180" : ""}`} />
              </button>

              {statusOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-[200] w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xl py-1 text-xs">
                  {STATUS_PILLS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onFilterChange("status", opt.value);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center justify-between ${
                        (filters.status || "ALL") === opt.value
                          ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40"
                          : "text-slate-700 dark:text-slate-300 font-medium"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {(filters.status || "ALL") === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setSortOpen(!sortOpen); setStatusOpen(false); }}
                className="w-full sm:w-auto h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Sort By</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${sortOpen ? "rotate-180" : ""}`} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-[200] w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xl py-1 text-xs">
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
                      type="button"
                      onClick={() => {
                        onFilterChange("ordering", opt.val);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center justify-between ${
                        (filters.ordering || "-created_at") === opt.val
                          ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40"
                          : "text-slate-700 dark:text-slate-300 font-medium"
                      }`}
                    >
                      <span>{opt.lbl}</span>
                      {(filters.ordering || "-created_at") === opt.val && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
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
              className="col-span-2 sm:col-span-1 gap-1.5 border-slate-200 dark:border-slate-800 rounded-xl text-xs shrink-0 h-9 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full rounded-b-3xl pb-2">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold whitespace-nowrap">
              <tr>
                <th className="px-5 py-4 font-semibold">Customer Details</th>
                <th className="px-4 py-4 font-semibold hidden lg:table-cell">Joined Date</th>
                <th className="px-4 py-4 font-semibold hidden sm:table-cell">Total Orders</th>
                <th className="px-4 py-4 font-semibold hidden sm:table-cell">Total Spent (ETB)</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-40 bg-slate-100 dark:bg-slate-900 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-950/50 font-bold text-sm shrink-0 uppercase border border-indigo-200/50 dark:border-indigo-800/50 group-hover:scale-105 transition-transform">
                            {customer.first_name?.[0] || customer.email?.[0] || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate" title={customer.full_name || "Anonymous Buyer"}>
                                {customer.full_name || "Anonymous Buyer"}
                              </span>
                              {customer.is_email_verified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono truncate" title={customer.email}>
                              {customer.email}
                            </span>
                            {customer.phone_number && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-mono truncate" title={customer.phone_number}>
                                {customer.phone_number}
                              </span>
                            )}
                            {/* Mobile inline essential info */}
                            <div className="flex items-center gap-2 mt-1 sm:hidden text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              <span>{customer.total_orders} orders</span>
                              <span>•</span>
                              <span className={isPositive ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>{formatETB(customer.total_spent)} ETB</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date (Desktop) */}
                      <td className="px-4 py-4 truncate text-xs text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                        {formatDate(customer.created_at)}
                      </td>

                      {/* Total Orders (Desktop) */}
                      <td className="px-4 py-4 truncate hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {customer.total_orders}
                        </div>
                      </td>

                      {/* Total Spent (ETB) (Desktop) */}
                      <td className="px-4 py-4 truncate font-mono text-xs hidden sm:table-cell">
                        <span className={`font-bold truncate block ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {formatETB(customer.total_spent)} ETB
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
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
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
