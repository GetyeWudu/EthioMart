"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ProductListItem, ProductStatus } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { useVendorProfile } from "@/features/vendors/hooks/use-vendor-profile";
import { Plus, Search, Filter, ShieldAlert, ArrowRight, Edit, Eye, Send, Trash2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CubeIcon, 
  CheckCircledIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CrossCircledIcon, 
  FileTextIcon,
  MixerHorizontalIcon
} from "@radix-ui/react-icons";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SellerProductsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("Newest First");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { profile, isLoading: profileLoading } = useVendorProfile();
  const isApproved = profile?.status === "APPROVED";

  const { data: fetchedProducts = [], error, mutate, isLoading: loading } = useSWR(
    ["seller-products", statusFilter, searchQuery, categoryFilter, sortBy],
    ([_, status, search, category, ordering]) => {
      return catalogService.getSellerProducts({
        status: status === "ALL" || status === "ARCHIVED" ? undefined : status,
        archived: status === "ARCHIVED" ? "true" : undefined,
      });
    },
    { refreshInterval: 5000 }
  );

  const { data: leafCategories = [] } = useSWR(
    "seller-categories",
    () => catalogService.getLeafCategories(),
    { revalidateOnFocus: false }
  );

  // Local filtering and sorting (since backend doesn't fully support all filters yet)
  const displayProducts = useMemo(() => {
    let result = [...fetchedProducts];

    // Local Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Local Category Filter
    if (categoryFilter !== "ALL") {
      result = result.filter(p => p.category_name === categoryFilter);
    }

    // Local Sorting using "real" values
    result.sort((a, b) => {
      const priceA = parseFloat(a.price_display?.replace(/[^0-9.-]+/g,"") || "0");
      const priceB = parseFloat(b.price_display?.replace(/[^0-9.-]+/g,"") || "0");
      
      switch (sortBy) {
        case "High to Low":
          return priceB - priceA;
        case "Low to High":
          return priceA - priceB;
        case "A to Z":
          return a.title.localeCompare(b.title);
        case "Z to A":
          return b.title.localeCompare(a.title);
        case "Newest First":
        default:
          return (b.id || "").localeCompare(a.id || "");
      }
    });

    return result;
  }, [fetchedProducts, categoryFilter, sortBy, searchQuery]);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: fetchedProducts.length,
      active: fetchedProducts.filter(p => p.status === "ACTIVE").length,
      pending: fetchedProducts.filter(p => p.status === "PENDING_REVIEW").length,
      rejected: fetchedProducts.filter(p => p.status === "REJECTED").length,
      draft: fetchedProducts.filter(p => p.status === "DRAFT").length,
      lowStock: fetchedProducts.filter(p => p.total_available_stock > 0 && p.total_available_stock < 10).length,
    };
  }, [fetchedProducts]);

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
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max"><CheckCircledIcon className="w-3 h-3" /> Published</span>;
      case "PENDING_REVIEW":
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max"><ClockIcon className="w-3 h-3" /> Pending</span>;
      case "REJECTED":
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max"><CrossCircledIcon className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max"><FileTextIcon className="w-3 h-3" /> Draft</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KYC Warning Banner */}
      {!profileLoading && profile && !isApproved && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {profile.status === "SUSPENDED" ? "Store Suspended" : "KYC Document Verification Required"}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {profile.status === "SUSPENDED"
                  ? "Your store is currently suspended. Product additions and catalog edits are disabled."
                  : "You cannot list products until your KYC documents are submitted and approved."}
              </p>
            </div>
          </div>
          {profile.status !== "SUSPENDED" && (
            <Link href="/seller/onboarding" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors">
              <span>Complete KYC</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 dark:text-white">Product Catalog</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your store&apos;s product listings, SKU variants, and inventory.
          </p>
        </div>
        {isApproved ? (
          <Link href="/seller/products/new" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        ) : (
          <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed">
            <Plus className="w-4 h-4" />
            <span>Add New Product (Locked)</span>
          </button>
        )}
      </div>

      {/* 6 Stat Cards (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Catalog</CardTitle>
            <CubeIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Active</CardTitle>
            <CheckCircledIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending Review</CardTitle>
            <ClockIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Low Stock</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Drafts</CardTitle>
            <FileTextIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-slate-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Rejected</CardTitle>
            <CrossCircledIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && mutate()}
            className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 h-10 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <MixerHorizontalIcon className="w-4 h-4" />
            Filters
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                {leafCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">Active & Published</SelectItem>
                <SelectItem value="PENDING_REVIEW" className="text-xs">Pending Review</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                <SelectItem value="ARCHIVED" className="text-xs">Archived</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold text-xs focus:ring-indigo-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Newest First" className="text-xs">Newest First</SelectItem>
                <SelectItem value="High to Low" className="text-xs">High to Low</SelectItem>
                <SelectItem value="Low to High" className="text-xs">Low to High</SelectItem>
                <SelectItem value="A to Z" className="text-xs">A to Z</SelectItem>
                <SelectItem value="Z to A" className="text-xs">Z to A</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid View */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          Loading your catalog...
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center shadow-sm">
          <CubeIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No products found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or add a new product to your catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {displayProducts.map((p) => (
            <div key={p.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              {/* Product Image */}
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                {p.primary_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={p.primary_image} 
                    alt={p.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <CubeIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">No Image</span>
                  </div>
                )}
                
                {/* Status Badge overlay */}
                <div className="absolute top-2 left-2 shadow-sm">
                  {getStatusBadge(p.status)}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <Link
                    href={`/seller/products/${p.id}/edit`}
                    className="p-2 bg-white text-slate-900 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200"
                    title="Edit Listing"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  {p.status === "ACTIVE" && (
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="p-2 bg-white text-slate-900 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200 delay-75"
                      title="View Public Storefront"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                  {(p.status === "DRAFT" || p.status === "REJECTED") && (
                    <button
                      type="button"
                      disabled={actionLoading === p.id}
                      onClick={() => handleSubmitForReview(p.id)}
                      className="p-2 bg-white text-slate-900 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200 delay-75 disabled:opacity-50"
                      title="Submit Review"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionLoading === p.id}
                    onClick={() => handleDeleteOrArchive(p.id, p.can_be_hard_deleted || false)}
                    className="p-2 bg-white text-slate-900 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200 delay-100 disabled:opacity-50"
                    title={p.can_be_hard_deleted ? "Delete Draft" : "Archive"}
                  >
                    {p.can_be_hard_deleted ? <Trash2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-1">
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                  {p.category_name || "Uncategorized"}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 mb-2">
                  {p.title}
                </h3>
                
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500">Price</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {p.price_display || "0.00 ETB"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Stock</div>
                    <div className={`text-sm font-black font-mono ${p.total_available_stock < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {p.total_available_stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
