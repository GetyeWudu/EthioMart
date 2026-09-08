"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CategoryNode } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { getDepartmentTheme } from "@/lib/category-themes";
import { BrandBadge } from "@/components/ui/brand-badge";
import {
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getImageUrl } from "@/lib/api";

const GLOBAL_FALLBACK_BRANDS = [
  { id: "1", name: "Apple", slug: "apple", logo: null },
  { id: "2", name: "Adidas", slug: "adidas", logo: null },
  { id: "3", name: "Nike", slug: "nike", logo: null },
  { id: "4", name: "Samsung", slug: "samsung", logo: null },
];

export function CategoryMegaMenu({ headerSolid = true }: { headerSolid?: boolean }) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [activeRoot, setActiveRoot] = useState<CategoryNode | null>(null);
  const [activeBrands, setActiveBrands] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogService
      .getCategoryTree()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveRoot(data[0]);
      })
      .catch((err) => console.error("Failed to load category tree", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeRoot) {
      catalogService
        .getCategoryBrands(activeRoot.id)
        .then((brands) => {
          if (brands && brands.length > 0) {
            setActiveBrands(brands.slice(0, 4));
          } else {
            setActiveBrands(GLOBAL_FALLBACK_BRANDS);
          }
        })
        .catch(() => setActiveBrands(GLOBAL_FALLBACK_BRANDS));
    }
  }, [activeRoot]);

  const activeTheme = getDepartmentTheme(activeRoot?.slug || activeRoot?.name);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative inline-flex h-9 w-max items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors focus:outline-none duration-300 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent ${
          headerSolid
            ? "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            : "text-slate-200 hover:text-white"
        }`}
        aria-expanded={isOpen}
      >
        <span>Categories</span>
        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && categories.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-[980px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Left Panel (28%): Root Departments */}
          <div className="w-[28%] bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200/80 dark:border-slate-800 py-3 flex flex-col justify-between">
            <div>
              <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Categories
              </div>
              <div className="flex-1 overflow-y-auto max-h-[420px] scrollbar-none space-y-0.5 px-2">
                {categories.slice(0, 8).map((cat) => {
                  const theme = getDepartmentTheme(cat.slug || cat.name);
                  const Icon = theme.icon;
                  const isSelected = activeRoot?.id === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveRoot(cat)}
                      onClick={() => setActiveRoot(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold text-left transition-all ${
                        isSelected
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? `${theme.badgeBg} ${theme.iconColor} shadow-xs`
                              : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          <img src={getImageUrl(cat.image, cat.id)} alt={cat.name} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {isSelected && (
                        <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 mx-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-2xl">
              <Link
                href="/categories"
                className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Full Directory
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Center Panel (44%): Subcategories Deep Grid */}
          <div className="w-[44%] p-6 overflow-y-auto max-h-[500px] bg-white dark:bg-slate-950 scrollbar-none border-r border-slate-200/80 dark:border-slate-800">
            {activeRoot ? (
              <div className="animate-in fade-in duration-200 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Category
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {activeRoot.name}
                    </h3>
                  </div>
                  <Link
                    href={`/products?category=${activeRoot.slug}`}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                  {activeRoot.children && activeRoot.children.length > 0 ? (
                    activeRoot.children.map((subcat) => (
                      <div key={subcat.id} className="space-y-2">
                        <Link
                          href={`/products?category=${subcat.slug}`}
                          className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-primary transition-colors flex items-center gap-1 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{subcat.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </Link>
                        <div className="flex flex-wrap gap-1.5">
                          {subcat.children && subcat.children.length > 0 ? (
                            subcat.children.map((leaf) => (
                              <Link
                                key={leaf.id}
                                href={`/products?category=${leaf.slug}`}
                                className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900 hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full transition-colors"
                              >
                                {leaf.name}
                              </Link>
                            ))
                          ) : (
                            <Link
                              href={`/products?category=${subcat.slug}`}
                              className="text-[11px] text-slate-400 hover:text-slate-600"
                            >
                              Explore items →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-slate-400 text-xs py-8 text-center">
                      Direct catalog products. Click above to view all items.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                Select a category
              </div>
            )}
          </div>

          {/* Right Panel (28%): Editorial Spotlight & Brands */}
          <div className="w-[28%] bg-slate-50/50 dark:bg-slate-900/40 p-5 flex flex-col justify-between gap-5">
            {/* Spotlight Banner Card */}
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${activeTheme.accentGradient} border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white relative overflow-hidden shadow-xs`}
            >
              <span className="inline-block px-2 py-0.5 bg-primary text-white text-[9px] font-extrabold uppercase tracking-wider rounded mb-2">
                Curated
              </span>
              <h4 className="text-sm font-extrabold mb-1">
                Verified Seller Guarantee
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                Direct merchant fulfillment with full EthioMart escrow payment protection.
              </p>
              <Link
                href={`/products?category=${activeRoot?.slug || ""}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                Shop {activeRoot?.name || "Catalog"} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Top Brands in Category */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Featured Brands
                </h4>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeBrands.map((brand) => (
                  <BrandBadge
                    key={brand.id}
                    name={brand.name}
                    slug={brand.slug}
                    logo={brand.logo}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
