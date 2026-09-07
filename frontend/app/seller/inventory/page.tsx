"use client";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WarehouseStock, WarehouseLocation, StockMovement } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { WarehouseStockTable } from "@/components/inventory/warehouse-stock-table";
import { StockLedgerTable } from "@/components/inventory/stock-ledger-table";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { StockTransferModal } from "@/components/inventory/stock-transfer-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Boxes,
  History,
  Layers,
  ArrowRightLeft,
  PlusCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Warehouse,
  AlertTriangle
} from "lucide-react";
import { BoxModelIcon } from "@radix-ui/react-icons";

function InventoryContent() {
  const [activeTab, setActiveTab] = useState<"STOCK" | "LEDGER">("STOCK");
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [adjustTarget, setAdjustTarget] = useState<WarehouseStock | null>(null);
  const [transferTarget, setTransferTarget] = useState<WarehouseStock | null>(null);

  // Search params for deep linking
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get("warehouse_id");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      inventoryService.getStocks({ warehouse_id: warehouseId || undefined }),
      inventoryService.getWarehouses(),
      inventoryService.getMovements({ warehouse_id: warehouseId || undefined } as any),
    ])
      .then(([stockData, whData, moveData]) => {
        setStocks(stockData);
        setWarehouses(whData);
        setMovements(moveData);
      })
      .catch((err) => console.error("Failed to load inventory data", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      totalUnits: stocks.reduce((acc, s) => acc + (s.quantity || 0), 0),
      totalSKUs: stocks.length,
      lowStock: stocks.filter(s => s.quantity > 0 && s.quantity <= 10).length,
      outOfStock: stocks.filter(s => s.quantity === 0).length,
      totalMovements: movements.length,
    };
  }, [stocks, movements]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 dark:text-white">Multi-Warehouse Inventory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Monitor partitioned stock balances across facilities and audit double-entry ledger movements.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("STOCK")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "STOCK"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Partitioned Stock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LEDGER")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "LEDGER"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Ledger Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Units</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-blue-600">{stats.totalUnits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Partitioned SKUs</CardTitle>
            <BoxModelIcon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-indigo-600">{stats.totalSKUs.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Ledger Entries</CardTitle>
            <History className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{stats.totalMovements.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            Loading inventory data...
          </div>
        ) : activeTab === "STOCK" ? (
          <WarehouseStockTable
            stocks={stocks}
            warehouses={warehouses}
            onOpenAdjust={(s) => setAdjustTarget(s)}
            onOpenTransfer={(s) => setTransferTarget(s)}
          />
        ) : (
          <StockLedgerTable movements={movements} />
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustTarget && (
        <StockAdjustmentModal
          stock={adjustTarget}
          onSuccess={loadData}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {/* Stock Transfer Modal */}
      {transferTarget && (
        <StockTransferModal
          stock={transferTarget}
          warehouses={warehouses}
          onSuccess={loadData}
          onClose={() => setTransferTarget(null)}
        />
      )}
    </div>
  );
}

export default function SellerInventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center text-slate-500 text-sm"><div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-2" /> Loading inventory dashboard...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
