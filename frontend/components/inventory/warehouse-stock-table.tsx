"use client";

import React, { useState, useMemo } from "react";
import { WarehouseStock, WarehouseLocation } from "@/features/inventory/types";
import { AlertCircle, ArrowRightLeft, PlusCircle, Search, Filter, Warehouse, CheckCircle2, ShieldAlert, ChevronDown, ChevronRight, PackageOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WarehouseStockTableProps {
  stocks: WarehouseStock[];
  warehouses: WarehouseLocation[];
  onOpenAdjust: (stock: WarehouseStock) => void;
  onOpenTransfer: (stock: WarehouseStock) => void;
}

export function WarehouseStockTable({
  stocks,
  warehouses,
  onOpenAdjust,
  onOpenTransfer,
}: WarehouseStockTableProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("ALL");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(searchParams?.get("low_stock") === "true");

  // Grouped expanded state
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const toggleExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter((item) => {
      const matchesSearch =
        item.product_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWh = selectedWarehouse === "ALL" || item.warehouse_id === selectedWarehouse;
      const matchesLowStock = !filterLowStockOnly || item.quantity_available <= (item.low_stock_threshold || 5);

      return matchesSearch && matchesWh && matchesLowStock;
    });
  }, [stocks, searchQuery, selectedWarehouse, filterLowStockOnly]);

  const groupedStocks = useMemo(() => {
    const groups: Record<string, {
      productId: string;
      productTitle: string;
      variants: WarehouseStock[];
      totalOnHand: number;
      totalReserved: number;
      totalAvailable: number;
    }> = {};

    filteredStocks.forEach(stock => {
      const pId = stock.product_id || stock.product_title || "UNKNOWN";
      if (!groups[pId]) {
        groups[pId] = {
          productId: pId,
          productTitle: stock.product_title || "Unnamed Product",
          variants: [],
          totalOnHand: 0,
          totalReserved: 0,
          totalAvailable: 0
        };
      }
      groups[pId].variants.push(stock);
      groups[pId].totalOnHand += stock.quantity_on_hand;
      groups[pId].totalReserved += stock.quantity_reserved;
      groups[pId].totalAvailable += stock.quantity_available;
    });

    return Object.values(groups);
  }, [filteredStocks]);

  const lowStockCount = stocks.filter((s) => s.quantity_available <= (s.low_stock_threshold || 5)).length;

  const parseVariantDisplay = (stock: WarehouseStock) => {
    if (stock.variant_attributes) return stock.variant_attributes;
    
    // Fallback safe SKU parsing
    const parts = stock.sku.split('-');
    if (parts.length > 2) {
      // Ex: GECH-MENS-L-TIT -> Size: L, Color: TIT (rough guess)
      return parts.slice(2).join(' / ');
    }
    return stock.sku;
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, product title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={selectedWarehouse} onValueChange={(val) => setSelectedWarehouse(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
              <SelectValue placeholder="All Facilities" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL" className="text-xs">All Facilities ({warehouses.length})</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id} className="text-xs">
                    {wh.name} [{wh.code}]
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Stock Table Accordion */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-hidden w-full">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-gray-50 dark:bg-slate-900/80 text-gray-500 dark:text-slate-400 font-semibold text-[11px] border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-[32%]">Product / Matrix</th>
                <th className="px-4 py-3.5 w-[20%]">Facility</th>
                <th className="px-3 py-3.5 text-right w-[10%]">On Hand</th>
                <th className="px-3 py-3.5 text-right w-[10%]">Reserved</th>
                <th className="px-3 py-3.5 text-right w-[10%]">Available</th>
                <th className="px-3 py-3.5 text-center w-[10%]">Status</th>
                <th className="px-3 py-3.5 text-right w-[8%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {groupedStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <PackageOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No inventory records match your filter criteria.
                  </td>
                </tr>
              ) : (
                groupedStocks.map((group) => {
                  const isExpanded = expandedProducts.has(group.productId);
                  const isOOS = group.totalAvailable <= 0;
                  const isLow = !isOOS && group.totalAvailable <= 10;
                  
                  return (
                    <React.Fragment key={group.productId}>
                      {/* Parent Row */}
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isExpanded ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}`}
                        onClick={() => toggleExpand(group.productId)}
                      >
                        <td className="px-4 py-3.5 truncate">
                          <div className="flex items-center gap-2 min-w-0">
                            <button className="p-0.5 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <span className="font-bold text-gray-900 dark:text-white text-sm truncate" title={group.productTitle}>{group.productTitle}</span>
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              {group.variants.length} SKUs
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 font-medium text-xs truncate">
                          {selectedWarehouse === "ALL" ? `Total across ${new Set(group.variants.map(v => v.warehouse_id)).size} Facilities` : "Selected Facility"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-medium text-gray-700 font-mono truncate">{group.totalOnHand}</td>
                        <td className="px-3 py-3.5 text-right font-medium text-amber-600 font-mono truncate">{group.totalReserved}</td>
                        <td className="px-3 py-3.5 text-right font-bold text-gray-900 dark:text-white text-sm font-mono truncate">{group.totalAvailable}</td>
                        <td className="px-3 py-3.5 text-center truncate">
                          {isOOS ? (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                              Low Stock
                            </span>
                          ) : (
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <span className="text-[10px] text-gray-400">Expand</span>
                        </td>
                      </tr>
                      
                      {/* Child Rows (Variants) */}
                      {isExpanded && group.variants.map(stock => {
                        const vOOS = stock.quantity_available <= 0;
                        const vLow = !vOOS && stock.quantity_available <= (stock.low_stock_threshold || 5);
                        
                        return (
                          <tr key={stock.id} className="bg-white dark:bg-slate-900 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 pl-10 truncate">
                              <div className="flex items-start gap-2 relative min-w-0">
                                <div className="absolute -left-4 top-2 w-2.5 h-px bg-gray-300 dark:bg-slate-700" />
                                <div className="absolute -left-4 -top-4 w-px h-6 bg-gray-300 dark:bg-slate-700" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-800 dark:text-slate-200 text-xs truncate" title={parseVariantDisplay(stock)}>🏷️ {parseVariantDisplay(stock)}</div>
                                  <div className="font-mono text-gray-400 text-[10px] mt-0.5 truncate">/{stock.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-[11px] truncate">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Warehouse className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate" title={stock.warehouse_name}>{stock.warehouse_name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-gray-600 dark:text-slate-400 font-mono truncate">{stock.quantity_on_hand}</td>
                            <td className="px-3 py-3 text-right font-medium text-amber-500 font-mono truncate">{stock.quantity_reserved}</td>
                            <td className="px-3 py-3 text-right font-bold text-gray-800 dark:text-slate-200 font-mono truncate">{stock.quantity_available}</td>
                            <td className="px-3 py-3 text-center truncate">
                              {vOOS ? (
                                <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                                  {stock.quantity_available}
                                </span>
                              ) : vLow ? (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                                  {stock.quantity_available}
                                </span>
                              ) : (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-block truncate">
                                  {stock.quantity_available}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onOpenAdjust(stock); }}
                                  className="px-1.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md transition-colors text-[10px] font-semibold flex items-center gap-1"
                                >
                                  Adjust
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onOpenTransfer(stock); }}
                                  className="px-1.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-md transition-colors text-[10px] font-semibold flex items-center gap-1"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
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
