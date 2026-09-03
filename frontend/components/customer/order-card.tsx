import Link from "next/link";
import { Package, ChevronRight, Truck, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderCardProps {
  id: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
}

export function OrderCard({ id, date, status, total, items }: OrderCardProps) {
  const statusColors = {
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    shipped: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  };

  const StatusIcon = {
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle2,
    cancelled: Package,
  }[status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6 gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm flex-1">
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Order ID</p>
            <p className="font-semibold text-slate-900 dark:text-white uppercase">#{id}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Date Placed</p>
            <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Total Amount</p>
            <p className="font-semibold text-slate-900 dark:text-white">${total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Status</p>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColors[status]}`}>
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center sm:justify-end gap-2 mt-2 sm:mt-0">
          <Link href={`/customer/orders/${id}`} className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            View Details
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">Items ({items.length})</h4>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {items.map((item, idx) => (
            <div key={idx} className="relative h-20 w-20 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden snap-start">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              {item.quantity > 1 && (
                <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-white">
                  x{item.quantity}
                </div>
              )}
            </div>
          ))}
          {items.length > 5 && (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <span className="text-sm font-medium text-slate-500">+{items.length - 5}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
