import Link from "next/link";
import { ProductCard } from "@/components/customer/product-card";
import { ProductFilters } from "@/components/customer/product-filters";
import { CountdownTimer } from "@/components/customer/countdown-timer";
import { SortDropdown } from "@/components/customer/sort-dropdown";
import { ActiveFilterChips } from "@/components/customer/active-filter-chips";
import { Zap, Search, Flame, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { catalogService } from "@/features/products/services/catalog-service";

export const revalidate = 60;

const SORT_OPTIONS = [
  { label: "Biggest Discount", value: "discount" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Top Rated", value: "rating" },
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    search?: string;
    sort?: string;
    in_stock?: string;
    min_price?: string;
    max_price?: string;
  }>;
}) {
  const { category, q, search, sort, in_stock, min_price, max_price } = await searchParams;
  const searchQuery = q || search;

  let products: any[] = [];
  let categories: any[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      catalogService.getPublicProducts({
        category,
        search: searchQuery,
        sort: sort || "discount",
        deals: true,
        in_stock: in_stock === "true" || undefined,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
      }),
      catalogService.getCategoryTree(),
    ]);

    const productsArray = Array.isArray(productsRes) ? productsRes : [];
    products = productsArray.map((product) => {
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
        vendorLocation: product.vendor_location,
      };
    });

    categories = categoriesRes || [];
  } catch (err) {
    console.error("Failed to load deals data from backend:", err);
  }

  const mappedCategories = categories.map((c) => ({
    id: c.slug,
    label: c.name,
    count: c.product_count,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-12 md:pt-28 max-w-[1400px]">
        {/* Flash Deals Hero Banner */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 dark:from-rose-950 dark:via-rose-900 dark:to-orange-900 px-6 py-10 sm:p-12 shadow-xl isolate">
          {/* Ambient Lighting & Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-semibold mb-4">
                <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>Limited Time Promotion</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white tracking-tight leading-none mb-3">
                Flash Deals &amp; Steals
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                Save up to 50% on authentic electronics, apparel, and home essentials directly from verified Ethiopian merchants.
              </p>
            </div>

            {/* Countdown Container */}
            <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-center text-white shrink-0 shadow-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-300" /> Deals Expire In
              </span>
              <CountdownTimer targetHours={14} />
              <span className="text-[11px] text-white/70 mt-3 font-medium">
                Deals refresh daily at 00:00 EAT
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop & Mobile Drawer) */}
          <aside className="w-full lg:w-64 shrink-0">
            <ProductFilters
              categories={mappedCategories}
              basePath="/deals"
              totalProducts={products.length}
            />
          </aside>

          {/* Deals Grid Area */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="mb-4 flex flex-col gap-4">
              {/* Search Within Deals */}
              <form method="GET" action="/deals" className="relative w-full">
                {category && <input type="hidden" name="category" value={category} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {in_stock && <input type="hidden" name="in_stock" value={in_stock} />}
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery || ""}
                  placeholder="Search deals by product, brand, or specification..."
                  className="h-11 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-11 pr-4 text-sm outline-none transition-all duration-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-sm"
                />
              </form>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {products.length}{" "}
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {products.length === 1 ? "deal available" : "deals available"}
                  </span>
                </span>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 hidden sm:block">
                    Sort by:
                  </span>
                  <SortDropdown options={SORT_OPTIONS} defaultValue="discount" />
                </div>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            <ActiveFilterChips totalCount={products.length} />

            {/* Products Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-5">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No active deals found</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm mb-6">
                    {searchQuery || category || min_price || max_price
                      ? "No promotional deals match your current filter selection. Try removing some filters."
                      : "There are currently no items marked on sale. Check back soon for the next festival sale!"}
                  </p>
                  {(searchQuery || category || min_price || max_price) && (
                    <Link
                      href="/deals"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition-transform active:scale-95 shadow-md"
                    >
                      Reset Deals Filter
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
