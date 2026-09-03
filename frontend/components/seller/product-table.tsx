"use client";

import { useState, useEffect } from "react";
import { Edit, Plus, Star, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SellerProductCard } from "./seller-product-card";

const PRODUCTS = [
  { id: "P1", name: "Aurora Wireless Headphones", category: "electronics", brand: "Zii Audio", price: 129.99, stock: 250, sales: 117, rating: 4.8, status: "Active", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop", sku: "SEED-001" },
  { id: "P2", name: "Everyday Cotton Tee", category: "fashion", brand: "Zii Wear", price: 19.99, stock: 750, sales: 131, rating: 4.9, status: "Active", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop", sku: "SEED-002" },
  { id: "P3", name: "Ceramic Pour-Over Coffee Set", category: "home-kitchen", brand: "Zii Home", price: 39.99, stock: 250, sales: 59, rating: 4.5, status: "Active", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=200&auto=format&fit=crop", sku: "SEED-003" },
  { id: "P4", name: "Smart Fitness Watch", category: "electronics", brand: "Zii Tech", price: 199.99, stock: 15, sales: 256, rating: 4.6, status: "Active", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop", sku: "SEED-004" },
  { id: "P5", name: "Leather Messenger Bag", category: "fashion", brand: "Zii Wear", price: 89.99, stock: 0, sales: 42, rating: 4.7, status: "Out of Stock", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop", sku: "SEED-005" },
];

export function ProductTable() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "All";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Keep state in sync with URL
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "sales-desc": return b.sales - a.sales;
      case "rating-desc": return b.rating - a.rating;
      case "newest":
      default: return 0; // Assuming initial array is newest first for this dummy data
    }
  });

  const clearFilters = () => {
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const hasActiveFilters = statusFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 bg-transparent">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, SKU, category, brand..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-11 w-full rounded-lg shadow-sm"
            />
          </div>
          
          {/* Right-Aligned Dropdowns */}
          <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
              <SelectTrigger className="w-[160px] h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="home-kitchen">Home & Kitchen</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
              <SelectTrigger className="w-[140px] h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
              <SelectTrigger className="w-[140px] h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="sales-desc">Top Sellers</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-11 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("grid")}
                className={cn("h-full w-9 rounded-sm transition-colors", viewMode === "grid" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M4.5 5.5C5.05228 5.5 5.5 5.05228 5.5 4.5C5.5 3.94772 5.05228 3.5 4.5 3.5C3.94772 3.5 3.5 3.94772 3.5 4.5C3.5 5.05228 3.94772 5.5 4.5 5.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M4.5 11.5C5.05228 11.5 5.5 11.0523 5.5 10.5C5.5 9.94772 5.05228 9.5 4.5 9.5C3.94772 9.5 3.5 9.94772 3.5 10.5C3.5 11.0523 3.94772 11.5 4.5 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M10.5 5.5C11.0523 5.5 11.5 5.05228 11.5 4.5C11.5 3.94772 11.0523 3.5 10.5 3.5C9.94772 3.5 9.5 3.94772 9.5 4.5C9.5 5.05228 9.94772 5.5 10.5 5.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M10.5 11.5C11.0523 11.5 11.5 11.0523 11.5 10.5C11.5 9.94772 11.0523 9.5 10.5 9.5C9.94772 9.5 9.5 9.94772 9.5 10.5C9.5 11.0523 9.94772 11.5 10.5 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("list")}
                className={cn("h-full w-9 rounded-sm transition-colors", viewMode === "list" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.15 4C3.61944 4 4 3.61944 4 3.15C4 2.68056 3.61944 2.3 3.15 2.3C2.68056 2.3 2.3 2.68056 2.3 3.15C2.3 3.61944 2.68056 4 3.15 4ZM3.15 8.35C3.61944 8.35 4 7.96944 4 7.5C4 7.03056 3.61944 6.65 3.15 6.65C2.68056 6.65 2.3 7.03056 2.3 7.5C2.3 7.96944 2.68056 8.35 3.15 8.35ZM3.15 12.7C3.61944 12.7 4 12.3194 4 11.85C4 11.3806 3.61944 11 3.15 11C2.68056 11 2.3 11.3806 2.3 11.85C2.3 12.3194 2.68056 12.7 3.15 12.7ZM5.5 3.15C5.5 2.73579 5.83579 2.4 6.25 2.4H12.25C12.6642 2.4 13 2.73579 13 3.15C13 3.56421 12.6642 3.9 12.25 3.9H6.25C5.83579 3.9 5.5 3.56421 5.5 3.15ZM5.5 7.5C5.5 7.08579 5.83579 6.75 6.25 6.75H12.25C12.6642 6.75 13 7.08579 13 7.5C13 7.91421 12.6642 8.25 12.25 8.25H6.25C5.83579 8.25 5.5 7.91421 5.5 7.5ZM5.5 11.85C5.5 11.4358 5.83579 11.1 6.25 11.1H12.25C12.6642 11.1 13 11.4358 13 11.85C13 12.2642 12.6642 12.6 12.25 12.6H6.25C5.83579 12.6 5.5 12.2642 5.5 11.85Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing <span className="text-slate-900 dark:text-white">{filteredProducts.length}</span> of {PRODUCTS.length} products
        </p>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          Select all
        </Button>
      </div>

      <div>
        {filteredProducts.length > 0 ? (
          <div className={cn(
            "grid gap-3 sm:gap-4 md:gap-6 w-full",
            viewMode === "grid" 
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
              : "grid-cols-1"
          )}>
            {filteredProducts.map((product) => (
              <SellerProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="text-4xl mb-4 opacity-50">📦</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Products Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
              Try adjusting your search query or filters to find what you're looking for.
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="mt-6 rounded-xl">
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
