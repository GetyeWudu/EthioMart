"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Calendar, MoreHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import api from "@/lib/api";
import { format } from "date-fns";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function PromotionsPage() {
  const { data, error, isLoading } = useSWR('/seller/promotions/', fetcher);
  const promotions = data?.results || data || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Promotions & Discounts</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your store's promotional campaigns.</p>
          </div>
          <Link href="/seller/promotions/new" className={cn(buttonVariants({ variant: "default" }), "bg-indigo-600 hover:bg-indigo-700 text-white gap-2")}>
            <Plus className="h-4 w-4" />
            Create Promotion
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign Name</th>
                <th className="px-6 py-4 font-medium">Promo Code</th>
                <th className="px-6 py-4 font-medium">Discount</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="mt-2 text-slate-500">Loading promotions...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500">Failed to load promotions</td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No promotions found. Create one to get started!
                  </td>
                </tr>
              ) : promotions.map((promo: any) => (
                <tr key={promo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{promo.name}</td>
                  <td className="px-6 py-4">
                    {promo.coupon_code ? (
                      <div className="flex items-center gap-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {promo.coupon_code}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Automatic</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">
                    {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `ETB ${promo.discount_value}`}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Start: {promo.starts_at ? format(new Date(promo.starts_at), 'MMM dd, yyyy') : 'Immediate'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-3 w-3 opacity-0" />
                        End: {promo.expires_at ? format(new Date(promo.expires_at), 'MMM dd, yyyy') : 'Never'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={promo.is_active ? "default" : "secondary"} className={promo.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"}>
                      {promo.is_active ? "Active" : "Draft/Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/seller/promotions/${promo.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
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
