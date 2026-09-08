/**
 * frontend/features/vendors/components/wallet/payout-lock-alert.tsx
 * ================================================================
 * Security alert banner displayed when a vendor's payout withdrawals are frozen.
 */

"use client";

import { ShieldAlert, AlertTriangle } from "lucide-react";

interface PayoutLockAlertProps {
  lockReason?: string;
  className?: string;
}

export function PayoutLockAlert({ lockReason, className = "" }: PayoutLockAlertProps) {
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent p-5 backdrop-blur-md dark:border-rose-500/20 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
            Payout Withdrawals Temporarily Frozen
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1">
            <strong>Reason:</strong> {lockReason || "Wallet locked during active order dispute investigation or account review."}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Incoming cleared funds remain safe in your balance projection. Contact <a href="mailto:support@ethiomart.com" className="underline text-indigo-600 dark:text-indigo-400 font-medium">support@ethiomart.com</a> for dispute resolution.
          </p>
        </div>
      </div>
    </div>
  );
}
