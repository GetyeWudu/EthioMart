/**
 * frontend/components/customer/suspended-customer-banner.tsx
 * ==========================================================
 * Warning banner displayed when a customer account is suspended.
 * Strictly excluded from Admin & Seller dashboards.
 */

"use client";

import { AlertTriangle, Mail } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { usePathname } from "next/navigation";

export function SuspendedCustomerBanner() {
  const { user, isSuspended } = useCurrentUser();
  const pathname = usePathname();

  if (!user || !isSuspended) return null;
  if (user.role !== "CUSTOMER") return null;
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/seller")) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold">Account Notice:</span> Your purchasing privileges are currently suspended. You can still view and track previous orders.
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="mailto:support@gechexpress.com?subject=Customer%20Account%20Suspension%20Appeal"
            className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Support to Appeal
          </a>
        </div>
      </div>
    </div>
  );
}
