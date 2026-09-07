import React, { useState } from "react";
import { StockMovement } from "@/features/inventory/types";
import { Copy, Download, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockLedgerTableProps {
  movements: StockMovement[];
}

export function StockLedgerTable({ movements }: StockLedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [movementFilter, setMovementFilter] = useState("ALL");

  const filteredMovements = movements.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.variant_sku.toLowerCase().includes(term) ||
      (m.product_title && m.product_title.toLowerCase().includes(term)) ||
      (m.reference_order_id && m.reference_order_id.toLowerCase().includes(term)) ||
      m.warehouse_name.toLowerCase().includes(term) ||
      (m.notes && m.notes.toLowerCase().includes(term));
      
    const matchesType = movementFilter === "ALL" || m.movement_type === movementFilter;
    
    return matchesSearch && matchesType;
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
    <div className="space-y-4">
      {/* Out of box Title */}
      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
        Stock Movement Audit Ledger
      </h3>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Left */}
        <div className="relative w-full sm:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU, Product, or Ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters Right */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={movementFilter} onValueChange={setMovementFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="All Movements" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL" className="text-xs">All Movements</SelectItem>
                <SelectItem value="TRANSFER_IN" className="text-xs">Inbound Transfer</SelectItem>
                <SelectItem value="TRANSFER_OUT" className="text-xs">Outbound Transfer</SelectItem>
                <SelectItem value="PURCHASE_RECEIPT" className="text-xs">Inbound Receipt</SelectItem>
                <SelectItem value="ORDER_FULFILLMENT" className="text-xs">Order Shipped</SelectItem>
                <SelectItem value="ADJUSTMENT" className="text-xs">Stock Adjustment</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <button className="flex items-center gap-1.5 px-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
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
  </div>
  );
}
