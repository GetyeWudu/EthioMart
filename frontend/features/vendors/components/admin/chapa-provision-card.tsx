/**
 * frontend/features/vendors/components/admin/chapa-provision-card.tsx
 * ==================================================================
 * Shows bank account details and Chapa payout subaccount provisioning status
 * with a manual retry button for compliance operators.
 */

"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, Clock, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorBankDetails } from "../../types";

interface ChapaProvisionCardProps {
  bankDetails: VendorBankDetails | null | undefined;
  onRetryChapa: () => Promise<any>;
}

export function ChapaProvisionCard({
  bankDetails,
  onRetryChapa,
}: ChapaProvisionCardProps) {
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setMessage(null);
    try {
      const res = await onRetryChapa();
      setMessage({
        type: "success",
        text: res?.detail || "Chapa subaccount provisioning task queued.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Failed to trigger Chapa retry task.",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const isProvisioned = Boolean(bankDetails?.chapa_subaccount_id);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bank Account & Chapa Payout Subaccount
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Settlement destination for cleared escrow funds.
            </p>
          </div>
        </div>

        <div>
          {isProvisioned ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Chapa Provisioned
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4 text-amber-500" />
              Subaccount Pending
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {bankDetails ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Bank / Method:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {bankDetails.bank_name} ({bankDetails.bank_code})
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Account Number:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {bankDetails.account_number}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Account Holder:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {bankDetails.account_name}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Chapa Subaccount ID:</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm truncate block">
              {bankDetails.chapa_subaccount_id || "None (Not yet provisioned)"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
          No bank account details provided by merchant yet.
        </div>
      )}

      {!isProvisioned && bankDetails && (
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Retry Chapa Subaccount Provisioning
          </Button>
        </div>
      )}
    </div>
  );
}
