"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductDetail, ProductVariant } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { ProductImageUploader, StagedImage } from "@/components/catalog/product-image-uploader";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Layers, Sparkles,
  Package, Plus, Trash2, Tag, Lock, Save, FileText, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState<"BASIC" | "VARIANTS" | "INVENTORY">("BASIC");

  const [product, setProduct] = useState<ProductDetail | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [customSpecifications, setCustomSpecifications] = useState<{ key: string; value: string }[]>([]);
  
  // Single SKU (Simple Product)
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");

  // Configurable Variants (and hold for Inventory tab)
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Images
  const [images, setImages] = useState<StagedImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inventory UI
  const [adjustingVariantId, setAdjustingVariantId] = useState<string | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>("");
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [stockUpdating, setStockUpdating] = useState<boolean>(false);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    catalogService.getSellerProductDetail(productId).then((prod: ProductDetail) => {
      setProduct(prod);
      setTitle(prod.title);
      setShortDescription(prod.short_description || "");
      setDescription(prod.description || "");
      
      const customSpecsArr = Object.entries(prod.custom_specifications || {}).map(([key, value]) => ({ key, value: String(value) }));
      setCustomSpecifications(customSpecsArr);

      if (prod.product_type === "SIMPLE" && prod.variants.length > 0) {
        setPrice(prod.variants[0].price.toString());
        if (prod.variants[0].compare_at_price) setCompareAtPrice(prod.variants[0].compare_at_price.toString());
      }
      // Always store variants in state for the inventory tab
      setVariants(prod.variants);

      const loadedImages: StagedImage[] = prod.images.map((img: any) => ({
        id: img.id,
        previewUrl: img.image_url,
        file: null,
        isPrimary: img.is_primary,
      }));
      setImages(loadedImages);
      
      const primImg = prod.images.find((i: any) => i.is_primary);
      if (primImg) setPrimaryImageId(primImg.id);
      
    }).catch((err: any) => {
      setErrorMsg("Failed to load product details.");
      console.error(err);
    }).finally(() => setDataLoading(false));
  }, [productId]);

  const addCustomSpec = () => setCustomSpecifications((prev) => [...prev, { key: "", value: "" }]);
  const updateCustomSpec = (index: number, field: "key" | "value", val: string) => {
    setCustomSpecifications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };
  const removeCustomSpec = (index: number) => setCustomSpecifications((prev) => prev.filter((_, i) => i !== index));

  const handleVariantChange = (index: number, field: "price" | "compare_at_price", value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      if (field === "price") next[index].price = value as any;
      if (field === "compare_at_price") next[index].compare_at_price = value as any;
      return next;
    });
  };

  const handleImageChange = (newImages: StagedImage[]) => {
    const newDeletions = images.filter(oldImg => oldImg.id && !newImages.find(ni => ni.id === oldImg.id)).map(i => i.id as string);
    setDeletedImages(prev => [...prev, ...newDeletions]);
    
    const primImg = newImages.find(i => i.isPrimary && i.id);
    if (primImg && primImg.id) setPrimaryImageId(primImg.id);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true); setErrorMsg(null);
    try {
      const customSpecsObj: Record<string, string> = {};
      customSpecifications.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) customSpecsObj[key.trim()] = value.trim();
      });

      let variantsData;
      if (product.product_type === "SIMPLE") {
        variantsData = [{ id: product.variants[0].id, price: Number(price), compare_at_price: compareAtPrice ? Number(compareAtPrice) : undefined }];
      } else {
        variantsData = variants.map(v => ({ id: v.id, price: Number(v.price), compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined }));
      }

      await catalogService.updateProduct(product.id, {
        title: title.trim(),
        short_description: shortDescription.trim(),
        description: description.trim(),
        custom_specifications: customSpecsObj,
        variants_data: variantsData,
        delete_images: deletedImages,
        primary_image_id: primaryImageId || undefined,
      });

      // Upload new images
      const newImages = images.filter(img => img.file);
      for (const img of newImages) {
        if (img.file) await catalogService.uploadProductImage(product.id, img.file, img.isPrimary);
      }

      router.push("/seller/products");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update product listing.");
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (variant: ProductVariant, stockInfo: any) => {
    if (!adjustmentDelta) return;
    const delta = parseInt(adjustmentDelta);
    if (isNaN(delta) || delta === 0) return;

    setStockUpdating(true);
    setStockError(null);

    // Optimistic Update
    const originalVariants = [...variants];
    const newQuantity = stockInfo.quantity_available + delta;

    const applyUpdate = (targetVariants: ProductVariant[]) => targetVariants.map(v => {
      if (v.id === variant.id) {
        return {
          ...v,
          warehouse_stocks: v.warehouse_stocks?.map((ws: any) => 
            ws.warehouse_id === stockInfo.warehouse_id 
              ? { ...ws, quantity_available: newQuantity } 
              : ws
          )
        };
      }
      return v;
    });

    setVariants(applyUpdate(variants));

    try {
      const movementType = "MANUAL_ADJUSTMENT";
      await catalogService.adjustStock({
        variant_id: variant.id,
        warehouse_id: stockInfo.warehouse_id,
        quantity_delta: delta,
        movement_type: movementType,
        notes: adjustmentNotes || undefined
      });
      
      setAdjustingVariantId(null);
      setAdjustmentDelta("");
      setAdjustmentNotes("");
    } catch (err: any) {
      // Rollback
      setVariants(originalVariants);
      setStockError(err.message || "Failed to adjust stock. Check constraints.");
    } finally {
      setStockUpdating(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!product) {
    return <div className="text-center py-20 text-rose-500 font-bold">Product not found.</div>;
  }

  const isLocked = product.status === "PENDING_REVIEW";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/seller/products"
            className="p-3 bg-white/60 backdrop-blur-md dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-200 shadow-sm group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                Edit Listing
              </h1>
              {isLocked && (
                <div className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-rose-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pending Review</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">{product.title}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab("BASIC")}
          className={cn("flex-1 px-5 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2", 
            activeTab === "BASIC" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800")}
        >
          <Layers className="w-4 h-4" /> Basic Info &amp; Media
        </button>
        <button
          onClick={() => setActiveTab("VARIANTS")}
          className={cn("flex-1 px-5 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2", 
            activeTab === "VARIANTS" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800")}
        >
          <Tag className="w-4 h-4" /> Pricing Matrix
        </button>
        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={cn("flex-1 px-5 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2", 
            activeTab === "INVENTORY" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800")}
        >
          <Package className="w-4 h-4" /> Inventory Manager
        </button>
      </div>

      <div className="relative">
        {/* Overlay for locked state */}
        {isLocked && activeTab !== "INVENTORY" && (
          <div className="absolute inset-0 z-10 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl max-w-sm text-center border border-slate-100 dark:border-slate-800 flex flex-col items-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Listing Locked</h3>
              <p className="text-sm text-slate-500 font-medium">This product is currently under moderation review. Core content cannot be edited until approved.</p>
              <p className="text-xs text-indigo-600 font-bold mt-4 bg-indigo-50 px-3 py-2 rounded-xl">Inventory adjustments are still permitted.</p>
            </div>
          </div>
        )}

        <div className={cn("transition-opacity", isLocked && activeTab !== "INVENTORY" ? "opacity-30 pointer-events-none select-none" : "opacity-100")}>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {activeTab === "BASIC" && (
              <div className="space-y-8">
                {/* General Details Section */}
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Details</h2>
                      <p className="text-xs text-slate-500">Core information about your product.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Product Title</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLocked}
                        className="w-full text-sm px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Short Description</label>
                      <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} disabled={isLocked}
                        className="w-full text-sm px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Detailed Description</label>
                      <textarea rows={5} required value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLocked}
                        className="w-full text-sm p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium resize-none" />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Custom Specifications</label>
                          <p className="text-xs text-slate-500">Add key-value pairs for extra details.</p>
                        </div>
                        {!isLocked && (
                          <button type="button" onClick={addCustomSpec} className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
                            <Plus className="w-4 h-4" /> Add Spec
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {customSpecifications.map((spec, i) => (
                          <div key={i} className="flex gap-3 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                            <input type="text" placeholder="Key (e.g. Material)" value={spec.key} onChange={(e) => updateCustomSpec(i, "key", e.target.value)} disabled={isLocked}
                              className="w-2/5 text-sm px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                            <input type="text" placeholder="Value (e.g. Cotton)" value={spec.value} onChange={(e) => updateCustomSpec(i, "value", e.target.value)} disabled={isLocked}
                              className="flex-1 text-sm px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                            {!isLocked && (
                              <button type="button" onClick={() => removeCustomSpec(i)} className="p-2.5 text-rose-500 hover:text-white hover:bg-rose-500 bg-white border border-rose-100 rounded-xl transition-colors shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {customSpecifications.length === 0 && (
                          <div className="text-center py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-sm text-slate-400 font-medium">No custom specifications added.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Media</h2>
                      <p className="text-xs text-slate-500">Upload high-quality images for your product.</p>
                    </div>
                  </div>
                  <ProductImageUploader images={images} onChange={handleImageChange} />
                </div>
              </div>
            )}

            {activeTab === "VARIANTS" && (
              <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pricing Matrix</h2>
                    <p className="text-xs text-slate-500">Set competitive pricing for your variants.</p>
                  </div>
                </div>

                {product.product_type === "SIMPLE" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Selling Price (ETB)</label>
                      <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full text-lg px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-700 dark:text-indigo-400 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Compare-at Price (ETB)</label>
                      <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)}
                        className="w-full text-lg px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-500 line-through shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Variant (SKU)</th>
                          <th className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Attributes</th>
                          <th className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Price (ETB)</th>
                          <th className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Compare-at (ETB)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {variants.map((v, idx) => (
                          <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{v.sku}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {v.attribute_values.map((av: any, i: number) => (
                                  <span key={i} className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                    {av.attribute_name || av.attribute?.name || av.name || 'Opt'}: {av.value}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <input type="number" value={v.price} onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                                className="w-28 text-sm px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 dark:text-white" />
                            </td>
                            <td className="px-5 py-4">
                              <input type="number" value={v.compare_at_price || ""} onChange={(e) => handleVariantChange(idx, "compare_at_price", e.target.value)}
                                className="w-28 text-sm px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-500 line-through" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab !== "INVENTORY" && (
              <div className="flex justify-end gap-3 pt-6">
                <Link href="/seller/products"
                  className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                  Discard Changes
                </Link>
                <button type="submit" disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 transform active:scale-[0.98]">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Listing</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* INVENTORY TAB is outside the form and not locked */}
        {activeTab === "INVENTORY" && (
          <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inventory Ledger</h2>
                <p className="text-xs text-slate-500">Live stock adjustments across warehouses.</p>
              </div>
            </div>

            {stockError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{stockError}</span>
              </div>
            )}

            <div className="space-y-6">
              {variants.map(variant => (
                <div key={variant.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                  {/* Variant Header */}
                  <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-slate-800 dark:text-white">{variant.sku}</span>
                        {variant.attribute_values.length > 0 && (
                          <div className="flex gap-1.5">
                            {variant.attribute_values.map((av: any, i: number) => (
                              <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded-md">
                                {av.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warehouses for this variant */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {variant.warehouse_stocks?.map((ws: any) => (
                      <div key={ws.warehouse_id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors">
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ws.warehouse_name || "Primary Warehouse"}</p>
                            <p className="text-xs text-slate-500 font-medium">Available: <span className={cn("font-black text-sm ml-1", ws.quantity_available > 10 ? "text-emerald-600" : ws.quantity_available > 0 ? "text-amber-500" : "text-rose-500")}>{ws.quantity_available} units</span></p>
                          </div>
                        </div>

                        {/* Inline Adjustment Tool */}
                        <div className="flex items-start lg:items-center gap-3">
                          {adjustingVariantId === `${variant.id}-${ws.warehouse_id}` ? (
                            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 w-full sm:w-auto">
                              <input 
                                type="number" 
                                placeholder="+/- Qty" 
                                value={adjustmentDelta}
                                onChange={(e) => setAdjustmentDelta(e.target.value)}
                                className="w-24 text-sm font-black px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:font-medium placeholder:text-xs"
                                autoFocus
                              />
                              <input 
                                type="text" 
                                placeholder="Note (Optional)" 
                                value={adjustmentNotes}
                                onChange={(e) => setAdjustmentNotes(e.target.value)}
                                className="w-40 text-sm px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:font-medium placeholder:text-xs"
                              />
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                  onClick={() => handleStockAdjustment(variant, ws)}
                                  disabled={stockUpdating || !adjustmentDelta || isNaN(parseInt(adjustmentDelta))}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                                >
                                  {stockUpdating ? "..." : "Save"}
                                </button>
                                <button 
                                  onClick={() => { setAdjustingVariantId(null); setAdjustmentDelta(""); setAdjustmentNotes(""); setStockError(null); }}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAdjustingVariantId(`${variant.id}-${ws.warehouse_id}`)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adjust Stock
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                    {(!variant.warehouse_stocks || variant.warehouse_stocks.length === 0) && (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No warehouse data available for this variant.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
