"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ProductListItem, ProductStatus } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { useVendorProfile } from "@/features/vendors/hooks/use-vendor-profile";
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, XCircle, Tag, Eye, Send, Edit, Trash2, ShieldAlert, ArrowRight } from "lucide-react";

export default function SellerProductsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { profile, isLoading: profileLoading } = useVendorProfile();
  const isApproved = profile?.status === "APPROVED";

  const { data: products = [], error, mutate, isLoading: loading } = useSWR(
    ["seller-products", statusFilter, searchQuery],
    ([_, status, search]) => catalogService.getSellerProducts({
      status: status === "ALL" || status === "ARCHIVED" ? undefined : status,
      archived: status === "ARCHIVED" ? "true" : undefined,
      search: search,
    }),
    { refreshInterval: 5000 }
  );

  const handleSubmitForReview = async (id: string) => {
    if (!isApproved) {
      alert("Your store KYC must be verified and approved by admin before submitting products.");
      return;
    }
    setActionLoading(id);
    try {
      await catalogService.submitProductForReview(id);
      mutate();
    } catch (err: any) {
      const apiErrors = err.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        alert("Validation Failed:\n- " + apiErrors.join("\n- "));
      } else {
        alert(err.message || "Failed to submit product for review.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrArchive = async (id: string, canBeHardDeleted: boolean) => {
    const msg = canBeHardDeleted 
      ? "Are you sure you want to permanently delete this product draft? This cannot be undone."
      : "Are you sure you want to archive this product? This will hide it from the storefront but preserve historical order records.";
    if (!confirm(msg)) return;
    
    setActionLoading(id);
    try {
      await catalogService.deleteProduct(id);
      mutate();
    } catch (err: any) {
      alert(err.message || "Failed to process product deletion.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active & Published</span>
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full w-max">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KYC Warning Banner if Not Approved */}
      {!profileLoading && profile && !isApproved && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {profile.status === "SUSPENDED" ? "Store Suspended" : "KYC Document Verification Required"}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                {profile.status === "SUSPENDED"
                  ? "Your store is currently suspended. Product additions and catalog edits are disabled."
                  : "You cannot list products until your KYC documents (Business License / TIN) are submitted and approved by GechExpress administrators."}
              </p>
            </div>
          </div>
          {profile.status !== "SUSPENDED" && (
            <Link
              href="/seller/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
            >
              <span>Complete KYC</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Product Catalog</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage your store&apos;s product listings, SKU variants, and submission compliance
          </p>
        </div>
        {isApproved ? (
          <Link
            href="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="KYC verification and admin approval required to add products"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product (Locked)</span>
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && mutate()}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active & Public</option>
            <option value="PENDING_REVIEW">Pending Compliance</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived (Soft Deleted)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Total Stock</th>
                <th className="px-4 py-3">Compliance Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No products found. Click &quot;Add New Product&quot; to publish your first listing.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
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
                          <div className="text-[11px] text-gray-500">{p.product_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {p.price_display || "0.00 ETB"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{p.total_available_stock} Units</td>
                    <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/seller/products/${p.id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Edit Listing"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        
                        {p.status === "ACTIVE" && (
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                            title="View Public Storefront PDP"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}

                        {p.status === "DRAFT" || p.status === "REJECTED" ? (
                          <button
                            type="button"
                            disabled={actionLoading === p.id}
                            onClick={() => handleSubmitForReview(p.id)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                            title="Submit Review"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={actionLoading === p.id}
                          onClick={() => handleDeleteOrArchive(p.id, p.can_be_hard_deleted || false)}
                          className={`p-1.5 rounded-md transition-colors ${
                            p.can_be_hard_deleted
                              ? "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                          }`}
                          title={p.can_be_hard_deleted ? "Permanently delete draft" : "Archive / Remove from Store"}
                        >
                          {p.can_be_hard_deleted ? <Trash2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
