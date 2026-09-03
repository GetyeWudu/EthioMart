import { Package } from "lucide-react";

export function OrderSummary() {
  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/40 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Fulfillment Overview</h2>
      
      <div className="space-y-4 flex-1">
        <div className="group flex items-center justify-between p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 dark:from-amber-900/40 dark:to-amber-900/60 dark:text-amber-400 shadow-inner">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">Pending Orders</p>
              <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 mt-0.5">Requires immediate attention</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-500 tracking-tight">12</span>
        </div>

        <div className="group flex items-center justify-between p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 dark:from-blue-900/40 dark:to-blue-900/60 dark:text-blue-400 shadow-inner">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">Processing</p>
              <p className="text-xs font-medium text-blue-700/70 dark:text-blue-400/70 mt-0.5">Currently being packed</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-500 tracking-tight">28</span>
        </div>

        <div className="group flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 dark:from-emerald-900/40 dark:to-emerald-900/60 dark:text-emerald-400 shadow-inner">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">Shipped</p>
              <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">In transit to customer</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-500 tracking-tight">84</span>
        </div>
      </div>
    </div>
  );
}
