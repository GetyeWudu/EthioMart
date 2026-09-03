import React, { useState } from "react";
import { StockMovement } from "@/features/inventory/types";
import { Copy, Download, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockLedgerTableProps {
  movements: StockMovement[];
}

export function StockLedgerTable({ movements }: StockLedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMovements = movements.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.variant_sku.toLowerCase().includes(term) ||
      (m.product_title && m.product_title.toLowerCase().includes(term)) ||
      (m.reference_order_id && m.reference_order_id.toLowerCase().includes(term)) ||
      m.warehouse_name.toLowerCase().includes(term) ||
      (m.notes && m.notes.toLowerCase().includes(term))
    );
  });

  const getMovementBadge = (type: string, display: string) => {
    switch (type) {
      case "TRANSFER_IN":
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border border-emerald-200">📥 Inbound Transfer</span>;
      case "TRANSFER_OUT":
        return <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border border-rose-200">📤 Outbound Transfer</span>;
      case "PURCHASE_RECEIPT":
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border border-blue-200">📦 Inbound Receipt</span>;
      case "ORDER_FULFILLMENT":
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border border-purple-200">🛒 Order Shipped</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border border-slate-200">{display || type}</span>;
    }
  };

  const cleanReference = (rawRef?: string) => {
    if (!rawRef) return null;
    const refStr = String(rawRef);
    if (refStr.includes("Transfer ref:")) {
      const uuid = refStr.replace("Transfer ref:", "").trim();
      const short = uuid.substring(0, 8);
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-700 text-[10px] font-mono font-semibold rounded-md border border-slate-200 cursor-help" title={`Transfer ref: ${uuid}`}>
          TRF-{short}
        </span>
      );
    }
    return <span className="text-slate-500 text-[11px] italic">{refStr}</span>;
  };

  const cleanFacility = (facility: string) => {
    return facility.replace(/\|\|/g, "").trim();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Stock Movement Audit Ledger
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU, Product, or Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 w-[240px]"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs table-fixed">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-[15%]">Timestamp</th>
              <th className="px-4 py-3 w-[25%]">Product &amp; SKU</th>
              <th className="px-4 py-3 w-[15%]">Facility</th>
              <th className="px-4 py-3 w-[15%]">Movement</th>
              <th className="px-4 py-3 w-[10%] text-right">Delta</th>
              <th className="px-4 py-3 w-[10%] text-right">Balance</th>
              <th className="px-4 py-3 w-[10%]">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No stock movement ledger records found.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const isPositive = m.quantity_delta > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(m.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {m.product_title || "Unknown Product"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.variant_sku}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-300 font-medium text-[11px] truncate">
                      {cleanFacility(m.warehouse_name)}
                    </td>
                    <td className="px-4 py-3">
                      {getMovementBadge(m.movement_type, m.movement_type_display)}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-black text-[13px]",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {isPositive ? `+${m.quantity_delta}` : m.quantity_delta}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200 text-[12px]">
                      {m.balance_after} <span className="text-[10px] text-slate-400 font-normal">Units</span>
                    </td>
                    <td className="px-4 py-3">
                      {cleanReference(m.notes || m.reference_order_id)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
