import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { CategoryCard } from "@/components/customer/category-card";
import { HeroSlider } from "@/components/customer/hero-slider";
import { catalogService } from "@/features/products/services/catalog-service";
import { CategoryNode } from "@/features/products/types";
import { AutoRefresh } from "@/components/customer/auto-refresh";
import { getImageUrl } from "@/lib/api";

// Ensure this page runs dynamically to always fetch latest products
export const dynamic = "force-dynamic";

function mapProduct(product: any, isNewOverride?: boolean) {
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
    isNew: isNewOverride !== undefined ? isNewOverride : Boolean(product.is_new),
    discountPercentage: discountPercentage && discountPercentage > 0 ? discountPercentage : undefined,
    promotionBadge: product.promotion_badge || undefined,
    defaultVariantId: product.default_variant_id,
    hasVariants: product.product_type === "CONFIGURABLE_VARIANT" || (Array.isArray(product.variants) && product.variants.length > 1),
    vendorLocation: product.vendor_location || undefined,
    totalAvailableStock: product.total_available_stock !== undefined ? product.total_available_stock : 10,
    categoryName: product.category_name,
    categorySlug: product.category_slug,
    createdAt: product.created_at,
  };
}

/**
 * Reusable Product Shelf Component:
 * - Mobile: 3 rows x 3 columns (9 products visible at once), with horizontal scrolling for additional items.
 * - Desktop: Standard responsive grid (3-6 columns).
 */
