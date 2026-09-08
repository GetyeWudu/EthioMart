"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { CartItem as CartItemType, useCartStore } from "@/stores/cart-store";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity?: (quantity: number) => void;
  onRemove?: () => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { id, quantity, variant_details } = item;
  const { updateItemVariant } = useCartStore();
  const [isUpdatingVariant, setIsUpdatingVariant] = useState(false);

  const product = variant_details?.product;
  
  const name = product?.title || 'Unknown Product';
  const slug = product?.slug || '#';
  const price = parseFloat(variant_details?.price || '0');
  const image = product?.images?.[0]?.image_url || "/placeholder.svg";
  const category = product?.category_name || "Uncategorized";

  // Use real stock from backend variant details
  const stock = (variant_details as any)?.stock ?? 0;
  const inStock = stock > 0;

  const hasMultipleVariants = (product?.variants?.length || 0) > 1;

  // Compute available dimensions grouped by attribute name (e.g. { Color: ["Red", "Blue"], Size: ["S", "M", "L"] })
  const dimensionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const variants = product?.variants || [];
    variants.forEach((v) => {
      v.attribute_values?.forEach((av) => {
        if (!groups[av.attribute_name]) {
          groups[av.attribute_name] = [];
        }
        if (!groups[av.attribute_name].includes(av.value)) {
          groups[av.attribute_name].push(av.value);
        }
      });
    });
    return groups;
  }, [product?.variants]);

  // Current selected attribute values mapping: { Color: "Red", Size: "M" }
  const currentDimensions = useMemo(() => {
    const dims: Record<string, string> = {};
    variant_details?.attribute_values?.forEach((av) => {
      dims[av.attribute_name] = av.value;
    });
    return dims;
  }, [variant_details?.attribute_values]);

  const handleDimensionChange = async (attrName: string, newValue: string) => {
    if (currentDimensions[attrName] === newValue) return;

    const nextDimensions = { ...currentDimensions, [attrName]: newValue };
    const variants = product?.variants || [];

    // Find a variant that matches all nextDimensions
    let matched = variants.find((v) =>
      v.attribute_values?.every((av) => nextDimensions[av.attribute_name] === av.value)
    );

    // If exact combination doesn't exist, fall back to any variant having this new attribute value
    if (!matched) {
      matched = variants.find((v) =>
        v.attribute_values?.some((av) => av.attribute_name === attrName && av.value === newValue)
      );
    }

    if (matched && matched.id !== (variant_details?.id || item.variant)) {
      setIsUpdatingVariant(true);
      try {
        await updateItemVariant(item.id, matched.id, quantity, item.selected_facility);
        toast.success("Option updated");
      } catch (err: any) {
        toast.error(err?.message || "Failed to update option");
      } finally {
        setIsUpdatingVariant(false);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      {/* Product Thumbnail */}
      <Link href={`/products/${slug}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 object-contain shrink-0 overflow-hidden border border-slate-100 dark:border-slate-800/60">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-1"
          sizes="(max-width: 640px) 96px, 112px"
        />
      </Link>

      {/* Product Info & Controls */}
      <div className="flex flex-col flex-1">
        {/* Header Row: Title, Vendor, Delete */}
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <Link href={`/products/${slug}`}>
              <h3 className="font-semibold text-slate-900 dark:text-white hover:text-[#1261C9] dark:hover:text-blue-400 transition-colors text-base line-clamp-2">
                {name}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {category} &middot; Sold by <span className="font-medium text-slate-700 dark:text-slate-300">{(product as any)?.vendor_name || "EthioMart"}</span>
            </p>
          </div>
          <button
            onClick={() => onRemove && onRemove()}
            className="text-slate-400 hover:text-rose-500 p-1.5 -mr-1.5 -mt-1.5 rounded-md transition-colors shrink-0"
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </button>
        </div>

        {/* Attribute Dimensions: Inline dropdowns horizontally aligned without static labels */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {hasMultipleVariants && Object.keys(dimensionGroups).length > 0 ? (
            Object.entries(dimensionGroups).map(([attrName, values]) => (
              <div key={attrName} className="relative inline-flex items-center">
                <select
                  value={currentDimensions[attrName] || ""}
                  onChange={(e) => handleDimensionChange(attrName, e.target.value)}
                  disabled={isUpdatingVariant}
                  className="appearance-none text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1261C9]/30 focus:border-[#1261C9] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  {values.map((val) => (
                    <option key={val} value={val} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                      {attrName}: {val}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            ))
          ) : hasMultipleVariants ? (
            <div className="relative inline-flex items-center">
              <select
                value={variant_details?.id || item.variant}
                onChange={(e) => {
                  const newId = e.target.value;
                  if (newId && newId !== (variant_details?.id || item.variant)) {
                    setIsUpdatingVariant(true);
                    updateItemVariant(item.id, newId, quantity, item.selected_facility)
                      .then(() => toast.success("Option updated"))
                      .catch((err: any) => toast.error(err?.message || "Failed to update option"))
                      .finally(() => setIsUpdatingVariant(false));
                  }
                }}
                disabled={isUpdatingVariant}
                className="appearance-none text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1261C9]/30 focus:border-[#1261C9] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                {product?.variants?.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                    {v.sku || "Option"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>
          ) : (
            variant_details?.attribute_values && variant_details.attribute_values.map((av, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {av.attribute_name}: {av.value}
              </span>
            ))
          )}

          {isUpdatingVariant && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1261C9]" />
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold rounded-md ${inStock ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {inStock ? `In Stock · ${(item.facility_details as any)?.name || 'Default Warehouse'}` : "Out of stock"}
          </span>
        </div>

        {/* Operational Bottom Row */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          {/* Unit Price */}
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            ETB {price.toLocaleString()} <span className="text-xs font-normal">/ unit</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Quantity Stepper */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs overflow-hidden h-9 w-[110px]">
              <button
                onClick={() => onUpdateQuantity && quantity > 1 && onUpdateQuantity(quantity - 1)}
                disabled={quantity <= 1}
                className="w-9 h-full flex items-center justify-center text-slate-500 hover:text-[#1261C9] dark:hover:text-blue-400 hover:bg-[#1261C9]/5 transition-colors disabled:opacity-50"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-[13px] font-bold text-slate-900 dark:text-white border-x border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {quantity}
              </div>
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(quantity + 1)}
                disabled={quantity >= stock}
                className="w-9 h-full flex items-center justify-center text-slate-500 hover:text-[#1261C9] dark:hover:text-blue-400 hover:bg-[#1261C9]/5 transition-colors disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Line Item Total */}
            <div className="font-bold text-slate-900 dark:text-white text-lg tracking-tight min-w-[120px] text-right font-serif">
              ETB {(price * quantity).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
