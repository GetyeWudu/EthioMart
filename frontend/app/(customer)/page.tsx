import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, Clock, CreditCard } from "lucide-react";
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

export default async function CustomerHomePage() {
  let categories: CategoryNode[] = [];
  let featuredProducts: any[] = [];

  let mappedCategories: any[] = [];
  try {
    // Fetch categories and products from backend APIs
    const [categoriesRes, productsRes] = await Promise.all([
      catalogService.getCategoryTree().catch(err => {
        console.warn("Failed to fetch categories:", err.message);
        return [];
      }),
      catalogService.getPublicProducts({ sort: "trending", page: 1 }).catch(err => {
        console.warn("Failed to fetch products:", err.message);
        return { results: [] };
      }),
    ]);
    categories = categoriesRes || [];
    
    // Map backend ProductListItem to ProductCard props format
    const productsArray = Array.isArray(productsRes) ? productsRes : ((productsRes as any)?.results || []);
    featuredProducts = productsArray.map((product: any) => {
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
        hasVariants: product.product_type === 'CONFIGURABLE_VARIANT' || (Array.isArray(product.variants) && product.variants.length > 1),
      };
    });

    // Fetch product images for the top 4 categories
    const topCategories = categories.slice(0, 4);
    const categoryProductsPromises = topCategories.map(c => 
      catalogService.getPublicProducts({ category: c.slug, page: 1 })
        .catch(() => ({ results: [] })) // Fallback on error
    );
    const categoryProductsRes = await Promise.all(categoryProductsPromises);

    mappedCategories = topCategories.map((c, idx) => {
      const prods: any = categoryProductsRes[idx];
      const prodsArray = Array.isArray(prods) ? prods : (prods?.results || []);
      
      // Extract up to 4 images from the products in this category
      const productImages = prodsArray
        .filter((p: any) => p.primary_image)
        .map((p: any) => getImageUrl(p.primary_image, p.id))
        .slice(0, 4);
        
      const images = productImages.length > 0 
        ? productImages 
        : (c.image ? [getImageUrl(c.image, c.id)] : [
            getImageUrl(null, c.id + "1"),
            getImageUrl(null, c.id + "2"),
          ]);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        images,
        itemCount: c.product_count || 0
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
      images: c.image ? [getImageUrl(c.image, c.id)] : [
        getImageUrl(null, c.id + "1"),
        getImageUrl(null, c.id + "2"),
      ],
      itemCount: c.product_count || 0
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <AutoRefresh interval={5000} />
      {/* Hero: Full-screen immersive slider */}
      <HeroSlider />

      {/* Featured Categories (Enterprise Layout) */}
      <section className="container mx-auto px-4 mt-4 sm:mt-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="max-w-2xl flex flex-col items-center text-center sm:items-start sm:text-left">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Shop by Category
            </h2>
          </div>
          <div className="hidden sm:flex">
            <Link href="/categories" className={buttonVariants({ variant: "outline", className: "rounded-full px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900" })}>
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
        <Link href="/categories" className={buttonVariants({ variant: "outline", className: "mt-4 w-full sm:hidden rounded-full h-10 border-slate-300 dark:border-slate-800 font-semibold" })}>
          View All Categories
        </Link>
      </section>

      {/* Trending Products */}
      <section className="container mx-auto px-4 mt-4 sm:mt-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Trending Now
            </h2>
          </div>
          <div className="hidden sm:flex">
            <Link href="/products?sort=trending" className={buttonVariants({ variant: "ghost", className: "rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" })}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 pb-4 sm:grid sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 sm:overflow-visible sm:pb-0 no-scrollbar">
          {featuredProducts.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[140px] sm:w-auto flex flex-col [&>div]:flex-1 [&>div]:w-full">
              <ProductCard {...product} />
            </div>
          ))}
          {featuredProducts.length === 0 && (
            <p className="text-slate-500 text-sm py-4">No trending products available.</p>
          )}
        </div>
        <Link href="/products?sort=trending" className={buttonVariants({ variant: "outline", className: "mt-4 w-full sm:hidden rounded-full h-10 border-slate-300 dark:border-slate-800 font-semibold" })}>
          View All Products
        </Link>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4">
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
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              End of Season Sale
            </h2>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Get up to 50% off on selected items. Don't miss out on these exclusive deals available for a limited time only.
            </p>
            <div className="mt-8">
              <Link href="/deals" className={buttonVariants({ size: "lg", variant: "secondary", className: "h-12 px-8 font-semibold" })}>
                Shop the Sale
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
