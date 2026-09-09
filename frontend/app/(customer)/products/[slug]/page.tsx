"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { catalogService } from "@/features/products/services/catalog-service";
import { ProductDetail, ProductVariant } from "@/features/products/types";
import {
  ChevronRight, ChevronLeft, Home, CheckCircle2, ShieldCheck, Truck,
  Building2, Share2, Heart, Bell, Sparkles, AlertTriangle, MapPin,
  Clock, Minus, Plus, ShoppingCart, Zap, Store, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getImageUrl } from "@/lib/api";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductCard } from "@/components/customer/product-card";

const TRUST_TIER_CONFIG = {
  VIP: { label: "VIP Seller", className: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" },
  TRUSTED: { label: "Trusted Seller", className: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" },
  PROBATION: { label: "New Seller", className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const { isSuspended } = useCurrentUser();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [attrName: string]: string }>({});
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "description" | "merchant" | "reviews">("specs");
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  const [recommendations, setRecommendations] = useState<{ similar_items: any[]; store_items: any[] }>({
    similar_items: [],
    store_items: [],
  });

  useEffect(() => {
    setLoading(true);
    catalogService.getProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        if (data.images?.length > 0) {
          setSelectedImage(data.images[0].image_url || data.images[0].image);
          setActiveImageIndex(0);
        }
        if (data.variants?.length > 0) {
          const skuParam = searchParams.get("sku");
          const defaultVar = (skuParam ? data.variants.find((v) => v.sku === skuParam) : null) ||
            data.variants.find((v) => v.is_default) || data.variants[0];
          setSelectedVariant(defaultVar);
          const initialOpts: { [key: string]: string } = {};
          defaultVar.attribute_values?.forEach((av: any) => {
            initialOpts[av.attribute_name || "Option"] = av.value;
          });
          setSelectedOptions(initialOpts);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Fetch unified recommendations
    catalogService.getProductRecommendations(slug)
      .then((recs) => {
        const mapItem = (p: any) => {
          const minPrice = Number(p.min_price || 0);
          const maxPrice = Number(p.max_price || 0);
          const effectivePrice = Number(p.effective_price ?? minPrice);
          const originalPrice = Number(p.original_price ?? maxPrice);
          const discountPercentage =
            Number(p.discount_percentage) ||
            (originalPrice > effectivePrice && originalPrice > 0
              ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
              : undefined);
          return {
            id: p.id,
            name: p.title,
            slug: p.slug,
            price: effectivePrice,
            originalPrice: originalPrice > effectivePrice ? originalPrice : undefined,
            rating: Number(p.avg_rating || 0),
            reviewsCount: Number(p.review_count || 0),
            image: p.primary_image || "/placeholder.svg",
            isNew: false,
            discountPercentage: discountPercentage && discountPercentage > 0 ? discountPercentage : undefined,
            promotionBadge: p.promotion_badge || undefined,
            defaultVariantId: p.default_variant_id,
            hasVariants: p.product_type === "CONFIGURABLE_VARIANT" || (Array.isArray(p.variants) && p.variants.length > 1),
            vendorLocation: p.vendor_location,
          };
        };

        setRecommendations({
          similar_items: (recs.similar_items || []).map(mapItem),
          store_items: (recs.store_items || []).map(mapItem),
        });
      })
      .catch((err) => console.error("Failed to load recommendations:", err));
  }, [slug, searchParams]);

  interface AttributeOption {
    id: string;
    value: string;
    color_code?: string;
  }

  interface DimensionGroup {
    name: string;
    options: AttributeOption[];
  }

  const dimensionGroups = React.useMemo<DimensionGroup[]>(() => {
    const groupMap: Record<string, Map<string, AttributeOption>> = {};

    product?.variants?.forEach((variant) => {
      variant.attribute_values?.forEach((av: any) => {
        const attrName = av.attribute_name || 'Option';
        if (!groupMap[attrName]) {
          groupMap[attrName] = new Map();
        }
        if (!groupMap[attrName].has(av.value)) {
          groupMap[attrName].set(av.value, {
            id: av.id,
            value: av.value,
            color_code: av.color_code,
          });
        }
      });
    });

    return Object.entries(groupMap).map(([name, optMap]) => ({
      name,
      options: Array.from(optMap.values()),
    }));
  }, [product?.variants]);

  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product?.variants?.length && dimensionGroups.length > 0) {
      const firstVariant = product.variants[0];
      const initial: Record<string, string> = {};
      firstVariant.attribute_values?.forEach((av: any) => {
        initial[av.attribute_name || 'Option'] = av.value;
      });
      setSelectedDimensions(initial);
    }
  }, [product?.variants, dimensionGroups]);

  const activeVariant = React.useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) =>
      v.attribute_values?.every(
        (av: any) => selectedDimensions[av.attribute_name || 'Option'] === av.value
      )
    ) || product.variants[0];
  }, [product?.variants, selectedDimensions]);

  const handleSelectOption = (attrName: string, value: string) => {
    setSelectedDimensions((prev) => ({ ...prev, [attrName]: value }));
  };

  const isVariantOOS = (attrName: string, value: string) => {
    if (!product?.variants) return false;
    const nextOptions = { ...selectedDimensions, [attrName]: value };
    const matched = product.variants.find((v) =>
      v.attribute_values?.every((av: any) => {
        const aName = av.attribute_name || "Option";
        return nextOptions[aName] === undefined || nextOptions[aName] === av.value;
      })
    );
    if (!matched) return false;
    const totalStock = matched.warehouse_stocks?.reduce((sum, ws) => sum + ws.quantity_available, 0) ?? matched.total_available_stock ?? 0;
    return totalStock <= 0;
  };

  const handleImageSelect = (image: string, index: number) => {
    setSelectedImage(image);
    setActiveImageIndex(index);
  };

  const handlePrevImage = () => {
    if (!product?.images?.length) return;
    const newIdx = (activeImageIndex - 1 + product.images.length) % product.images.length;
    setSelectedImage(product.images[newIdx].image);
    setActiveImageIndex(newIdx);
  };

  const handleNextImage = () => {
    if (!product?.images?.length) return;
    const newIdx = (activeImageIndex + 1) % product.images.length;
    setSelectedImage(product.images[newIdx].image);
    setActiveImageIndex(newIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setZoomPos({ x: 50, y: 50 });
  };

  const totalAvailableStock = React.useMemo(() => {
    if (activeVariant?.warehouse_stocks?.length) {
      return activeVariant.warehouse_stocks.reduce((sum, ws) => sum + ws.quantity_available, 0);
    }
    return activeVariant?.total_available_stock ?? product?.total_available_stock ?? 0;
  }, [activeVariant, product]);

  const isOutOfStock = totalAvailableStock <= 0;
  const isLowStock = !isOutOfStock && totalAvailableStock <= 5;
  
  // Calculate dynamic pricing using Promotion Engine fields
  const baseVariantPrice = activeVariant?.price ? Number(activeVariant.price) : Number(product?.original_price ?? product?.min_price ?? 0);
  const autoDiscountPct = Number(product?.discount_percentage || 0);
  
  const currentPrice = autoDiscountPct > 0 ? baseVariantPrice * (1 - autoDiscountPct / 100) : (Number(product?.effective_price) || baseVariantPrice);
  const currentCompareAt = autoDiscountPct > 0 ? baseVariantPrice : (activeVariant?.compare_at_price ? Number(activeVariant.compare_at_price) : Number(product?.compare_at_price || 0));
  
  const discountPct = autoDiscountPct > 0 ? autoDiscountPct : (currentCompareAt > currentPrice ? Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100) : 0);
  const promoBadge = product?.promotion_badge;

  const handleAddToCart = async () => {
    if (!activeVariant?.id) {
      toast.error("Please select a variant to add to cart.");
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(activeVariant.id, quantity);
      toast.success("Added to cart!", { description: `${product?.title} — Qty ${quantity}` });
    } catch (err: any) {
      let msg = "Failed to add to cart. Please try again.";
      if (err.message && typeof err.message === "string") {
        msg = err.message;
      } else if (err.data?.detail && typeof err.data.detail === "string") {
        msg = err.data.detail;
      }
      toast.error(msg);
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: string | number) =>
    `ETB ${Number(price).toLocaleString("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Combine structured specs and custom_specifications for the Specs tab
  const allSpecs = React.useMemo(() => {
    const rows: { key: string; value: string }[] = [];
    if (product?.specifications?.length) {
      product.specifications.forEach((s) => rows.push({ key: s.attribute_name, value: `${s.value}${s.unit ? ` ${s.unit}` : ""}` }));
    }
    if (product?.custom_specifications) {
      Object.entries(product.custom_specifications).forEach(([k, v]) => rows.push({ key: k, value: v }));
    }
    return rows;
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading catalog specs & warehouse inventory...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black mb-4 text-slate-900 dark:text-white">Product Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
          We couldn't find <span className="font-mono font-bold text-slate-700 dark:text-slate-300">"{slug}"</span>. It may have been archived or is pending compliance approval.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-md">
          <Home className="h-4 w-4" /> Return to Storefront
        </Link>
      </div>
    );
  }

  const tierConfig = TRUST_TIER_CONFIG[product.vendor?.tier || "PROBATION"];
  const pickupHubs = activeVariant?.warehouse_stocks?.filter((ws) => ws.is_pickup_point) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        <Link href="/" className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">
          <Home className="h-3.5 w-3.5" /><span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
        <Link href="/categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">Categories</Link>
        {product.category?.breadcrumbs?.map((bc, i) => (
          <React.Fragment key={i}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <Link href={`/products?category=${bc.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">{bc.name}</Link>
          </React.Fragment>
        ))}
        {product.category && !product.category.breadcrumbs?.some((b: any) => b.slug === product.category.slug) && (
          <React.Fragment>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">{product.category.name}</Link>
          </React.Fragment>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
        <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* ═══════════════════════════════ MAIN PDP GRID ═══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">

        {/* ────────────── LEFT: GALLERY (7 cols) ────────────── */}
        <div className="lg:col-span-7">
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Vertical Thumbnail Rail (desktop) */}
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[560px] md:w-[72px] shrink-0 pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleImageSelect(img.image_url || img.image, i)}
                    className={cn(
                      "w-[72px] h-[72px] aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 dark:bg-slate-800",
                      activeImageIndex === i
                        ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                    )}
                  >
                    <img
                      src={getImageUrl(img.image_url || img.image, product.id + i)}
                      alt={img.alt_text || `View ${i + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                        (e.target as HTMLImageElement).onerror = null;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Viewport with full directional pan & zoom */}
            <div
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative flex-1 aspect-square max-h-[560px] rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group cursor-crosshair select-none"
            >
              <img
                src={getImageUrl(selectedImage || null, product.id)}
                alt={product.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                  (e.target as HTMLImageElement).onerror = null;
                }}
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isZoomed ? "scale(2.2)" : "scale(1)",
                }}
                className={cn(
                  "w-full h-full object-cover object-center pointer-events-none will-change-transform",
                  isZoomed ? "transition-transform duration-75 ease-out" : "transition-transform duration-300 ease-out"
                )}
              />

              {/* Discount & Brand badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none z-10">
                {product.brand?.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Verified Brand
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                    Save {discountPct}%
                  </span>
                )}
              </div>

              {/* Prev / Next Controls */}
              {product.images && product.images.length > 1 && (
                <>
                  <button onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100 z-10">
                    <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                  <button onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100 z-10">
                    <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                  {/* Indicator dots (mobile) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
                    {product.images.map((img, i) => (
                      <button key={i} onClick={() => handleImageSelect(img.image_url || img.image, i)}
                        className={cn("w-1.5 h-1.5 rounded-full transition-all", i === activeImageIndex ? "bg-indigo-600 w-4" : "bg-white/60")} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ────────────── RIGHT: STICKY PURCHASE HUB (5 cols) ────────────── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 h-fit">
          {/* Vendor & Trust */}
          <div className="flex items-center justify-between gap-3">
            <Link href={`/vendors/${product.vendor?.slug || "#"}`}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <Store className="w-4 h-4 text-indigo-500" />
              {product.vendor?.store_name}
            </Link>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border", tierConfig.className)}>
              <CheckCircle2 className="w-3 h-3" /> {tierConfig.label}
            </span>
          </div>

          {/* Brand */}
          {product.brand && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{product.brand.name}</span>
              {product.brand.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </div>
          )}

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {product.title}
          </h1>

          {/* Price Block */}
          <div className="space-y-2">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatPrice(currentPrice)}
              </span>
              {currentCompareAt > currentPrice && (
                <span className="text-base text-slate-400 line-through font-medium">{formatPrice(currentCompareAt)}</span>
              )}
              {promoBadge ? (
                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1">
                  🏷️ {promoBadge} {discountPct > 0 ? `(-${discountPct}%)` : ''}
                </span>
              ) : discountPct > 0 ? (
                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1">
                  🔥 Save {discountPct}%
                </span>
              ) : null}
            </div>

            {/* Scarcity / Out of Stock Badge */}
            {isOutOfStock ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl shadow-sm">
                <span className="text-xs">🔴</span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Out of Stock — Join waitlist</span>
              </div>
            ) : isLowStock ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl shadow-sm">
                <span className="text-xs">🟠</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Low Stock · Only {totalAvailableStock} left</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl shadow-sm">
                <span className="text-xs">🟢</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">In Stock · {totalAvailableStock} units available</span>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Variant Dimension Selectors */}
          {dimensionGroups.map((group) => {
            const attrName = group.name;
            const options = group.options;
            
            return (
              <div key={attrName} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {attrName}
                </label>
                <div className="relative max-w-[250px] mt-1">
                  <select
                    value={selectedDimensions[attrName] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      
                      // Check if the selected option is available given CURRENT other dimensions
                      const isAvailable = product?.variants?.some((v) => {
                        const vStock = v.warehouse_stocks?.reduce((s, ws) => s + ws.quantity_available, 0) ?? v.total_available_stock ?? 0;
                        if (vStock <= 0) return false;
                        
                        return v.attribute_values?.every((av: any) => {
                          const aName = av.attribute_name || "Option";
                          if (aName === attrName) return av.value === val;
                          return selectedDimensions[aName] === av.value;
                        });
                      }) ?? false;

                      if (isAvailable) {
                        handleSelectOption(attrName, val);
                      } else {
                        // Smart fallback: Auto-switch other dimensions to make this option valid
                        const validVariant = product?.variants?.find((v) => {
                          const vStock = v.warehouse_stocks?.reduce((s, ws) => s + ws.quantity_available, 0) ?? v.total_available_stock ?? 0;
                          return vStock > 0 && v.attribute_values?.some((av: any) => (av.attribute_name || "Option") === attrName && av.value === val);
                        });
                        
                        if (validVariant) {
                          const newDimensions: Record<string, string> = {};
                          validVariant.attribute_values?.forEach((av: any) => {
                            newDimensions[av.attribute_name || "Option"] = av.value;
                          });
                          setSelectedDimensions(newDimensions);
                          toast.info(`Auto-switched to available combination for ${val}`);
                        } else {
                          // Truly out of stock everywhere for this option
                          handleSelectOption(attrName, val);
                          setWaitlistModalOpen(true);
                        }
                      }
                    }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full cursor-pointer appearance-none shadow-sm transition-all"
                  >
                    {options.map((opt) => {
                      // Check if it's available with current selections
                      const isAvailable = product?.variants?.some((v) => {
                        const vStock = v.warehouse_stocks?.reduce((s, ws) => s + ws.quantity_available, 0) ?? v.total_available_stock ?? 0;
                        if (vStock <= 0) return false;
                        return v.attribute_values?.every((av: any) => {
                          const aName = av.attribute_name || "Option";
                          if (aName === attrName) return av.value === opt.value;
                          return selectedDimensions[aName] === av.value;
                        });
                      }) ?? false;

                      // Check if it's completely out of stock everywhere
                      const completelyOOS = !product?.variants?.some((v) => {
                        const vStock = v.warehouse_stocks?.reduce((s, ws) => s + ws.quantity_available, 0) ?? v.total_available_stock ?? 0;
                        return vStock > 0 && v.attribute_values?.some((av: any) => (av.attribute_name || "Option") === attrName && av.value === opt.value);
                      });

                      const labelSuffix = completelyOOS ? " (Out of Stock)" : !isAvailable ? " (Auto-switch)" : "";

                      return (
                        <option key={opt.value} value={opt.value}>
                          {opt.value}{labelSuffix}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quantity Stepper */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity</span>
              <div className="flex items-center gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(totalAvailableStock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            {isOutOfStock ? (
              <button type="button" onClick={() => setWaitlistModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm">
                <Bell className="w-4 h-4" /> Notify Me When Restocked
              </button>
            ) : isSuspended ? (
              <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  Purchasing Suspended
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                  Your purchasing privileges are suspended. Contact support to appeal.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || isOutOfStock || !activeVariant}
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/20"
                >
                  {addingToCart ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" /> 
                      {!activeVariant ? "Combination Unavailable" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </>
                  )}
                </button>
                <button type="button"
                  className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Zap className="w-4 h-4" /> Buy Now
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => { setIsWishlisted((w) => !w); toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist"); }}
                className={cn("flex-1 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                  isWishlisted ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600" : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400")}>
                <Heart className={cn("w-4 h-4 transition-all", isWishlisted && "fill-rose-500 text-rose-500")} />
                {isWishlisted ? "Saved" : "Wishlist"}
              </button>
              <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 text-xs font-bold flex items-center justify-center gap-2 transition-all">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          {/* Fulfillment & Click-and-Collect Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Doorstep Delivery</span>
                <span className="ml-1">— Addis Ababa: 1–3 business days</span>
              </div>
            </div>
            {pickupHubs.length > 0 ? (
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Click &amp; Collect</span>
                  <span className="ml-1">— Ready in 2h at {pickupHubs[0].warehouse_name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Click &amp; Collect</span>
                  <span className="ml-1">— Ready in 2h at Bole Express Hub &amp; Pickup Locker</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
              <span>7-Day Return Policy · Free returns on defective items</span>
            </div>
          </div>

          {/* ── Localized Escrow Trust & Guarantee Reassurance Strip ── */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/10 space-y-2.5 shadow-sm">
            <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Chapa / Telebirr Escrow Protection:</strong> Funds held safely by EthioMart until delivery inspection.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span><strong>48-Hour Inspection & Return Policy:</strong> 100% money-back guarantee if items are defective.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Verified Ethiopian Merchant:</strong> Trade license verified. Fulfilled from {product.vendor?.store_name || "Merchant"}.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ BOTTOM TABS ═══════════════════════════ */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        {/* Tab Nav */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {([
            { key: "specs", label: "Specifications" },
            { key: "description", label: "Description" },
            { key: "merchant", label: "Merchant & Returns" },
            { key: "reviews", label: `Reviews (${product.review_count || 0})` },
          ] as const).map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-6 py-4 text-xs font-bold whitespace-nowrap transition-all border-b-2",
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* ── Specifications Tab ── */}
          {activeTab === "specs" && (
            <div>
              {allSpecs.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No specifications available for this product.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allSpecs.map((spec, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-500 w-1/3 align-top">{spec.key}</td>
                        <td className="px-4 py-3.5 text-slate-900 dark:text-white font-medium align-top">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Description Tab ── */}
          {activeTab === "description" && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
              {product.short_description && (
                <p className="text-base font-semibold text-slate-900 dark:text-white mb-4">{product.short_description}</p>
              )}
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* ── Merchant & Returns Tab ── */}
          {activeTab === "merchant" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {product.vendor?.store_name?.charAt(0) || "S"}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white">{product.vendor?.store_name}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border", tierConfig.className)}>
                      <CheckCircle2 className="w-3 h-3" /> {tierConfig.label}
                    </span>
                    {product.vendor?.city && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3" /> {product.vendor.city}
                      </span>
                    )}
                  </div>
                  <Link href={`/vendors/${product.vendor?.slug || "#"}`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 font-semibold">
                    View all products from this seller <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: RefreshCw, title: "7-Day Returns", desc: "Return within 7 days of delivery for defective or wrong items." },
                  { icon: ShieldCheck, title: "Buyer Protection", desc: "Full refund guarantee if item doesn't match listing description." },
                  { icon: Clock, title: "Dispatch Time", desc: "Orders dispatched within 24 hours on business days." },
                ].map((item) => (
                  <div key={item.title} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <item.icon className="w-5 h-5 text-indigo-500 mb-2" />
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{item.title}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === "reviews" && (
            <ProductReviews 
              productId={product.id} 
              productSlug={product.slug} 
              avgRating={product.avg_rating || 0} 
              reviewCount={product.review_count || 0} 
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════ RECOMMENDATIONS ═══════════════════════════ */}
      {(recommendations.similar_items.length > 0 || recommendations.store_items.length > 0) && (
        <div className="mt-14 sm:mt-20 space-y-12 sm:space-y-16">
          {recommendations.similar_items.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Similar Products You May Like
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customers looking at this item also considered these products.
                  </p>
                </div>
              </div>

              <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {recommendations.similar_items.map((item) => (
                  <div key={item.id} className="snap-start shrink-0 w-[170px] sm:w-[220px] flex flex-col">
                    <ProductCard {...item} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendations.store_items.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    More from {product.vendor?.store_name || "this Store"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bundle items from the same merchant for combined shipping and savings.
                  </p>
                </div>
                <Link
                  href={`/stores/${product.vendor?.slug}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View Store <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {recommendations.store_items.map((item) => (
                  <div key={item.id} className="snap-start shrink-0 w-[170px] sm:w-[220px] flex flex-col">
                    <ProductCard {...item} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ═══════════ Waitlist / Notify Me Modal ═══════════ */}
      {waitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Notify Me When Restocked</h3>
                <p className="text-xs text-slate-500 mt-0.5">We'll SMS you the moment stock is replenished.</p>
              </div>
              <button onClick={() => setWaitlistModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Ethiopia)</label>
                <input type="tel" placeholder="+251 9XX XXX XXX" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button type="button"
                onClick={() => { setWaitlistModalOpen(false); toast.success("You're on the list! We'll notify you via SMS when restocked."); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                <Bell className="w-4 h-4" /> Join Waitlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
