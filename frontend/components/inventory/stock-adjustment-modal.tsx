"use client";

import React, { useState } from "react";
import { WarehouseStock, MovementType } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { PlusCircle, MinusCircle, AlertCircle, CheckCircle2 } from "lucide-react";

interface StockAdjustmentModalProps {
  stock: WarehouseStock;
  onSuccess: () => void;
  onClose: () => void;
}

export function StockAdjustmentModal({ stock, onSuccess, onClose }: StockAdjustmentModalProps) {
  const [delta, setDelta] = useState<string>("1");
  const [movementType, setMovementType] = useState<MovementType>("PURCHASE_RECEIPT");
  const [isPositive, setIsPositive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(delta, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Quantity must be a positive integer.");
      return;
    }

    const calculatedDelta = isPositive ? qty : -qty;
    setLoading(true);
    setErrorMsg(null);

    try {
      await inventoryService.adjustStock({
        warehouse_id: stock.warehouse_id,
        variant_id: stock.variant_id,
        quantity_delta: calculatedDelta,
        movement_type: movementType,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to adjust stock.");
    } finally {
      setLoading(false);
    }
  };

  const resultingBalance = stock.quantity_on_hand + (isPositive ? parseInt(delta, 10) || 0 : -(parseInt(delta, 10) || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Stock Count Adjustment</h3>
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
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Current Facility</span>
              <span className="font-semibold text-slate-900 dark:text-white">{stock.warehouse_name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block">Physical Balance</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{stock.quantity_on_hand} Units</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPositive(true);
                setMovementType("PURCHASE_RECEIPT");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                isPositive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inward / Addition (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPositive(false);
                setMovementType("DAMAGED_WRITE_OFF");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                !isPositive
                  ? "bg-rose-50 text-rose-800 border-rose-500 ring-1 ring-rose-500 dark:bg-rose-950/50 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              <span>Outward / Deduction (-)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Movement Type*</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
            >
              {isPositive ? (
                <>
                  <option value="PURCHASE_RECEIPT">Factory / Supplier Purchase Receipt</option>
                  <option value="CUSTOMER_RETURN">Customer Return Restock</option>
                  <option value="INVENTORY_COUNT_CORRECTION">Audit Count Discrepancy Correction (+)</option>
                </>
              ) : (
                <>
                  <option value="DAMAGED_WRITE_OFF">Damaged / Expired Write-Off</option>
                  <option value="INVENTORY_COUNT_CORRECTION">Audit Count Discrepancy Correction (-)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity Delta*</label>
            <input
              type="number"
              min="1"
              required
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 font-bold"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              New physical balance after save: <strong className="text-slate-900 dark:text-white">{resultingBalance} units</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Audit Notes</label>
            <input
              type="text"
              placeholder="e.g. Received shipment batch #8841"
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
              disabled={loading || resultingBalance < 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs"
            >
              {loading ? "Recording Ledger..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
