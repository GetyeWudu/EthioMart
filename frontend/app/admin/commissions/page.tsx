import { CommissionTable } from "@/components/admin/commission-table";

export default function CommissionsPage() {
  return (
    
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Commissions & Payouts</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage revenue splits, platform fees, and pending seller payouts.
              </p>
            </div>
            
            <CommissionTable />
          </div>
        );
}
