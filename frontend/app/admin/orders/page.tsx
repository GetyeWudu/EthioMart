import { OrderTable } from "@/components/admin/order-table";

export default function AdminOrdersPage() {
  return (
    
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Global Orders Feed</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Monitor all transactions occurring across the platform.
              </p>
            </div>
            
            <OrderTable />
          </div>
        );
}
