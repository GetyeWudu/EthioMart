import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { CategoryCard } from "@/components/customer/category-card";
import { HeroSlider } from "@/components/customer/hero-slider";
import { catalogService } from "@/features/products/services/catalog-service";
import { CategoryNode } from "@/features/products/types";
import { getImageUrl } from "@/lib/api";

// ISR: Regenerate cached page at most once every 60 seconds
export const revalidate = 60;

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
  totalCount,
  isTrending = false,
}: {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel?: string;
  products: any[];
  totalCount?: number;
  isTrending?: boolean;
}) {
  if (!products || products.length === 0) return null;

  const chunkSize = isTrending ? 9 : 6;
  const productPages = chunkProducts(products, chunkSize);

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
            Showing 1-{Math.min(chunkSize, products.length)} of {products.length} products
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
  let categoryShelves: { id: string; name: string; slug: string; totalCount: number; products: any[] }[] = [];
  let mappedCategories: any[] = [];

  try {
    // Fetch categories and products from backend APIs
    const [categoriesRes, productsRes] = await Promise.all([
      catalogService.getCategoryTree().catch((err) => {
        console.warn("Failed to fetch categories:", err.message);
        return [];
      }),
      catalogService.getPublicProducts({ page: 1, page_size: 100 }).catch((err) => {
        console.warn("Failed to fetch products:", err.message);
        return [];
      }),
    ]);
    categories = categoriesRes || [];

    const rawProducts = Array.isArray(productsRes) ? productsRes : ((productsRes as any)?.results || []);
    const mappedAllProducts = rawProducts.map((p: any) => mapProduct(p));

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // 1. Trending Now: Select about 18 diverse products across different categories
    const productsByCat: Record<string, any[]> = {};
    mappedAllProducts.forEach((p: any) => {
      const catKey = (p.categorySlug || p.categoryName || "general").toLowerCase();
      if (!productsByCat[catKey]) {
        productsByCat[catKey] = [];
      }
      productsByCat[catKey].push(p);
    });

    const hasRealImage = (p: any) =>
      Boolean(p.image && !p.image.includes("images.unsplash.com"));

    // Sort products inside each category: real uploaded images ALWAYS first, then rating and recency
    Object.values(productsByCat).forEach((catList) => {
      catList.sort((a: any, b: any) => {
        const aReal = hasRealImage(a) ? 1 : 0;
        const bReal = hasRealImage(b) ? 1 : 0;
        if (bReal !== aReal) return bReal - aReal;
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    });

    const catKeys = Object.keys(productsByCat);
    const diverseTrending: any[] = [];
    const maxProdsPerCat = Math.max(...catKeys.map((k) => productsByCat[k].length), 0);

    for (let i = 0; i < maxProdsPerCat && diverseTrending.length < 18; i++) {
      for (const k of catKeys) {
        if (productsByCat[k][i]) {
          diverseTrending.push(productsByCat[k][i]);
          if (diverseTrending.length >= 18) break;
        }
      }
    }

    trendingProducts = diverseTrending.map((p: any) => {
      const createdTime = new Date(p.createdAt || 0).getTime();
      const isRecent = p.createdAt ? (now - createdTime <= SEVEN_DAYS_MS) : false;
      return {
        ...p,
        isNew: Boolean(p.isNew || isRecent),
      };
    });

    // Helper to get all descendant slugs & names for a category node
    const getDescendantKeys = (node: CategoryNode): Set<string> => {
      const keys = new Set<string>();
      const walk = (n: CategoryNode) => {
        if (n.slug) keys.add(n.slug.toLowerCase());
        if (n.name) keys.add(n.name.toLowerCase());
        if (n.children && n.children.length > 0) {
          n.children.forEach(walk);
        }
      };
      walk(node);
      return keys;
    };

    // 2. Category Shelves: Display 6 curated products per category on homepage (real images first)
    categoryShelves = categories
      .map((cat) => {
        const descKeys = getDescendantKeys(cat);
        const catProducts = mappedAllProducts
          .filter(
            (p: any) =>
              descKeys.has(p.categorySlug?.toLowerCase()) ||
              descKeys.has(p.categoryName?.toLowerCase())
          )
          .sort((a: any, b: any) => {
            const aReal = hasRealImage(a) ? 1 : 0;
            const bReal = hasRealImage(b) ? 1 : 0;
            if (bReal !== aReal) return bReal - aReal;
            return (b.rating || 0) - (a.rating || 0);
          });
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          totalCount: catProducts.length,
          products: catProducts.slice(0, 6),
        };
      })
      .filter((shelf) => shelf.products.length > 0);

    // Fetch category card thumbnails for categories that have at least 4 products
    // (ensuring each 2x2 card prioritizes real uploaded product photos from that category)
    const categoryProductCounts = categories.map((c) => {
      const descKeys = getDescendantKeys(c);
      const prodsForCat = mappedAllProducts
        .filter(
          (p: any) =>
            descKeys.has(p.categorySlug?.toLowerCase()) ||
            descKeys.has(p.categoryName?.toLowerCase())
        )
        .sort((a: any, b: any) => {
          const aReal = hasRealImage(a) ? 1 : 0;
          const bReal = hasRealImage(b) ? 1 : 0;
          return bReal - aReal;
        });
      // Collect unique product images for this category, real photos first
      const uniqueImages = Array.from(
        new Set(prodsForCat.map((p: any) => p.image).filter(Boolean))
      ).sort((a: any, b: any) => {
        const aReal = !a.includes("images.unsplash.com") ? 1 : 0;
        const bReal = !b.includes("images.unsplash.com") ? 1 : 0;
        return bReal - aReal;
      });
      return {
        category: c,
        products: prodsForCat,
        images: uniqueImages,
        count: prodsForCat.length,
      };
    });

    // STRICT: Only include categories with AT LEAST 4 products and at least 4 distinct product images.
    // If a category does not have a minimum of 4 products, it is NOT shown at all.
    const qualifiedCategories = categoryProductCounts.filter(
      (item) => item.count >= 4 && item.images.length >= 4
    );

    mappedCategories = qualifiedCategories.map(({ category: c, images: uniqueImages, count }) => {
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        images: uniqueImages.slice(0, 4),
        itemCount: count || c.product_count || 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch homepage data", error);
  }

  // Never show empty or fallback cards for categories with < 4 items
  // (mappedCategories already contains strictly validated categories with >= 4 items)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">

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

      {/* Products by Category: Curated 6 products per shelf | Complete catalog via category pages */}
      {categoryShelves.map((shelf) => (
        <ProductShelf
          key={shelf.id}
          title={shelf.name}
          subtitle={`Top authentic products from verified ${shelf.name} merchants`}
          viewAllHref={`/products?category=${shelf.slug}`}
          viewAllLabel={shelf.totalCount > 6 ? `Explore All ${shelf.name} (${shelf.totalCount})` : `Explore ${shelf.name}`}
          products={shelf.products}
          totalCount={shelf.totalCount}
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
