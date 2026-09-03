"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/stores/cart-store";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export interface EditCartItemModalProps {
  item: CartItem;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCartItemModal({ item, isOpen, onClose }: EditCartItemModalProps) {
  const { updateItemVariant } = useCartStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const product = item.variant_details?.product;
  const variants = product?.variants || [];
  
  // Track selected attributes locally
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      item.variant_details?.attribute_values?.forEach(av => {
        initial[av.attribute_name] = av.value;
      });
      setSelectedDimensions(initial);
    }
  }, [isOpen, item.variant_details]);

  // Compute available dimensions grouped by attribute name
  const dimensionGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    variants.forEach(v => {
      v.attribute_values.forEach(av => {
        if (!groups[av.attribute_name]) groups[av.attribute_name] = new Set();
        groups[av.attribute_name].add(av.value);
      });
    });
    return groups;
  }, [variants]);

  // Find the currently selected variant based on selected dimensions
  const selectedVariant = useMemo(() => {
    return variants.find(v => 
      v.attribute_values.every(av => selectedDimensions[av.attribute_name] === av.value)
    );
  }, [variants, selectedDimensions]);

  // Check stock of selected variant
  const stock = selectedVariant 
    ? ((selectedVariant as any).stock ?? (selectedVariant as any).warehouse_stocks?.reduce((s: number, ws: any) => s + ws.quantity_available, 0) ?? (selectedVariant as any).total_available_stock ?? 0)
    : 0;
  const inStock = stock > 0;
  
  // Check if current selection has enough stock for the cart item quantity
  const isSufficientStock = stock >= item.quantity;

  const handleDimensionSelect = (attrName: string, value: string) => {
    let nextDimensions = { ...selectedDimensions, [attrName]: value };
    
    // Check if the combination is completely invalid (no variant exists)
    const exists = variants.some(v => 
      v.attribute_values.every(av => nextDimensions[av.attribute_name] === av.value)
    );

    // If it doesn't exist, we auto-switch other dimensions to make it valid
    if (!exists) {
      const validVariant = variants.find(v => 
        v.attribute_values.some(av => av.attribute_name === attrName && av.value === value)
      );
      
      if (validVariant) {
        const newDimensions: Record<string, string> = {};
        validVariant.attribute_values.forEach(av => {
          newDimensions[av.attribute_name] = av.value;
        });
        nextDimensions = newDimensions;
      }
    }
    
    setSelectedDimensions(nextDimensions);
  };

  const handleUpdate = async () => {
    if (!selectedVariant) return;
    if (selectedVariant.id === item.variant_details.id) {
      // No change
      onClose();
      return;
    }

    setIsUpdating(true);
    try {
      await updateItemVariant(item.id, selectedVariant.id, item.quantity, item.selected_facility);
      toast.success("Cart updated");
      onClose();
    } catch (err) {
      toast.error("Failed to update options");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Edit Options</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
              <Image
                src={product?.images?.[0]?.image_url || "/placeholder.svg"}
                alt={product?.title || "Product"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{product?.title}</h4>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                ETB {parseFloat(selectedVariant?.price || item.variant_details.price).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.entries(dimensionGroups).map(([attrName, optionsSet]) => (
              <div key={attrName} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {attrName}: <span className="font-semibold text-slate-900 dark:text-white">{selectedDimensions[attrName]}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(optionsSet).map(opt => {
                    const isSelected = selectedDimensions[attrName] === opt;
                    // Check availability of this specific option given current OTHER selections
                    const isAvailable = variants.some(v => {
                      const vStock = (v as any).stock ?? (v as any).warehouse_stocks?.reduce((s: number, ws: any) => s + ws.quantity_available, 0) ?? (v as any).total_available_stock ?? 0;
                      if (vStock <= 0) return false;
                      return v.attribute_values.every(av => {
                        if (av.attribute_name === attrName) return av.value === opt;
                        return selectedDimensions[av.attribute_name] === av.value;
                      });
                    });

                    return (
                      <button
                        key={opt}
                        onClick={() => handleDimensionSelect(attrName, opt)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                        } ${!isAvailable && !isSelected ? "opacity-50" : ""}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!inStock && selectedVariant && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>⚠️ Currently Out of Stock at this hub. Please select a different combination.</p>
            </div>
          )}
          
          {inStock && !isSufficientStock && selectedVariant && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>Not enough stock for {item.quantity} items. Only {stock} available.</p>
            </div>
          )}

        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={!selectedVariant || !inStock || !isSufficientStock || isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isUpdating ? "Updating..." : "Update Cart Selection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
