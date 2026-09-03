"use client";

import React, { useState } from "react";
import { WarehouseStock, WarehouseLocation } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { ArrowRightLeft, AlertCircle, Warehouse } from "lucide-react";

interface StockTransferModalProps {
  stock: WarehouseStock;
  warehouses: WarehouseLocation[];
  onSuccess: () => void;
  onClose: () => void;
}

export function StockTransferModal({ stock, warehouses, onSuccess, onClose }: StockTransferModalProps) {
  const targetWarehouses = warehouses.filter((w) => w.id !== stock.warehouse_id && w.is_active);
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>(targetWarehouses[0]?.id || "");
  const [transferQty, setTransferQty] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(transferQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Transfer quantity must be greater than zero.");
      return;
    }
    if (qty > stock.quantity_available) {
      setErrorMsg(`Cannot transfer more than available stock (${stock.quantity_available} units).`);
      return;
    }
    if (!targetWarehouseId) {
      setErrorMsg("Please select a destination facility.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await inventoryService.transferStock({
        source_warehouse_id: stock.warehouse_id,
        target_warehouse_id: targetWarehouseId,
        variant_id: stock.variant_id,
        quantity: qty,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete inter-warehouse transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Inter-Facility Stock Transfer</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stock.product_title} ({stock.sku})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Source Facility (Origin):</span>
              <strong className="text-slate-900 dark:text-white">{stock.warehouse_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Available to Transfer:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{stock.quantity_available} Units</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination Facility (Target)*</label>
            {targetWarehouses.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                You only have one facility configured. Add another warehouse in Facility Settings before transferring.
              </p>
            ) : (
              <select
                value={targetWarehouseId}
                onChange={(e) => setTargetWarehouseId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              >
                {targetWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} [{w.code}] ({w.city})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transfer Quantity*</label>
            <input
              type="number"
              min="1"
              max={stock.quantity_available}
              required
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transfer Notes</label>
            <input
              type="text"
              placeholder="e.g. Restocking Bole Express store branch"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || targetWarehouses.length === 0 || stock.quantity_available <= 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{loading ? "Transferring..." : "Execute Transfer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
