import { PromotionForm } from "@/components/seller/promotion-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPromotionPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <Link href="/seller/promotions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Promotions
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Promotion</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Set up a new discount code or automatic discount.
              </p>
            </div>
            <PromotionForm />
          </div>
  );
}
