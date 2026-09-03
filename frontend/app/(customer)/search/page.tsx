import Link from "next/link";
import { use } from "react";
import { Search, AlertCircle, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/customer/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductFilters } from "@/components/customer/product-filters";

import { catalogService } from "@/features/products/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function SearchResultsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q || "";
  
  let results: any[] = [];
  let categories: any[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      catalogService.getPublicProducts({ search: query }),
      catalogService.getCategoryTree(),
    ]);

    const productsArray = Array.isArray(productsRes) ? productsRes : [];
    results = productsArray.map((product) => {
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
      };
    });

    categories = categoriesRes || [];
  } catch (err) {
    console.error("Failed to fetch search page data", err);
  }

  const mappedCategories = categories.map((c) => ({
    id: c.slug,
    label: c.name,
    count: c.product_count,
  }));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Search Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {query ? (
              <span>Showing results for <span className="font-semibold text-slate-900 dark:text-slate-200">"{query}"</span></span>
            ) : (
              <span>Showing all products</span>
            )}
            <span className="mx-2">•</span>
            {results.length} {results.length === 1 ? "result" : "results"} found
          </p>
        </div>
        
        {/* Mobile Search Input (Desktop is in header) */}
        <form action="/search" method="GET" className="w-full md:w-80 relative flex md:hidden">
          <Input 
            name="q"
            defaultValue={query}
            placeholder="Search products..." 
            className="w-full pl-4 pr-10"
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full w-10 text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 hidden md:block">
          <ProductFilters categories={mappedCategories} />
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 h-96">
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No results found</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                We couldn't find any products matching "{query}". Try checking your spelling or using more general terms.
              </p>
              <Link href="/products" className={buttonVariants()}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
