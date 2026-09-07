"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Filter,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    <div className="w-full flex flex-col gap-6">
      {/* ── Categories (Static) ── */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Categories</span>
        </div>
        <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          <button
            type="button"
            onClick={() => updateParam("category", null)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
              !currentCategory
                ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                : "text-slate-600 font-medium hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>All Categories</span>
            {!currentCategory && <div className="w-2 h-2 rounded-full bg-primary" />}
          </button>

          {categories.map((category) => {
            const isActive = currentCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => updateParam("category", category.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                    : "text-slate-600 font-medium hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="truncate group-hover:translate-x-1 transition-transform">{category.label}</span>
                {isActive ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : category.count !== undefined && category.count > 0 ? (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Accordion className="w-full">
        {/* ── Deals & Availability ── */}
        <AccordionItem value="availability" className="border-b border-slate-100 dark:border-slate-800/80">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Availability</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between group">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="deals-toggle" className="text-sm font-semibold flex items-center gap-1.5 cursor-pointer group-hover:text-rose-500 transition-colors">
                  <Flame className="w-4 h-4 text-rose-500" /> On Sale / Promotions
                </Label>
                <span className="text-[11px] text-slate-500">Only show discounted items</span>
              </div>
              <Switch
                id="deals-toggle"
                checked={currentDeals}
                onCheckedChange={(checked) => updateParam("deals", checked ? "true" : null)}
              />
            </div>
            
            <div className="flex items-center justify-between group">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="stock-toggle" className="text-sm font-semibold flex items-center gap-1.5 cursor-pointer group-hover:text-emerald-500 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> In Stock Only
                </Label>
                <span className="text-[11px] text-slate-500">Hide out of stock items</span>
              </div>
              <Switch
                id="stock-toggle"
                checked={currentInStock}
                onCheckedChange={(checked) => updateParam("in_stock", checked ? "true" : null)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Price Range ── */}
        <AccordionItem value="price" className="border-b border-slate-100 dark:border-slate-800/80">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Price Range</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-2">
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
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-sm scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleApplyCustomPrice} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold group-focus-within:text-primary transition-colors">ETB</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <span className="text-slate-400 font-medium text-sm">-</span>
                <div className="relative flex-1 group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold group-focus-within:text-primary transition-colors">ETB</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full h-10 text-xs font-bold rounded-xl shadow-sm"
              >
                Apply Custom Price
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <>
      {/* ── Mobile Sticky Trigger Pill (Screens < lg) ── */}
      <div className="lg:hidden mb-6">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm flex items-center justify-between px-5 shadow-sm bg-white dark:bg-slate-900 transition-all hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <span>Shopping Options</span>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl p-0 overflow-hidden flex flex-col">
            <SheetHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-black font-serif">
                  Shopping Options
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="p-6 overflow-y-auto flex-1">
              <FilterControls />
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <Button
                onClick={() => setIsMobileOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md transition-all"
              >
                View {totalProducts !== undefined ? `${totalProducts} Results` : "Results"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop Sidebar Container (Screens >= lg) ── */}
      <div className="hidden lg:flex flex-col rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none backdrop-blur-xl sticky top-28 overflow-hidden">
        {/* Header & Reset */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 p-6 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 font-serif">
            Shopping Options
          </h3>
        </div>

        <div className="p-6 pt-2">
          <FilterControls />
        </div>
      </div>
    </>
  );
}
