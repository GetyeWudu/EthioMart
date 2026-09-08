import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldAlert, ShieldCheck, Store } from "lucide-react";

const SELLERS = [
  { id: "SEL-101", name: "TechHaven Electronics", owner: "John Smith", joined: "Jan 12, 2025", products: 124, revenue: 145000, status: "Active" },
  { id: "SEL-102", name: "Minimalist Desk Co", owner: "Sarah Jenkins", joined: "Mar 04, 2025", products: 42, revenue: 38000, status: "Active" },
  { id: "SEL-103", name: "Global Supply Imports", owner: "Robert Chen", joined: "Oct 15, 2026", products: 0, revenue: 0, status: "Pending Approval" },
  { id: "SEL-104", name: "Fashion Forward", owner: "Emily Davis", joined: "Feb 22, 2024", products: 310, revenue: 210000, status: "Suspended" },
];

export function SellerTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 gap-4 bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Platform Sellers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all registered store owners and vendor accounts.</p>
        </div>
      </div>

      <div className="overflow-hidden w-full">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="bg-white text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs">
            <tr>
              <th className="px-4 py-4 font-medium w-[24%]">Store Name</th>
              <th className="px-4 py-4 font-medium w-[16%]">Owner</th>
              <th className="px-4 py-4 font-medium w-[14%]">Joined</th>
              <th className="px-4 py-4 font-medium w-[10%]">Products</th>
              <th className="px-4 py-4 font-medium w-[14%]">Total Revenue</th>
              <th className="px-4 py-4 font-medium w-[12%]">Status</th>
              <th className="px-4 py-4 font-medium text-right w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {SELLERS.map((seller) => (
              <tr key={seller.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2FC] text-[#1261C9] dark:bg-[#1261C9]/20 dark:text-[#4D8FE0] shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 dark:text-white block truncate" title={seller.name}>{seller.name}</span>
                      <span className="text-xs text-slate-500 font-mono block truncate">{seller.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300 truncate" title={seller.owner}>{seller.owner}</td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400 truncate">{seller.joined}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300 truncate">{seller.products}</td>
                <td className="px-4 py-4 text-slate-900 dark:text-white font-medium font-mono truncate">${seller.revenue.toLocaleString()}</td>
                <td className="px-4 py-4 truncate">
                  {seller.status === "Active" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1"><ShieldCheck className="h-3 w-3" /> Active</Badge>}
                  {seller.status === "Pending Approval" && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>}
                  {seller.status === "Suspended" && <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 gap-1"><ShieldAlert className="h-3 w-3" /> Suspended</Badge>}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-[#1261C9]">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
