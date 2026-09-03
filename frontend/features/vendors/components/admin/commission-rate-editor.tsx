/**
 * frontend/features/vendors/components/admin/commission-rate-editor.tsx
 * =====================================================================
 * Super Admin gated commission rate modifier.
 * If user is not superadmin, the control is disabled with a helpful tooltip/badge.
 */

"use client";

import { useState } from "react";
import { Percent, Shield, Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

interface CommissionRateEditorProps {
  currentRate: string | number;
  onUpdateCommission: (newRate: number | string) => Promise<any>;
}

export function CommissionRateEditor({
  currentRate,
  onUpdateCommission,
}: CommissionRateEditorProps) {
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const [rate, setRate] = useState<string>(String(currentRate));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    const num = parseFloat(rate);
    if (isNaN(num) || num < 0 || num > 100) {
      setErrorMsg("Commission rate must be between 0.00% and 100.00%.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onUpdateCommission(num);
      setSuccessMsg(`Commission rate updated to ${num.toFixed(2)}%.`);
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update commission rate.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Platform Commission Rate
              {!isSuperAdmin && (
                <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Super Admin Only
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contractual fee percentage deducted from each order before escrow clearance.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {parseFloat(String(currentRate)).toFixed(2)}%
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSuperAdmin ? (
        <div className="pt-2">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 8.5"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRate(String(currentRate));
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-1.5 shadow-sm"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                  Save New Rate
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl"
            >
              Adjust Commission Rate
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3 text-xs text-slate-500 border border-slate-200 dark:border-slate-800">
          Only users with <strong>Super Admin</strong> authorization can adjust merchant commission rates.
        </div>
      )}
    </div>
  );
}