function chunkProducts<T>(array: T[], size: number = 9): T[][] {
  if (!array || array.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function ProductShelf({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  products,
  isTrending = false,
}: {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel?: string;
  products: any[];
  isTrending?: boolean;
}) {
  if (!products || products.length === 0) return null;

  const productPages = chunkProducts(products, 9);

  return (
    <section className="container mx-auto px-3 sm:px-4 mt-6 sm:mt-10">
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="flex items-center gap-2">
            {isTrending && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            )}
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="hidden sm:flex">
          <Link
            href={viewAllHref}
            className={buttonVariants({
              variant: "ghost",
              className: "rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold",
            })}
          >
            {viewAllLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* MOBILE VIEW: Exactly 9 products (3 columns x 3 rows) per view, swipe horizontally for more */}
      <div className="sm:hidden flex items-start overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-none gap-4">
        {productPages.map((pageGroup, pageIdx) => (
          <div
            key={pageIdx}
            className="w-full min-w-full shrink-0 snap-center grid grid-cols-3 gap-2 content-start items-start auto-rows-max"
          >
            {pageGroup.map((product) => (
              <div
                key={product.id}
                className="w-full h-fit flex flex-col"
              >
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {productPages.length > 1 && (
        <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-2 px-1">
          <span>
            Showing 1-{Math.min(9, products.length)} of {products.length} products
          </span>
          <span className="font-semibold text-primary flex items-center gap-1">
            Swipe for more →
          </span>
        </div>
      )}

      {/* DESKTOP VIEW: Standard responsive grid without horizontal scroll */}
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 content-start items-start auto-rows-max">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-full h-fit flex flex-col"
          >
            <ProductCard {...product} />
          </div>
        ))}
      </div>

      <Link
        href={viewAllHref}
        className={buttonVariants({
          variant: "outline",
          className: "mt-3 w-full sm:hidden rounded-full h-9 text-xs border-slate-300 dark:border-slate-800 font-semibold",
        })}
      >
        {viewAllLabel}
      </Link>
    </section>
  );
}

export default async function CustomerHomePage() {
  let categories: CategoryNode[] = [];
  let trendingProducts: any[] = [];
  let categoryShelves: { id: string; name: string; slug: string; products: any[] }[] = [];
  let mappedCategories: any[] = [];

  try {
    // Fetch categories and products from backend APIs
    const [categoriesRes, productsRes] = await Promise.all([
      catalogService.getCategoryTree().catch((err) => {
        console.warn("Failed to fetch categories:", err.message);
        return [];
      }),
      catalogService.getPublicProducts({ page: 1 }).catch((err) => {
        console.warn("Failed to fetch products:", err.message);
        return [];
      }),
    ]);
    categories = categoriesRes || [];

    const rawProducts = Array.isArray(productsRes) ? productsRes : ((productsRes as any)?.results || []);
    const mappedAllProducts = rawProducts.map((p: any) => mapProduct(p));

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // 1. Trending Now: new products created within the last 24 hours
    let trendingRaw = mappedAllProducts.filter((p: any) => {
      if (!p.createdAt) return false;
      const createdTime = new Date(p.createdAt).getTime();
      return now - createdTime <= ONE_DAY_MS;
    });

    // Fallback: If no products were created in the past 24 hours, display the newest products in Trending Now
    if (trendingRaw.length === 0) {
      trendingRaw = [...mappedAllProducts]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 18);
    }

    trendingProducts = trendingRaw.map((p: any) => ({ ...p, isNew: true }));
    const trendingIds = new Set(trendingProducts.map((p: any) => p.id));

    // 2. Others (> 24 hours): grouped by categories
    const remainingProducts = mappedAllProducts.filter((p: any) => !trendingIds.has(p.id));

    categoryShelves = categories
      .map((cat) => {
        const catProducts = remainingProducts.filter(
          (p: any) => p.categorySlug === cat.slug || p.categoryName?.toLowerCase() === cat.name?.toLowerCase()
        );
        // Fallback: if remaining is sparse, include all products in this category
        const finalProducts =
          catProducts.length > 0
            ? catProducts
            : mappedAllProducts.filter(
                (p: any) => p.categorySlug === cat.slug || p.categoryName?.toLowerCase() === cat.name?.toLowerCase()
              );

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          products: finalProducts,
        };
      })
      .filter((shelf) => shelf.products.length > 0);

    // Fetch category card thumbnails for top categories
    const topCategories = categories.slice(0, 4);
    mappedCategories = topCategories.map((c) => {
      const prodsForCat = mappedAllProducts.filter(
        (p: any) => p.categorySlug === c.slug || p.categoryName?.toLowerCase() === c.name?.toLowerCase()
      );
      const productImages = prodsForCat.map((p: any) => p.image).filter(Boolean).slice(0, 4);
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
        itemCount: c.product_count || prodsForCat.length || 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch homepage data", error);
  }

  // Fallback map for CategoryCard props if API fails entirely
  if (mappedCategories.length === 0 && categories.length > 0) {
    mappedCategories = categories.slice(0, 4).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      images: c.image
        ? [getImageUrl(c.image, c.id)]
        : [getImageUrl(null, c.id + "1"), getImageUrl(null, c.id + "2")],
      itemCount: c.product_count || 0,
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <AutoRefresh interval={5000} />

      {/* Hero: Full-screen video background with minimal paragraph */}
      <HeroSlider />

      {/* Featured Categories (Enterprise Layout) */}
      <section className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
          <div className="max-w-2xl flex flex-col items-center text-center sm:items-start sm:text-left">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Shop by Category
            </h2>
          </div>
          <div className="hidden sm:flex">
            <Link
              href="/categories"
              className={buttonVariants({
                variant: "outline",
                className:
                  "rounded-full px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs sm:text-sm font-semibold",
              })}
            >
              View All Categories <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 sm:gap-4">
          {mappedCategories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
          {mappedCategories.length === 0 && (
            <p className="text-slate-500 text-sm py-4">No categories found.</p>
          )}
        </div>
        <Link
          href="/categories"
          className={buttonVariants({
            variant: "outline",
            className:
              "mt-3 w-full sm:hidden rounded-full h-9 text-xs border-slate-300 dark:border-slate-800 font-semibold",
          })}
        >
          View All Categories
        </Link>
      </section>

      {/* Trending Products: New products (< 24h) | Mobile 3x3 with Horizontal Scroll */}
      <ProductShelf
        title="Trending Now"
        subtitle="Fresh new products and popular arrivals posted in the marketplace"
        viewAllHref="/products?sort=trending"
        viewAllLabel="View All Trending"
        products={trendingProducts}
        isTrending={true}
      />

      {/* Products by Category (> 24h): Shelves for each category | Mobile 3x3 with Horizontal Scroll */}
      {categoryShelves.map((shelf) => (
        <ProductShelf
          key={shelf.id}
          title={shelf.name}
          subtitle={`Top authentic products from verified ${shelf.name} merchants`}
          viewAllHref={`/products?category=${shelf.slug}`}
          viewAllLabel={`Explore ${shelf.name}`}
          products={shelf.products}
        />
      ))}

      {/* Promotional Banner */}
      <section className="container mx-auto px-3 sm:px-4 mt-8 sm:mt-12 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950">
          <div className="absolute inset-0 opacity-50 mix-blend-multiply">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"
              alt="Sale Background"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative flex flex-col items-center justify-center p-6 text-center sm:p-8 lg:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              End of Season Sale
            </h2>
            <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-lg text-slate-300">
              Get up to 50% off on selected items. Don't miss out on these exclusive deals available for a limited time only.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link
                href="/deals"
                className={buttonVariants({
                  size: "lg",
                  variant: "secondary",
                  className: "h-11 sm:h-12 px-6 sm:px-8 text-xs sm:text-sm font-semibold",
                })}
              >
                Shop the Sale
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
