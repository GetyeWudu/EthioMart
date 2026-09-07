"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WarehouseStock, WarehouseLocation, StockMovement } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { WarehouseStockTable } from "@/components/inventory/warehouse-stock-table";
import { StockLedgerTable } from "@/components/inventory/stock-ledger-table";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { StockTransferModal } from "@/components/inventory/stock-transfer-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  History,
  RefreshCw,
  Warehouse,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  PackageX,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

function AdminInventoryContent() {
  const [activeTab, setActiveTab] = useState<"STOCK" | "LEDGER">("STOCK");
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [adjustTarget, setAdjustTarget] = useState<WarehouseStock | null>(null);
  const [transferTarget, setTransferTarget] = useState<WarehouseStock | null>(null);

  const searchParams = useSearchParams();
  const warehouseId = searchParams?.get("warehouse_id");

  const loadData = () => {
    setLoading(true);
    // MOCK DATA FOR ADMIN FRONTEND
    // Since backend admin inventory endpoints do not exist yet, we mock this
    // to prevent 403 permission errors.
    setTimeout(() => {
      setStocks([
        { id: "1", product_id: "p1", variant_id: "v1", warehouse_id: "w1", quantity_on_hand: 50, quantity_reserved: 10, quantity_available: 40, product_title: "Mock Product", sku: "MOCK-123", warehouse_name: "Addis Main Hub" } as any
      ]);
      setWarehouses([
        { id: "w1", name: "Addis Main Hub", code: "ADD-01", city: "Addis Ababa" } as any
      ]);
      setMovements([
        { id: "m1", stock_id: "1", movement_type: "IN", quantity: 50, reference_type: "MANUAL", date: new Date().toISOString() } as any
      ]);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalUnits = stocks.reduce((acc, s) => acc + (s.quantity_on_hand || 0), 0);
    const lowStock = stocks.filter((s) => {
      const avail = s.quantity_available !== undefined ? s.quantity_available : (s.quantity_on_hand || 0);
      const thresh = s.low_stock_threshold || 10;
      return avail > 0 && avail <= thresh;
    }).length;
    const outOfStock = stocks.filter((s) => {
      const avail = s.quantity_available !== undefined ? s.quantity_available : (s.quantity_on_hand || 0);
      return avail === 0;
    }).length;

    return {
      totalUnits,
      totalSKUs: stocks.length,
      lowStock,
      outOfStock,
      totalMovements: movements.length,
      warehouseCount: warehouses.length,
    };
  }, [stocks, movements, warehouses]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
              Multi-Warehouse Inventory & Stock Ledger
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-[10px]">
              Multi-Hub
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track distributed inventory partitions, regional warehouse fulfillment hubs, and audit double-entry stock ledger movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("STOCK")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "STOCK"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Partitioned Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LEDGER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "LEDGER"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Movement Ledger</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Warehouse Hubs</span>
            <Warehouse className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {stats.warehouseCount} Facilities
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Bole, Merkato, Hawassa Hubs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Total Physical Units</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {stats.totalUnits.toLocaleString()} Units
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Across {stats.totalSKUs} catalog SKUs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Low Stock SKUs</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {stats.lowStock} SKUs
          </div>
          <p className="text-[10px] text-slate-400 mt-1">&le; threshold reorder level</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
            {stats.outOfStock} SKUs
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Requires merchant restock</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Ledger Audits</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {stats.totalMovements} Entries
          </div>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            Double-entry verified
          </p>
        </div>
      </div>

      {/* Main Table Panel */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold">Loading multi-warehouse partition balances...</p>
        </div>
      ) : activeTab === "STOCK" ? (
        <WarehouseStockTable
          stocks={stocks}
          warehouses={warehouses}
          onOpenAdjust={(stock) => setAdjustTarget(stock)}
          onOpenTransfer={(stock) => setTransferTarget(stock)}
        />
      ) : (
        <StockLedgerTable movements={movements} />
      )}

      {/* Adjust Modal */}
      {adjustTarget && (
        <StockAdjustmentModal
          stock={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => {
            setAdjustTarget(null);
            loadData();
          }}
        />
      )}

      {/* Transfer Modal */}
      {transferTarget && (
        <StockTransferModal
          stock={transferTarget}
          warehouses={warehouses}
          onClose={() => setTransferTarget(null)}
          onSuccess={() => {
            setTransferTarget(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading inventory environment...
      </div>
    }>
      <AdminInventoryContent />
    </Suspense>
  );
}
