import Link from "next/link";
import { ProductCard } from "@/components/customer/product-card";
import { ProductFilters } from "@/components/customer/product-filters";
import { SortDropdown } from "@/components/customer/sort-dropdown";

import { Search, Sparkles, PackageOpen } from "lucide-react";
import { catalogService } from "@/features/products/services/catalog-service";
import { AutoRefresh } from "@/components/customer/auto-refresh";
import { getImageUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Biggest Discount", value: "discount" },
  { label: "Top Rated", value: "rating" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    search?: string;
    sort?: string;
    page?: string;
    deals?: string;
    on_sale?: string;
    in_stock?: string;
    min_price?: string;
    max_price?: string;
  }>;
}) {
  const {
    category,
    q,
    search,
    sort,
    deals,
    on_sale,
    in_stock,
    min_price,
    max_price,
  } = await searchParams;

  const searchQuery = q || search;

  let products: any[] = [];
  let categories: any[] = [];
  let currentCategoryName = "All Products";

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      catalogService.getPublicProducts({
        category,
        search: searchQuery,
        sort: sort || "featured",
        deals: deals === "true" || on_sale === "true" || undefined,
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
        image: getImageUrl(product.primary_image, product.id),
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
    if (category) {
      const activeCat = categories.find((c) => c.slug === category);
      if (activeCat) {
        currentCategoryName = activeCat.name;
      }
    }
  } catch (err) {
    console.error("Failed to fetch products page data", err);
  }

  const mappedCategories = categories.map((c) => ({
    id: c.slug,
    label: c.name,
    count: c.product_count,
  }));

  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:py-12 md:pt-28 max-w-[1400px]">
      <AutoRefresh interval={10000} />

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Direct Merchant Catalog
          </div>
          <h1 className="text-3xl font-black font-serif tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {currentCategoryName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified products backed by EthioMart escrow payment safety.
          </p>
        </div>

        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {products.length} {products.length === 1 ? "Product Available" : "Products Available"}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop & Mobile Drawer) */}
        <aside className="w-full lg:w-64 shrink-0">
          <ProductFilters
            categories={mappedCategories}
            basePath="/products"
            totalProducts={products.length}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="mb-4 flex flex-col gap-4">
            {/* Search Bar */}
            <form method="GET" action="/products" className="relative w-full">
              {category && <input type="hidden" name="category" value={category} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {deals && <input type="hidden" name="deals" value={deals} />}
              {in_stock && <input type="hidden" name="in_stock" value={in_stock} />}
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery || ""}
                placeholder="Search catalog by title, brand, or specs..."
                className="h-11 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-11 pr-4 text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </form>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing {products.length} live items
              </span>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 hidden sm:block">
                  Sort by:
                </span>
                <SortDropdown options={SORT_OPTIONS} defaultValue="featured" />
              </div>
            </div>
          </div>



          {/* Product Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-5">
            {products.length > 0 ? (
              products.map((product) => <ProductCard key={product.id} {...product} />)
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                <PackageOpen className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm mb-6">
                  {searchQuery || category || deals || in_stock || min_price || max_price
                    ? "We couldn't find any products matching your current filters. Try adjusting or clearing your filters."
                    : "No products are currently published in this category."}
                </p>
                {(searchQuery || category || deals || in_stock || min_price || max_price) && (
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition-transform active:scale-95 shadow-md"
                  >
                    Clear All Filters
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
