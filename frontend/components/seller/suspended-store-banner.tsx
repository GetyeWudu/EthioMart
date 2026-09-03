/**
 * frontend/components/seller/suspended-store-banner.tsx
 * =====================================================
 * High-priority Alert banner displayed when a merchant store is suspended.
 */

"use client";

import { ShieldAlert, AlertOctagon, HelpCircle, Mail } from "lucide-react";
import { useVendorProfile } from "@/features/vendors/hooks/use-vendor-profile";
import Link from "next/link";

export function SuspendedStoreBanner() {
  const { profile, isLoading } = useVendorProfile();

  if (isLoading || !profile || profile.status !== "SUSPENDED") {
    return null;
  }

  return (
    <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 sm:px-6 lg:px-8 py-3.5 text-rose-950 dark:text-rose-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-7 w-7 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <span className="font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wide mr-1.5">
              Store Suspended:
            </span>
            Your product catalog is hidden from shoppers and wallet withdrawals are locked. Please fulfill open customer orders or submit an appeal.
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-10 sm:pl-0">
          <Link
            href="/seller/disputes"
            className="font-semibold text-rose-700 dark:text-rose-300 hover:underline"
          >
            Review Disputes
          </Link>
          <a
            href="mailto:sellers@gechexpress.com?subject=Merchant%20Account%20Suspension%20Appeal"
            className="inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Mail className="h-3.5 w-3.5" />
            Submit Appeal
          </a>
        </div>
      </div>
    </div>
  );
}
