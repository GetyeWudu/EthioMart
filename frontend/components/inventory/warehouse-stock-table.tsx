"use client";

import React, { useState, useMemo } from "react";
import { WarehouseStock, WarehouseLocation } from "@/features/inventory/types";
import { AlertCircle, ArrowRightLeft, PlusCircle, Search, Filter, Warehouse, CheckCircle2, ShieldAlert, ChevronDown, ChevronRight, PackageOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";

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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, product title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Facilities ({warehouses.length})</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} [{wh.code}]
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Filter Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              filterLowStockOnly
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Low Stock Alert</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filterLowStockOnly ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900"
            }`}>
              {lowStockCount}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Stock Table Accordion */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Product / Matrix</th>
                <th className="px-5 py-3.5 w-48">Facility</th>
                <th className="px-5 py-3.5 text-right w-24">On Hand</th>
                <th className="px-5 py-3.5 text-right w-24">Reserved</th>
                <th className="px-5 py-3.5 text-right w-24">Available</th>
                <th className="px-5 py-3.5 text-center w-28">Status</th>
                <th className="px-5 py-3.5 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-slate-50/50" : ""}`}
                        onClick={() => toggleExpand(group.productId)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button className="p-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <span className="font-bold text-gray-900 text-sm">{group.productTitle}</span>
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {group.variants.length} SKUs
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-medium text-xs">
                          {selectedWarehouse === "ALL" ? `Total across ${new Set(group.variants.map(v => v.warehouse_id)).size} Facilities` : "Selected Facility"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-700">{group.totalOnHand}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-amber-600">{group.totalReserved}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 text-sm">{group.totalAvailable}</td>
                        <td className="px-5 py-3.5 text-center">
                          {isOOS ? (
                            <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                              🔴 Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                              🟠 Low Stock
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                              🟢 Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-[10px] text-gray-400">Expand to manage</span>
                        </td>
                      </tr>
                      
                      {/* Child Rows (Variants) */}
                      {isExpanded && group.variants.map(stock => {
                        const vOOS = stock.quantity_available <= 0;
                        const vLow = !vOOS && stock.quantity_available <= (stock.low_stock_threshold || 5);
                        
                        return (
                          <tr key={stock.id} className="bg-white hover:bg-gray-50/70 transition-colors">
                            <td className="px-5 py-3 pl-12">
                              <div className="flex items-start gap-2 relative">
                                <div className="absolute -left-5 top-2 w-3 h-px bg-gray-300" />
                                <div className="absolute -left-5 -top-4 w-px h-6 bg-gray-300" />
                                <div>
                                  <div className="font-semibold text-gray-800 text-xs">🏷️ {parseVariantDisplay(stock)}</div>
                                  <div className="font-mono text-gray-400 text-[10px] mt-0.5">/{stock.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <Warehouse className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{stock.warehouse_name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-gray-600">{stock.quantity_on_hand}</td>
                            <td className="px-5 py-3 text-right font-medium text-amber-500">{stock.quantity_reserved}</td>
                            <td className="px-5 py-3 text-right font-bold text-gray-800">{stock.quantity_available}</td>
                            <td className="px-5 py-3 text-center">
                              {vOOS ? (
                                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {stock.quantity_available}
                                </span>
                              ) : vLow ? (
                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {stock.quantity_available}
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {stock.quantity_available}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onOpenAdjust(stock); }}
                                  className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-md transition-colors text-[10px] font-semibold flex items-center gap-1"
                                >
                                  Adjust
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onOpenTransfer(stock); }}
                                  className="px-2 py-1 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 rounded-md transition-colors text-[10px] font-semibold flex items-center gap-1"
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
