"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  X,
  Check,
  Filter,
  Flame,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface FilterCategory {
  id: string;
  label: string;
  count?: number;
}

interface ProductFiltersProps {
  categories?: FilterCategory[];
  basePath?: string;
  totalProducts?: number;
}

const PRICE_BRACKETS = [
  { label: "Under 1,000 ETB", min: undefined, max: 1000 },
  { label: "1,000 – 5,000 ETB", min: 1000, max: 5000 },
  { label: "5,000 – 15,000 ETB", min: 5000, max: 15000 },
  { label: "Above 15,000 ETB", min: 15000, max: undefined },
];

export function ProductFilters({
  categories = [],
  basePath = "/products",
  totalProducts,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const currentDeals = searchParams.get("deals") === "true" || searchParams.get("on_sale") === "true";
  const currentInStock = searchParams.get("in_stock") === "true";
  const currentMinPrice = searchParams.get("min_price");
  const currentMaxPrice = searchParams.get("max_price");

  const [minInput, setMinInput] = useState(currentMinPrice || "");
  const [maxInput, setMaxInput] = useState(currentMaxPrice || "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setMinInput(currentMinPrice || "");
    setMaxInput(currentMaxPrice || "");
  }, [currentMinPrice, currentMaxPrice]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setPriceBracket = (min?: number, max?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min !== undefined) {
      params.set("min_price", String(min));
    } else {
      params.delete("min_price");
    }
    if (max !== undefined) {
      params.set("max_price", String(max));
    } else {
      params.delete("max_price");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minInput && !isNaN(Number(minInput))) {
      params.set("min_price", minInput.trim());
    } else {
      params.delete("min_price");
    }
    if (maxInput && !isNaN(Number(maxInput))) {
      params.set("max_price", maxInput.trim());
    } else {
      params.delete("max_price");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  };

  const activeCount = [
    currentCategory,
    currentDeals,
    currentInStock,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;

  const FilterControls = () => (
    <div className="space-y-6">
      {/* ── Deals & Inventory Toggles ── */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Deals &amp; Availability
        </h4>
        <div className="flex flex-col gap-2">
          {/* On Sale */}
          <button
            type="button"
            onClick={() => updateParam("deals", currentDeals ? null : "true")}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
              currentDeals
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              On Sale / Promotions Only
            </span>
            <div
              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                currentDeals ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {currentDeals && <Check className="w-3 h-3" />}
            </div>
          </button>

          {/* In Stock */}
          <button
            type="button"
            onClick={() => updateParam("in_stock", currentInStock ? null : "true")}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
              currentInStock
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              In Stock Only
            </span>
            <div
              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                currentInStock ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {currentInStock && <Check className="w-3 h-3" />}
            </div>
          </button>
        </div>
      </div>

      {/* ── Price Range (ETB) ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Price Range (ETB)
        </h4>

        {/* Quick Brackets */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_BRACKETS.map((b) => {
            const isSelected =
              String(b.min ?? "") === (currentMinPrice || "") &&
              String(b.max ?? "") === (currentMaxPrice || "");
            return (
              <button
                key={b.label}
                type="button"
                onClick={() =>
                  isSelected ? setPriceBracket(undefined, undefined) : setPriceBracket(b.min, b.max)
                }
                className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min/Max Inputs */}
        <form onSubmit={handleApplyCustomPrice} className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ETB</span>
              <input
                type="number"
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                className="w-full h-8 pl-9 pr-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-slate-400 text-xs">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ETB</span>
              <input
                type="number"
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className="w-full h-8 pl-9 pr-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs font-semibold rounded-lg"
          >
            Apply Price Filter
          </Button>
        </form>
      </div>

      {/* ── Departments / Categories ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Departments
          </h4>
          {currentCategory && (
            <button
              type="button"
              onClick={() => updateParam("category", null)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              All
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => updateParam("category", null)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              !currentCategory
                ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>All Departments</span>
            {!currentCategory && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          {categories.map((category) => {
            const isActive = currentCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => updateParam("category", category.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="truncate">{category.label}</span>
                {isActive ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : category.count !== undefined && category.count > 0 ? (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                    {category.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Sticky Trigger Pill (Screens < lg) ── */}
      <div className="lg:hidden mb-4">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger className="w-full h-11 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-xs flex items-center justify-between px-4 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filters &amp; Price Range</span>
            </div>
            {activeCount > 0 && (
              <span className="h-5 px-2 rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center">
                {activeCount} Active
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl p-6 overflow-y-auto">
            <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-black">
                  Filters &amp; Refinements
                </SheetTitle>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-rose-500 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="py-4">
              <FilterControls />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
              <Button
                onClick={() => setIsMobileOpen(false)}
                className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-white shadow-lg"
              >
                Apply Filters {totalProducts !== undefined ? `(${totalProducts} Found)` : ""}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop Sidebar Container (Screens >= lg) ── */}
      <div className="hidden lg:flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm sticky top-24">
        {/* Header & Reset */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Filters
          </h3>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset ({activeCount})
            </button>
          )}
        </div>

        <FilterControls />
      </div>
    </>
  );
}
