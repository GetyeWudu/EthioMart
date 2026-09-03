"use client";

import React, { useState } from "react";
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

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<"PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "ALL">("PENDING_REVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);

  const { data, error, mutate, isLoading: loading } = useSWR(
    ["admin-products", activeTab, searchQuery, page],
    ([_, status, search, p]) => catalogService.getAdminProducts({
      status: status === "ALL" ? undefined : status,
      search: search,
      page: p,
    }),
    { refreshInterval: 5000 }
  );

  const handleApprove = async (id: string) => {
    await catalogService.approveProduct(id);
    mutate();
  };

  const handleReject = async (id: string, reason: string) => {
    await catalogService.rejectProduct(id, reason);
    mutate();
  };

  const products = data?.results || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">4-Layer Product Moderation Queue</h1>
          <p className="text-xs text-gray-500">
            Review listings flagged by trust-tier rules, counterfeit blacklist scan, and compliance policies
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("PENDING_REVIEW");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PENDING_REVIEW"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ACTIVE");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Listings</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("REJECTED");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "REJECTED"
                ? "bg-red-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALL");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ALL" ? "bg-gray-800 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>All</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by title, vendor, or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === "Enter" && mutate()}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product Listing</th>
                <th className="px-4 py-3">Merchant / Store</th>
                <th className="px-4 py-3">Seller Trust Tier</th>
                <th className="px-4 py-3 text-right">Price (ETB)</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
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
                          <div className="font-semibold text-gray-900 line-clamp-1">{p.title}</div>
                          <div className="text-[11px] text-gray-500">{p.category_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-semibold text-gray-900">{p.vendor_name}</div>
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
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {p.price_display || "0.00 ETB"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[11px]">
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
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
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
                <p className="text-sm text-gray-700">
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
