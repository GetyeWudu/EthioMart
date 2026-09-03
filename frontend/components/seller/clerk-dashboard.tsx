"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { WarehouseStock, StockMovement } from "@/features/inventory/types";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { Package, Hash, AlertTriangle, ArrowRightLeft, Lock, PlusCircle, Scale, History } from "lucide-react";
import Link from "next/link";
export function ClerkDashboard() {
  const user = useAuthStore((s) => s.user);
  const facilityId = user?.assigned_facility_id || undefined;

  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [facilityName, setFacilityName] = useState("Main Facility");
  const [loading, setLoading] = useState(true);

  // Quick Action State
  const [adjustTarget, setAdjustTarget] = useState<WarehouseStock | null>(null);

  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }

    Promise.all([
      inventoryService.getStocks({ warehouse_id: facilityId }),
      inventoryService.getMovements({ warehouse_id: facilityId } as any),
      inventoryService.getWarehouses()
    ])
      .then(([stockData, moveData, whData]) => {
        setStocks(stockData);
        setMovements(moveData);
        const wh = whData.find(w => w.id === facilityId);
        if (wh) setFacilityName(wh.name);
      })
      .catch((err) => console.error("Failed to load clerk dashboard data", err))
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading operations dashboard...</div>;
  }

  // Calculate metrics
  const totalUnits = stocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);
  const activeSkus = stocks.length;
  const lowStockItems = stocks.filter((s) => s.quantity_on_hand <= (s.low_stock_threshold || 5));
  // Count transfers in the movements feed loosely (mocking pending shipments for UI purposes)
  const pendingShipments = movements.filter(m => m.movement_type === "TRANSFER_IN").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Warehouse Operations Dashboard</h1>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              <Lock className="w-3 h-3" />
              <span>Restricted</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span>Physical stock monitor, inbound shipments, and quick ledger adjustments</span>
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 w-max">
            <span>🏬 Assigned Hub:</span>
            <span>{facilityName}</span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href={`/seller/inventory?warehouse_id=${facilityId}&action=receive`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl transition-colors border border-indigo-200"
          >
            <PlusCircle className="w-4 h-4" />
            Receive Stock
          </Link>
          <button
            type="button"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Scale className="w-4 h-4" />
            Stock Adjustment
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Units on Hand" value={`${totalUnits} Units`} subtext="Stored at Hub" icon={Package} color="blue" />
        <MetricCard title="Active SKUs" value={`${activeSkus} Variants`} subtext="In this Depot" icon={Hash} color="indigo" />
        <MetricCard title="Low Stock Alerts" value={`${lowStockItems.length} SKUs`} subtext="Needs Attention" icon={AlertTriangle} color="amber" />
        <MetricCard title="Pending Transfers" value={`${pendingShipments} Shipments`} subtext="In Transit / Received" icon={ArrowRightLeft} color="emerald" />
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Low Stock SKUs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              CRITICAL LOW-STOCK ITEMS
            </h3>
          </div>
          <div className="p-0">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No low stock items in this facility.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">SKU / Variant</th>
                    <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">On Hand</th>
                    <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {lowStockItems.slice(0, 10).map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{stock.product_title}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{stock.sku} {stock.variant_attributes && `• ${stock.variant_attributes}`}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          {stock.quantity_on_hand} Units
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => setAdjustTarget(stock)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Recent Movements */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              RECENT FACILITY MOVEMENTS
            </h3>
          </div>
          <div className="p-0">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No recent movements recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.slice(0, 8).map((mov) => {
                  const isPositive = mov.quantity_delta > 0;
                  return (
                    <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          mov.movement_type === "TRANSFER_IN" || mov.movement_type === "PURCHASE_RECEIPT" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : mov.movement_type === "TRANSFER_OUT" 
                            ? "bg-rose-100 text-rose-700" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{mov.product_title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px]">{mov.variant_sku}</span>
                            <span>• {new Date(mov.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm shrink-0 pl-3 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{mov.quantity_delta}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {adjustTarget && (
        <StockAdjustmentModal
          stock={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => {
            setAdjustTarget(null);
            inventoryService.getStocks({ warehouse_id: facilityId }).then(setStocks);
            inventoryService.getMovements({ warehouse_id: facilityId } as any).then(setMovements);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ title, value, subtext, icon: Icon, color }: { title: string; value: string; subtext: string; icon: any; color: "blue" | "amber" | "emerald" | "indigo" }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg border ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">{subtext}</div>
      </div>
    </div>
  );
}
