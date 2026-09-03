"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CategoryNode, Brand } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { getDepartmentTheme } from "@/lib/category-themes";
import { BrandBadge } from "@/components/ui/brand-badge";
import { MobileCategoryBrowser } from "@/components/customer/mobile-category-browser";
import {
  Layers,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([catalogService.getCategoryTree(), catalogService.getBrands()])
      .then(([cats, bnds]) => {
        setCategories(cats);
        setBrands(bnds);
      })
      .catch((err) => console.error("Failed to load catalog data", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.children?.some((sub) => sub.name.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <div className="animate-pulse space-y-8">
          <div className="h-44 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* ── Mobile Viewport: Split-Rail Dual-Pane Browser (< lg) ── */}
      <div className="lg:hidden pt-16">
        <MobileCategoryBrowser categories={categories} brands={brands} />
      </div>

      {/* ── Desktop Viewport: Modern Showcase Directory (>= lg) ── */}
      <div className="hidden lg:block py-10 pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Glassmorphic Search & Header Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-10 isolate">
            {/* Subtle mesh background glows */}
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-bold tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Direct Merchant Directory
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight">
                Explore Marketplace Departments
              </h1>
              <p className="text-slate-300 text-sm">
                Discover verified products, certified Ethiopian brands, and direct merchant stores.
              </p>

              <div className="pt-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search departments, subcategories, or brands..."
                  className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs font-medium border border-slate-200/60 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Department Cards Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  All Departments ({filteredCategories.length})
                </h2>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((root) => {
                const theme = getDepartmentTheme(root.slug || root.name);
                const Icon = theme.icon;

                return (
                  <div
                    key={root.id}
                    className={`group relative bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all duration-300 ${theme.borderHover} hover:shadow-xl flex flex-col justify-between overflow-hidden`}
                  >
                    {/* Ambient subtle top-right accent */}
                    <div
                      className={`absolute -top-12 -right-12 w-36 h-36 rounded-full ${theme.accentBg} blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50`}
                    />

                    <div>
                      {/* Department Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl ${theme.badgeBg} ${theme.iconColor} flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {theme.badgeText}
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {root.name}
                            </h3>
                          </div>
                        </div>

                        {root.product_count !== undefined && root.product_count > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                            {root.product_count}
                          </span>
                        )}
                      </div>

                      {/* Subcategories List */}
                      <div className="space-y-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        {root.children && root.children.length > 0 ? (
                          root.children.slice(0, 5).map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/products?category=${sub.slug}`}
                              className="group/item flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <span>{sub.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all" />
                            </Link>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic block py-2">
                            Direct product catalog
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <Link
                        href={`/products?category=${root.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline"
                      >
                        Explore All {root.name}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {root.children?.length || 0} categories
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    No departments found matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Reset Department Search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Verified Brand Pavilion */}
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                    Verified Brand Pavilion
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official marketplace partners, national brands, and verified merchants.
                  </p>
                </div>
              </div>
              <Link
                href="/stores"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Browse All Stores <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {brands.slice(0, 12).map((b) => (
                <BrandBadge
                  key={b.id}
                  name={b.name}
                  slug={b.slug}
                  logo={b.logo}
                  productCount={b.product_count}
                  size="md"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
