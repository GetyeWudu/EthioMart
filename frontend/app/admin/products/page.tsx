"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { ProductListItem, ProductStatus } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { ModerationInspector } from "@/components/catalog/moderation-inspector";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Store,
  Tag,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<"PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: categories } = useSWR("admin-categories", () => catalogService.getCategoryTree());

  const { data, error, mutate, isLoading: loading } = useSWR(
    ["admin-products", activeTab, searchQuery, page, selectedCategory],
    ([_, status, search, p, cat]) => catalogService.getAdminProducts({
      status: status === "ALL" ? undefined : status,
      search: search,
      page: p,
      category: cat === "ALL" ? undefined : cat,
    }),
    { refreshInterval: 5000 }
  );

  const { data: pendingData, mutate: mutatePending } = useSWR(
    "admin-products-count-pending",
    () => catalogService.getAdminProducts({ status: "PENDING_REVIEW", page: 1 })
  );
  const { data: activeData, mutate: mutateActive } = useSWR(
    "admin-products-count-active",
    () => catalogService.getAdminProducts({ status: "ACTIVE", page: 1 })
  );
  const { data: rejectedData, mutate: mutateRejected } = useSWR(
    "admin-products-count-rejected",
    () => catalogService.getAdminProducts({ status: "REJECTED", page: 1 })
  );

  const handleApprove = async (id: string) => {
    await catalogService.approveProduct(id);
    mutate();
    mutatePending();
    mutateActive();
    mutateRejected();
  };

  const handleReject = async (id: string, reason: string) => {
    await catalogService.rejectProduct(id, reason);
    mutate();
    mutatePending();
    mutateActive();
    mutateRejected();
  };

  const products = data?.results || [];
  const pagination = data?.pagination;

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a: any, b: any) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });
  }, [products]);

  const pendingCount = pendingData?.pagination?.count ?? (activeTab === "PENDING_REVIEW" ? pagination?.count ?? 0 : 0);
  const activeCount = activeData?.pagination?.count ?? (activeTab === "ACTIVE" ? pagination?.count ?? 0 : 0);
  const rejectedCount = rejectedData?.pagination?.count ?? (activeTab === "REJECTED" ? pagination?.count ?? 0 : 0);
  const totalCount = pendingCount + activeCount + rejectedCount || (pagination?.count ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-slate-900 dark:text-white">
            4-Layer Product Moderation Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review listings flagged by trust-tier rules, counterfeit blacklist scan, and compliance policies
          </p>
        </div>
      </div>

      {/* Moderation KPI Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => { setActiveTab("PENDING_REVIEW"); setPage(1); }}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            activeTab === "PENDING_REVIEW" ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200 dark:border-slate-800 hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {pendingCount}
            </span>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">Needs staff approval</p>
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab("ACTIVE"); setPage(1); }}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            activeTab === "ACTIVE" ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Active</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {activeCount}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Live in storefront</p>
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab("REJECTED"); setPage(1); }}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            activeTab === "REJECTED" ? "border-rose-400 ring-2 ring-rose-400/20" : "border-slate-200 dark:border-slate-800 hover:border-rose-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Flagged / Rejected</span>
            <div className="p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/50">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {rejectedCount}
            </span>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Policy violations</p>
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab("ALL"); setPage(1); }}
          className={cn(
            "cursor-pointer rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
            activeTab === "ALL" ? "border-indigo-400 ring-2 ring-indigo-400/20" : "border-slate-200 dark:border-slate-800 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Audited Listings</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Multi-tier catalog</p>
          </div>
        </div>
      </div>

      {/* Top Control Bar: Search & Inline Box Dropdowns */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-sm sm:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by title, vendor, or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === "Enter" && mutate()}
            className="w-full pl-9.5 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1261C9]/20 focus:border-[#1261C9] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Attractive Inline Box Dropdowns */}
        <div ref={dropdownRef} className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto relative">
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs min-w-[130px]"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{selectedCategory === "ALL" ? "Categories" : categories?.find((c: any) => c.slug === selectedCategory)?.name || "Category"}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {categoryOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-[300] w-56 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xl py-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory("ALL"); setPage(1); setCategoryOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                    selectedCategory === "ALL" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategory(cat.slug); setPage(1); setCategoryOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                      selectedCategory === cat.slug ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs min-w-[130px]"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{activeTab === "ALL" ? "All Status" : activeTab === "PENDING_REVIEW" ? "Pending" : activeTab === "ACTIVE" ? "Active" : "Rejected"}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-[300] w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xl py-1.5 text-xs">
                {[
                  { val: "ALL", lbl: "All Status" },
                  { val: "PENDING_REVIEW", lbl: "Pending Review" },
                  { val: "ACTIVE", lbl: "Active Listings" },
                  { val: "REJECTED", lbl: "Rejected" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setActiveTab(opt.val as any);
                      setPage(1);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                      activeTab === opt.val
                        ? "text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.lbl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Table: Essential columns on mobile, full columns on desktop */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-3.5 sm:px-4 py-3.5 min-w-[200px] sm:min-w-[240px]">Product Listing</th>
                <th className="hidden md:table-cell px-4 py-3.5 min-w-[150px]">Merchant / Store</th>
                <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-center sm:text-left">Status</th>
                <th className="hidden sm:table-cell px-4 py-3.5 text-right whitespace-nowrap">Price (ETB)</th>
                <th className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap">Submission Date</th>
                <th className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Loading moderation queue...</td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No products currently matching this queue.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3.5 sm:px-4 py-3 sm:py-3.5 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {p.primary_image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                              src={p.primary_image} 
                              alt={p.title} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                (e.target as HTMLImageElement).onerror = null;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Tag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-[220px]" title={p.title}>
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-[220px]">
                            {p.category_name}
                          </div>
                          {/* Mobile-only inline details */}
                          <div className="sm:hidden flex items-center gap-1.5 mt-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                            <span>{p.price_display || "0.00 ETB"}</span>
                            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[85px]">· {p.vendor_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[170px]" title={p.vendor_name}>{p.vendor_name}</div>
                      <span className="text-[10px] text-slate-400 truncate block font-mono">Slug: {p.vendor_slug}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap text-center sm:text-left">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                          p.vendor_tier === "VIP"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400"
                            : p.vendor_tier === "TRUSTED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-400"
                        }`}
                      >
                        {p.vendor_tier || "PROBATION"}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                      {p.price_display || "0.00 ETB"}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap font-mono">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50 rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline sm:inline">Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-800 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.previous}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.next}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  Showing <span className="font-medium">{products.length}</span> items on Page <span className="font-medium">{pagination.current_page}</span> of <span className="font-medium">{pagination.total_pages}</span>
                  {" "} (Total: {pagination.count})
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.previous}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.next}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Inspector Drawer */}
      {selectedProduct && (
        <ModerationInspector
          product={selectedProduct}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
