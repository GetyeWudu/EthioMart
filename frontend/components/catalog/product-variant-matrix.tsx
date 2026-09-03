"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Trash2 } from "lucide-react";

export interface VariantRow {
  sku: string;
  price: number;
  compare_at_price?: number;
  weight_kg?: number;
  initial_stock: number;
  attribute_value_ids: string[];
  attribute_labels: { [key: string]: { label: string; color?: string } };
}

interface ProductVariantMatrixProps {
  variants: VariantRow[];
  storeCode?: string;
  categoryCode?: string;
  onChange: (updatedVariants: VariantRow[]) => void;
}

export function ProductVariantMatrix({
  variants,
  storeCode = "GECH",
  categoryCode = "CAT",
  onChange,
}: ProductVariantMatrixProps) {
  // Bulk fill inputs
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [bulkCompareAt, setBulkCompareAt] = useState<string>("");
  const [bulkStock, setBulkStock] = useState<string>("");
  const [appliedToast, setAppliedToast] = useState(false);

  const handleBulkApply = () => {
    const updated = variants.map((v) => ({
      ...v,
      price: bulkPrice ? parseFloat(bulkPrice) : v.price,
      compare_at_price: bulkCompareAt ? parseFloat(bulkCompareAt) : v.compare_at_price,
      initial_stock: bulkStock ? parseInt(bulkStock, 10) : v.initial_stock,
    }));
    onChange(updated);
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 2500);
  };

  const handleAutoGenerateSkus = () => {
    const updated = variants.map((v, i) => {
      const parts = [
        storeCode.toUpperCase(),
        categoryCode.toUpperCase(),
        ...Object.values(v.attribute_labels).map((val) =>
          val.label.replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase()
        ),
      ];
      return {
        ...v,
        sku: parts.filter(Boolean).join("-") || `SKU-${i+1}`,
      };
    });
    onChange(updated);
  };

  const handleRowChange = (index: number, field: keyof VariantRow, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  if (variants.length === 0) {
    return (
      <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-500 text-xs">
        Select dimension attributes above to generate combinations.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* 1. Bulk Actions Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">SKU Matrix Configuration</span>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{variants.length} Variants</span>
          </div>
          <button
            type="button"
            onClick={handleAutoGenerateSkus}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Auto-Generate SKUs
          </button>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bulk Price (ETB)</label>
            <input
              type="number"
              placeholder="e.g. 2500"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Compare-at (ETB)</label>
            <input
              type="number"
              placeholder="e.g. 2900"
              value={bulkCompareAt}
              onChange={(e) => setBulkCompareAt(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Stock (Units)</label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleBulkApply}
              className="h-[34px] px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center whitespace-nowrap uppercase tracking-wide"
            >
              {appliedToast ? "Applied!" : "Apply to All"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-3 w-[20%]">SKU</th>
              <th className="p-3 w-[25%]">Dimensions</th>
              <th className="p-3 w-[20%]">Price*</th>
              <th className="p-3 w-[20%]">Compare-at</th>
              <th className="p-3 w-[10%] text-center">Stock</th>
              <th className="p-3 w-[5%] text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {variants.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-3">
                  <input
                    type="text"
                    required
                    placeholder="SKU"
                    value={row.sku}
                    onChange={(e) => handleRowChange(idx, "sku", e.target.value)}
                    className="w-full text-[11px] font-mono px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(row.attribute_labels).map(([key, val]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {val.label}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    required
                    min={1}
                    value={row.price || ""}
                    onChange={(e) => handleRowChange(idx, "price", parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={row.compare_at_price || ""}
                    onChange={(e) => handleRowChange(idx, "compare_at_price", parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    required
                    min={0}
                    value={row.initial_stock !== undefined ? row.initial_stock : ""}
                    onChange={(e) => handleRowChange(idx, "initial_stock", parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs text-center font-bold text-emerald-600 px-2.5 py-1.5 border border-emerald-200 dark:border-emerald-800/50 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 focus:ring-1 focus:ring-emerald-500"
                  />
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
