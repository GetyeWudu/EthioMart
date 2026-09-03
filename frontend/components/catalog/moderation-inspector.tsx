"use client";

import React, { useState, useEffect } from "react";
import { ProductListItem, ProductDetail } from "@/features/products/types";
import { 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  Store, Tag, Layers, ImageIcon, Activity, ShieldAlert,
  Truck, Warehouse, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogService } from "@/features/products/services/catalog-service";

interface ModerationInspectorProps {
  product: ProductListItem | ProductDetail;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onClose: () => void;
}

const PROHIBITED_KEYWORDS = [
  "counterfeit", "replica", "fake", "contraband", "clone", "first copy", "pirated", "stolen"
];

function highlightKeywords(text: string): React.ReactNode {
  if (!text) return text;
  const regex = new RegExp(`(${PROHIBITED_KEYWORDS.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    PROHIBITED_KEYWORDS.some((kw) => kw.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-red-100 text-red-700 border border-red-200 px-1 py-0.5 rounded font-bold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ModerationInspector({ product, onApprove, onReject, onClose }: ModerationInspectorProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [detailProduct, setDetailProduct] = useState<ProductDetail | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double scrollbars on body
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    setFetchingDetails(true);
    catalogService.getAdminProductDetail(product.id)
      .then((res) => {
        setDetailProduct(res);
      })
      .catch((err) => {
        console.error("Failed to load product details", err);
        setErrorMsg("Failed to load full product details.");
      })
      .finally(() => {
        setFetchingDetails(false);
      });
  }, [product.id]);

  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onApprove(product.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve product.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      setErrorMsg("Rejection reason must be at least 5 characters.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onReject(product.id, rejectReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reject product.");
    } finally {
      setLoading(false);
    }
  };

  const displayProduct = detailProduct || product;
  const isDetail = !!detailProduct;

  const detectedKeywords = PROHIBITED_KEYWORDS.filter((kw) =>
    `${displayProduct.title} ${detailProduct?.description || ""}`.toLowerCase().includes(kw)
  );

  const vendorName = "vendor" in displayProduct ? displayProduct.vendor.store_name : (displayProduct as any).vendor_name;
  const vendorTier = "vendor" in displayProduct ? displayProduct.vendor.tier : (displayProduct as any).vendor_tier || "PROBATION";
  
  // Computed Checks for Audit Checklist
  const hasImages = isDetail && detailProduct.images && detailProduct.images.length > 0;
  const hasDescription = isDetail && (detailProduct.description?.length || 0) > 20;
  const hasVariants = isDetail && detailProduct.variants && detailProduct.variants.length > 0;
  const isTitleValid = displayProduct.title.length > 5;
  const hasProhibitedKeywords = detectedKeywords.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise Compliance Inspector</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{displayProduct.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 text-slate-900 dark:text-white overflow-y-auto max-h-[calc(100vh-140px)]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Layout for Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Vendor & Trust Profile */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Store className="w-4 h-4" /> Vendor Profile
                </h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">{vendorName}</span>
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md border",
                    vendorTier === "VIP" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    vendorTier === "TRUSTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {vendorTier} TIER
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Platform Risk Score:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Low Risk</span>
                </div>
              </div>

              {/* Media Gallery */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Media Gallery
                </h3>
                {fetchingDetails ? (
                  <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading media assets...</div>
                ) : isDetail ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                    {detailProduct.images.length > 0 ? (
                      detailProduct.images.map((img: any) => (
                        <button 
                          key={img.id} 
                          onClick={() => setPreviewImage(img.image_url || img.image)}
                          className="w-20 h-20 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative bg-slate-100 hover:ring-2 hover:ring-emerald-500 transition-all snap-start"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.image_url || img.image} alt="Product" className="w-full h-full object-cover" />
                          {img.is_primary && (
                            <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-sm">MAIN</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="w-full py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">
                        No images uploaded
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">Failed to load media</div>
                )}
              </div>

              {/* Automated Compliance Checklist */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Automated Audit Checks
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    {isTitleValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    <span className="text-slate-700 dark:text-slate-300">Title Formatting Valid</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {hasDescription ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    <span className="text-slate-700 dark:text-slate-300">Description meets length criteria</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {hasImages ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    <span className="text-slate-700 dark:text-slate-300">Visual media provided</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {!hasProhibitedKeywords ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    <span className={!hasProhibitedKeywords ? "text-slate-700 dark:text-slate-300" : "text-rose-600 font-bold"}>
                      Blacklist Scan {hasProhibitedKeywords ? "Failed" : "Passed"}
                    </span>
                  </div>
                </div>

                {hasProhibitedKeywords && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl mt-3">
                    <p className="text-xs text-rose-700 font-semibold">Detected Keywords: {detectedKeywords.join(", ")}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Catalog Info & Specs */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Catalog &amp; Details
                </h3>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-0.5">Category Tree</span>
                    <span className="font-semibold">{(displayProduct as any).category_name || (displayProduct as any).category?.name || "Uncategorized"}</span>
                  </div>
                  
                  {isDetail && (detailProduct as any).suggested_category && (
                    <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-100">
                            💡 Suggested Category: "{(detailProduct as any).suggested_category}"
                          </span>
                          <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1 mb-2 leading-relaxed">
                            The seller requested a new taxonomy leaf node under this parent.
                          </p>
                          <button type="button" className="w-full flex items-center justify-center gap-1.5 rounded bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-[10px] font-bold text-white transition-colors">
                            <Layers className="w-3 h-3" /> Create Global Category &amp; Re-Map
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isDetail && detailProduct.description && (
                    <div>
                      <span className="block text-slate-500 mb-0.5">Description Extract</span>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {highlightKeywords(detailProduct.description)}
                      </p>
                    </div>
                  )}

                  {isDetail && detailProduct.custom_specifications && Object.keys(detailProduct.custom_specifications).length > 0 && (
                    <div>
                      <span className="block text-slate-500 mb-1">Custom Specifications</span>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(detailProduct.custom_specifications).map(([k, v]) => (
                          <div key={k} className="flex px-3 py-2">
                            <span className="w-1/2 text-slate-500">{k}</span>
                            <span className="w-1/2 font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Tier & Logistics Dimensions */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Package Size Presets &amp; Shipping Tier
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-xl">
                    <span className="block text-[10px] text-slate-500 mb-0.5">Shipping Class Tier</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      {(displayProduct as any).shipping_class || "STANDARD"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-xl">
                    <span className="block text-[10px] text-slate-500 mb-0.5">Chargeable Weight</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {Math.max(
                        Number((displayProduct as any).weight_kg || 0.5),
                        (Number((displayProduct as any).length_cm || 15) *
                          Number((displayProduct as any).width_cm || 10) *
                          Number((displayProduct as any).height_cm || 5)) /
                          5000
                      ).toFixed(2)}{" "}
                      kg
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Dimensions (L × W × H):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(displayProduct as any).length_cm || "15.0"} × {(displayProduct as any).width_cm || "10.0"} × {(displayProduct as any).height_cm || "5.0"} cm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Actual Package Weight:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(displayProduct as any).weight_kg || "0.5"} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Volumetric Weight (L×W×H/5000):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {((Number((displayProduct as any).length_cm || 15) * Number((displayProduct as any).width_cm || 10) * Number((displayProduct as any).height_cm || 5)) / 5000).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Variant & Inventory Matrix */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> SKU Matrix &amp; Pricing
                </h3>
                
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                    <span className="block text-xs text-slate-500">Base Price</span>
                    <span className="font-bold text-slate-900 dark:text-white">{displayProduct.price} ETB</span>
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                    <span className="block text-xs text-slate-500">Total Stock</span>
                    <span className="font-bold text-emerald-600">{displayProduct.total_available_stock} Units</span>
                  </div>
                </div>

                {fetchingDetails ? (
                  <div className="text-xs text-slate-500 italic p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl animate-pulse">
                    Loading variants...
                  </div>
                ) : isDetail && hasVariants ? (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] text-slate-500">
                        <tr>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2">Attributes</th>
                          <th className="px-3 py-2">Price (ETB)</th>
                          <th className="px-3 py-2">Stock</th>
                          <th className="px-3 py-2">Facility / Warehouse</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {detailProduct.variants.map((v: any) => (
                          <tr key={v.id}>
                            <td className="px-3 py-2 font-mono text-[10px] text-slate-600">{v.sku}</td>
                            <td className="px-3 py-2 truncate max-w-[180px]" title={v.attribute_values.map((a: any) => `${a.attribute_name || a.attribute?.name || a.name || 'Opt'}: ${a.value}`).join(" · ")}>
                              {v.attribute_values.map((a: any) => `${a.attribute_name || a.attribute?.name || a.name || 'Opt'}: ${a.value}`).join(" · ")}
                            </td>
                            <td className="px-3 py-2 font-medium">{v.price}</td>
                            <td className="px-3 py-2 text-emerald-600 font-bold">{v.total_stock || v.total_available_stock}</td>
                            <td className="px-3 py-2 text-[10px]">
                              {v.warehouse_stocks && v.warehouse_stocks.length > 0 ? (
                                <div className="space-y-0.5">
                                  {v.warehouse_stocks.map((ws: any) => (
                                    <span key={ws.warehouse_id} className="block text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]" title={`${ws.warehouse_name} (${ws.warehouse_code}) - ${ws.quantity_available} units`}>
                                      🏢 {ws.warehouse_name} ({ws.quantity_available})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No facility</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    {displayProduct.product_type === "SIMPLE" ? "Single SKU product (No variants)" : "No variants found"}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky bottom-0 z-20">
          <div className="text-[10px] text-slate-400 max-w-[200px]">
            Audit actions are immutable and instantly broadcasted to sellers.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading || fetchingDetails}
              onClick={() => setIsRejectModalOpen(true)}
              className="px-5 py-2.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject...</span>
            </button>
            <button
              type="button"
              disabled={loading || hasProhibitedKeywords || fetchingDetails}
              onClick={handleApprove}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">✕</button>
           </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" /> Reject Listing
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a mandatory explanation for the merchant. This reason will be logged in the immutable AuditLog and sent via notification.
            </p>
            <textarea
              rows={4}
              required
              placeholder="e.g. Prohibited replica goods or copyright infringement. Please remove all references to 'Counterfeit' before resubmitting."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || rejectReason.trim().length < 5}
                onClick={handleReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
