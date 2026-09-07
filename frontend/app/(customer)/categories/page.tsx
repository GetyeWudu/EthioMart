"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CategoryNode, Brand } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { BrandBadge } from "@/components/ui/brand-badge";
import { MobileCategoryBrowser } from "@/components/customer/mobile-category-browser";
import { CategoryCard } from "@/components/customer/category-card";
import { getImageUrl } from "@/lib/api";
import {
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([catalogService.getCategoryTree(), catalogService.getBrands()])
      .then(async ([cats, bnds]) => {
        // Fetch products for each root category to get their images
        const categoryProductsPromises = cats.map((c) =>
          catalogService.getPublicProducts({ category: c.slug, page: 1 }).catch(() => ({ results: [] }))
        );
        const categoryProductsRes = await Promise.all(categoryProductsPromises);

        const mappedCats = cats.map((c, idx) => {
          const prods: any = categoryProductsRes[idx];
          const prodsArray = Array.isArray(prods) ? prods : prods?.results || [];

          const productImages = prodsArray
            .filter((p: any) => p.primary_image)
            .map((p: any) => getImageUrl(p.primary_image, p.id))
            .slice(0, 4);

          const images =
            productImages.length > 0
              ? productImages
              : c.image
              ? [getImageUrl(c.image, c.id)]
              : [getImageUrl(null, c.id + "1"), getImageUrl(null, c.id + "2")];

          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            images,
            itemCount: c.product_count || 0,
            originalChildren: c.children,
          };
        });

        setCategories(mappedCats);
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
        c.originalChildren?.some((sub: any) => sub.name.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <div className="animate-pulse space-y-8">
          <div className="h-14 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
            <div className="h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-950">
      {/* ── Mobile Viewport ── */}
      <div className="lg:hidden pt-16">
        <MobileCategoryBrowser categories={categories as any} brands={brands} />
      </div>

      {/* ── Desktop Viewport ── */}
      <div className="hidden lg:block py-10 pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Simple Search Bar */}
          <div className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories, subcategories..."
                className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium border border-slate-200/60 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  All Categories ({filteredCategories.length})
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

            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  slug={category.slug}
                  images={category.images}
                  itemCount={category.itemCount}
                />
              ))}

              {filteredCategories.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    No categories found matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
