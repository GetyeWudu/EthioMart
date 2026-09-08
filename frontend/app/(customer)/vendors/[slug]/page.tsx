/**
 * frontend/app/(customer)/vendors/[slug]/page.tsx
 * ===============================================
 * Public storefront profile and live catalog for a verified merchant.
 */

"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  usePublicStoreDetail,
  VendorHero,
} from "@/features/vendors";
import {
  ArrowLeft,
  Package,
  Sparkles,
  Loader2,
  Store,
  Search,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Building2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { catalogService } from "@/features/products/services/catalog-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PublicVendorStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { store, isLoading: isStoreLoading, error } = usePublicStoreDetail(slug);

  const [products, setProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (!slug) return;
    setIsProductsLoading(true);
    catalogService
      .getPublicProducts({
        vendor: slug,
        sort: sortBy,
      })
      .then((res) => {
        const productsArray = Array.isArray(res) ? res : [];
        const mapped = productsArray.map((product) => {
          const minPrice = Number(product.min_price || 0);
          const maxPrice = Number(product.max_price || 0);
          const effectivePrice = Number(product.effective_price ?? minPrice);
          const originalPrice = Number(product.original_price ?? maxPrice);
          const discountPercentage =
            Number(product.discount_percentage) ||
            (originalPrice > effectivePrice && originalPrice > 0
              ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
              : undefined);

          return {
            id: product.id,
            name: product.title,
            slug: product.slug,
            price: effectivePrice,
            originalPrice: originalPrice > effectivePrice ? originalPrice : undefined,
            rating: Number(product.avg_rating || 0),
            reviewsCount: Number(product.review_count || 0),
            image: product.primary_image || "/placeholder.svg",
            isNew: false,
            discountPercentage: discountPercentage && discountPercentage > 0 ? discountPercentage : undefined,
            promotionBadge: product.promotion_badge || undefined,
            defaultVariantId: product.default_variant_id,
            hasVariants:
              product.product_type === "CONFIGURABLE_VARIANT" ||
              (Array.isArray((product as any).variants) && (product as any).variants.length > 1),
            categoryName: product.category_name || "General",
            categorySlug: product.category_slug || "general",
          };
        });
        setProducts(mapped);
      })
      .catch((err) => console.error("Failed to load store products:", err))
      .finally(() => setIsProductsLoading(false));
  }, [slug, sortBy]);

  // Extract store categories
  const storeCategories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    products.forEach((p) => {
      const slug = p.categorySlug || "other";
      const name = p.categoryName || "Other";
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { name, slug, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Filter products by in-store search, category, and active tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === "deals" && (!p.discountPercentage || p.discountPercentage <= 0)) {
        return false;
      }
      if (selectedCategory !== "ALL" && p.categorySlug !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [products, activeTab, selectedCategory, searchQuery]);

  const dealsCount = useMemo(() => {
    return products.filter((p) => p.discountPercentage && p.discountPercentage > 0).length;
  }, [products]);

  if (isStoreLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Loading store profile...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Store Not Found</h1>
        <p className="text-sm text-slate-500">
          The store you are looking for does not exist, is under review, or has been temporarily suspended.
        </p>
        <Link href="/stores">
          <Button variant="outline" className="rounded-xl gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Browse All Stores
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 pt-24 md:py-12 md:pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/stores" className="hover:text-primary flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Stores
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">{store.store_name}</span>
        </div>

        {/* Storefront Hero Header */}
        <VendorHero store={{ ...store, product_count: products.length }} />

        {/* Store Catalog Section */}
        <div className="space-y-6 pt-2">
          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-11">
                <TabsTrigger value="all" className="rounded-xl text-xs font-semibold px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  All Products ({products.length})
                </TabsTrigger>
                <TabsTrigger value="deals" className="rounded-xl text-xs font-semibold px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <Flame className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                  On Sale & Deals ({dealsCount})
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-xl text-xs font-semibold px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" />
                  Store Trust & Info
                </TabsTrigger>
              </TabsList>

              {/* In-Store Search & Sort */}
              {activeTab !== "about" && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search in ${store.store_name}...`}
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                  </div>

                  <Select value={sortBy} onValueChange={(val) => setSortBy(val || "featured")}>
                    <SelectTrigger className="w-[160px] h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="discount">Biggest Discount</SelectItem>
                      <SelectItem value="newest">Newest Arrivals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Catalog Content (All & Deals Tabs) */}
            <TabsContent value="all" className="space-y-6 pt-2 focus-visible:outline-none">
              {/* Category Filter Pills */}
              {storeCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === "ALL"
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    All Categories ({products.length})
                  </button>
                  {storeCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat.slug
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Product Grid */}
              {isProductsLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-3 bg-white/50 dark:bg-slate-950/50">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No matching products found</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== "ALL"
                      ? "No products in this store match your current filter criteria. Try resetting your search."
                      : `${store.store_name} has not published any live items in this catalog yet.`}
                  </p>
                  {(searchQuery || selectedCategory !== "ALL") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("ALL");
                      }}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset In-Store Search
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="space-y-6 pt-2 focus-visible:outline-none">
              {isProductsLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-3 bg-white/50 dark:bg-slate-950/50">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
                    <Flame className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No active promotions right now</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    {store.store_name} currently does not have any discounted or clearance items. Check back soon for future flash sales!
                  </p>
                </div>
              )}
            </TabsContent>

            {/* About Store Tab */}
            <TabsContent value="about" className="pt-2 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      About {store.store_name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {store.store_description ||
                        `${store.store_name} is an approved independent merchant operating on EthioMart Marketplace, delivering authentic goods and certified products to customers across Ethiopia.`}
                    </p>
                  </div>

                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      Platform Buyer Protection Guarantee
                    </h3>
                    <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Multi-Party Escrow:</strong> Your payment remains securely held by EthioMart until delivery is physically confirmed.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Verified National Merchant:</strong> This merchant's Ethiopian trade license, tax ID, and business documents have been verified by compliance.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Easy Return & Refund:</strong> If an item arrives defective or damaged, you can open an in-platform dispute for an immediate refund.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Store Information</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Location</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{store.city || "Addis Ababa"}, Ethiopia</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Compliance Status</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Seller
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Contact Email</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{store.contact_email || "compliance@ethiomart.com"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{store.contact_phone || "+251 (0) 911 000 000"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
