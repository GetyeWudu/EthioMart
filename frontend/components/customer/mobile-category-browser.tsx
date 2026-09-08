"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { CategoryNode, Brand } from "@/features/products/types";
import { getDepartmentTheme } from "@/lib/category-themes";
import {
  ChevronRight,
  ArrowRight,
  Search,
  ShoppingBag,
  Layers,
} from "lucide-react";

interface MobileCategoryBrowserProps {
  categories: CategoryNode[];
  brands?: Brand[];
}

export function MobileCategoryBrowser({
  categories,
}: MobileCategoryBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const rightPaneRef = useRef<HTMLDivElement>(null);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) || categories[0];
  }, [categories, activeCategoryId]);

  const handleSelectCategory = (catId: string) => {
    setActiveCategoryId(catId);
    // Instant scroll to top of right pane to prevent scroll disorientation
    rightPaneRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  // Filtered categories if search query exists (matches both root and subcategories)
  const matchingCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: { rootName?: string; name: string; slug: string; isRoot?: boolean }[] = [];
    categories.forEach((root) => {
      if (root.name.toLowerCase().includes(q)) {
        results.push({ name: root.name, slug: root.slug, isRoot: true });
      }
      root.children?.forEach((sub) => {
        if (sub.name.toLowerCase().includes(q)) {
          results.push({ rootName: root.name, name: sub.name, slug: sub.slug });
        }
      });
    });
    return results;
  }, [categories, searchQuery]);

  const activeTheme = getDepartmentTheme(
    activeCategory?.slug || activeCategory?.name
  );
  const ActiveIcon = activeTheme.icon;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-slate-950">
      {/* Top Search Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories & subcategories..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* If searching, display search results view */}
      {matchingCategories ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Search Results ({matchingCategories.length})</span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary hover:underline"
            >
              Clear
            </button>
          </div>
          {matchingCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {matchingCategories.map((item, idx) => (
                <Link
                  key={`${item.slug}-${idx}`}
                  href={`/products?category=${item.slug}`}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex flex-col justify-between hover:border-primary active:scale-[0.98] transition-all"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.isRoot ? "Category" : item.rootName}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-semibold text-primary mt-2 flex items-center gap-1">
                    View Products <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              No categories match "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        /* Dual-Pane Split-Rail Browser */
        <div className="flex flex-1 overflow-hidden">
          {/* Left Thumb Rail (Categories) */}
          <div className="w-24 sm:w-28 bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200/80 dark:border-slate-800 overflow-y-auto shrink-0 scrollbar-none py-1">
            {categories.map((cat) => {
              const theme = getDepartmentTheme(cat.slug || cat.name);
              const Icon = theme.icon;
              const isSelected = activeCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`w-full py-3.5 px-2 flex flex-col items-center justify-center text-center transition-all relative ${
                    isSelected
                      ? "bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/60"
                  }`}
                >
                  {/* Left Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-primary" />
                  )}

                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform ${
                      isSelected
                        ? `${theme.badgeBg} ${theme.iconColor} scale-110 shadow-sm`
                        : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] leading-tight line-clamp-2 max-w-[76px]">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Content Pane (Subcategories & Navigation into Products) */}
          <div
            ref={rightPaneRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none bg-white dark:bg-slate-950"
          >
            {activeCategory && (
              <>
                {/* Category Header Spotlight - Tapping card navigates directly to products */}
                <Link
                  href={`/products?category=${activeCategory.slug}`}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${activeTheme.accentGradient} border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-sm active:scale-[0.98] transition-all group block`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl ${activeTheme.badgeBg} ${activeTheme.iconColor} flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <ActiveIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Category
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {activeCategory.name}
                        </h3>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-900/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:bg-primary group-hover:text-white transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm">
                    <span>Browse All {activeCategory.name} Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                {/* Subcategories Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Categories
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {activeCategory.children?.length || 0} Subcategories
                    </span>
                  </div>

                  {activeCategory.children && activeCategory.children.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeCategory.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/products?category=${sub.slug}`}
                          className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-primary active:scale-[0.97] transition-all flex flex-col justify-between gap-2 shadow-xs group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                              View products <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={`/products?category=${activeCategory.slug}`}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-primary flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>View All Products in {activeCategory.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
