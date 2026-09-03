"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WarehouseStock, WarehouseLocation, StockMovement } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { WarehouseStockTable } from "@/components/inventory/warehouse-stock-table";
import { StockLedgerTable } from "@/components/inventory/stock-ledger-table";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { StockTransferModal } from "@/components/inventory/stock-transfer-modal";
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
} from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Multi-Warehouse Inventory Hub</h1>
          <p className="text-xs text-gray-500">
            Monitor partitioned stock balances across facilities and audit double-entry ledger movements
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("STOCK")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "STOCK"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
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
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Ledger Audit</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "STOCK" ? (
        <WarehouseStockTable
          stocks={stocks}
          warehouses={warehouses}
          onOpenAdjust={(s) => setAdjustTarget(s)}
          onOpenTransfer={(s) => setTransferTarget(s)}
        />
      ) : (
        <StockLedgerTable movements={movements} />
      )}

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
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading inventory dashboard...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
