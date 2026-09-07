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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setActiveTab("PENDING_REVIEW"); setPage(1); }}
          className={cn(
            "cursor-pointer rounded-2xl border p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
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
            "cursor-pointer rounded-2xl border p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
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
            "cursor-pointer rounded-2xl border p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
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
            "cursor-pointer rounded-2xl border p-5 shadow-xs transition-all bg-white dark:bg-slate-900",
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

      {/* Top Control Bar */}
      <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 border-b border-slate-100 dark:border-slate-800/80 rounded-t-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left: Search Bar */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title, vendor, or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === "Enter" && mutate()}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Right: Inline Dropdowns */}
        <div ref={dropdownRef} className="flex items-center justify-end shrink-0 w-full sm:w-auto relative gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {selectedCategory === "ALL" ? "All Categories" : categories?.find((c: any) => c.slug === selectedCategory)?.name || "Category"}
            </button>

            {categoryOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-[200] w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg py-1 text-xs">
                <button
                  onClick={() => { setSelectedCategory("ALL"); setPage(1); setCategoryOpen(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                    selectedCategory === "ALL" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setPage(1); setCategoryOpen(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                      selectedCategory === cat.slug ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {activeTab === "ALL" ? "All Status" : activeTab === "PENDING_REVIEW" ? "Pending Review" : activeTab === "ACTIVE" ? "Active Listings" : "Rejected"}
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-[200] w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg py-1 text-xs">
                {[
                  { val: "ALL", lbl: "All Status" },
                  { val: "PENDING_REVIEW", lbl: "Pending Review" },
                  { val: "ACTIVE", lbl: "Active Listings" },
                  { val: "REJECTED", lbl: "Rejected" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      setActiveTab(opt.val as any);
                      setPage(1);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                      activeTab === opt.val
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
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-900/80 text-gray-600 dark:text-slate-400 uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Listing</th>
                <th className="px-4 py-3">Merchant / Store</th>
                <th className="px-4 py-3">Seller Trust Tier</th>
                <th className="px-4 py-3 text-right">Price (ETB)</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Loading moderation queue...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No products currently matching this queue.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Tag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{p.title}</div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">{p.category_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                      <div className="font-semibold text-gray-900 dark:text-white">{p.vendor_name}</div>
                      <span className="text-[10px] text-gray-400">Slug: {p.vendor_slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.vendor_tier === "VIP"
                            ? "bg-purple-100 text-purple-800"
                            : p.vendor_tier === "TRUSTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {p.vendor_tier || "PROBATION"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      {p.price_display || "0.00 ETB"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect &amp; Moderate</span>
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
