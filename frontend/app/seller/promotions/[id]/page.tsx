"use client";

import { PromotionForm } from "@/components/seller/promotion-form";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import useSWR from "swr";
import api from "@/lib/api";
import { useParams } from "next/navigation";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function PromotionDetailsPage() {
  const params = useParams();
  const { data, error, isLoading } = useSWR(`/seller/promotions/${params.id}/`, fetcher);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl text-center py-24 text-red-500">
        Failed to load promotion details.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link href="/seller/promotions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Promotions
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Promotion</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Update your existing promotion or coupon rules.
        </p>
      </div>
      
      {/* Usage Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-500 font-medium">Total Uses</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{data.current_uses}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-500 font-medium">Usage Limit</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{data.max_uses || "Unlimited"}</p>
        </div>
      </div>

      <PromotionForm initialData={data} />
    </div>
  );
}
