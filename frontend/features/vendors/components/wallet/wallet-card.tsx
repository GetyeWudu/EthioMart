/**
 * frontend/features/vendors/components/wallet/wallet-card.tsx
 * ==========================================================
 * Real-time balance readouts for the seller:
 *   - Available Balance (Cleared funds ready for Chapa Transfer payout)
 *   - Pending Escrow (Locked in 72-hour dispute window)
 *   - Total Withdrawn (Lifetime cumulative earnings paid out)
 *   - Payout Lock Status (Active disputes / suspensions)
 */

"use client";

import { Wallet, Clock, ArrowUpRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { VendorWallet } from "../../types";
import { PayoutLockAlert } from "./payout-lock-alert";

interface WalletCardProps {
  wallet: VendorWallet | null;
  isLoading?: boolean;
}

export function WalletCard({ wallet, isLoading = false }: WalletCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>
    );
  }

  const available = wallet?.available_balance
    ? parseFloat(wallet.available_balance).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const pending = wallet?.pending_balance
    ? parseFloat(wallet.pending_balance).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const withdrawn = wallet?.total_withdrawn
    ? parseFloat(wallet.total_withdrawn).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const isLocked = wallet?.is_payout_locked || false;

  return (
    <div className="space-y-6">
      {isLocked && <PayoutLockAlert lockReason={wallet?.lock_reason} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/10 via-indigo-600/5 to-purple-600/10 p-6 backdrop-blur-xl shadow-lg shadow-indigo-500/5 dark:border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Available Balance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {available}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">ETB</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cleared funds ready for payout withdrawal
            </p>
          </div>
        </div>

        {/* Pending Escrow */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 backdrop-blur-xl shadow-sm dark:border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Clearance (5m Escrow)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {pending}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">ETB</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Held in 5-minute dispute window (Test Mode)
            </p>
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cumulative Paid Out
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {withdrawn}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">ETB</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lifetime payouts transferred to bank
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
