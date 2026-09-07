"use client";

import { CommissionTable } from "@/components/admin/commission-table";
import { Badge } from "@/components/ui/badge";

export default function CommissionsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-slate-900 dark:text-white">
              Commissions & Vendor Splits
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[10px]">
              Revenue Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track marketplace revenue splits, automated 10% intermediation cuts, and merchant payout ledger reconciliations.
          </p>
        </div>
      </div>

      <CommissionTable />
    </div>
  );
}
