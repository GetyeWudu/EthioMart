"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tag, Loader2, Calendar } from "lucide-react";
import useSWR from "swr";
import api from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminPromotionsPage() {
  const { data, error, isLoading, mutate } = useSWR('/admin/promotions/', fetcher);

  const togglePromotionStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/promotions/${id}/`, { is_active: !currentStatus });
      toast.success(`Promotion has been ${!currentStatus ? 'activated' : 'deactivated'}.`);
      mutate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update promotion status.");
    }
  };

    const promotions = data?.results || data || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Promotions</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor and manage all seller promotions across the platform.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Vendor</th>
                <th className="px-6 py-4 font-medium">Campaign / Code</th>
                <th className="px-6 py-4 font-medium">Discount</th>
                <th className="px-6 py-4 font-medium">Uses</th>
                <th className="px-6 py-4 font-medium">Status / Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">Failed to load promotions</td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No active promotions on the platform.
                  </td>
                </tr>
              ) : promotions.map((promo: any) => (
                <tr key={promo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {promo.vendor ? `Vendor ID: ${promo.vendor}` : 'Platform'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{promo.name}</div>
                    {promo.coupon_code && (
                      <div className="flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit mt-1">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {promo.coupon_code}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">
                    {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `ETB ${promo.discount_value}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 dark:text-white font-medium">{promo.current_uses}</div>
                    {promo.max_uses && <div className="text-xs text-slate-500">Limit: {promo.max_uses}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={promo.is_active ? "default" : "secondary"} className={promo.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"}>
                        {promo.is_active ? "Active" : "Disabled"}
                      </Badge>
                      <Switch 
                        checked={promo.is_active} 
                        onCheckedChange={() => togglePromotionStatus(promo.id, promo.is_active)}
                        aria-label="Toggle promotion status"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
