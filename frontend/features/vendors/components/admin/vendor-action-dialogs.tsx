/**
 * frontend/features/vendors/components/admin/vendor-action-dialogs.tsx
 * ===================================================================
 * Action confirmation & reason modal dialogs for:
 *   - Approve KYC (Creates wallet & triggers Chapa)
 *   - Reject KYC (Mandatory reason >= 10 chars)
 *   - Suspend Store (Mandatory reason >= 10 chars, locks wallet)
 *   - Reactivate Store (Unlocks wallet)
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<any>;
  storeName: string;
  isPending?: boolean;
}

// ── 1. APPROVE MODAL ────────────────────────────────────────────────────────
export function ApproveVendorDialog({
  isOpen,
  onClose,
  onConfirm,
  storeName,
  isPending = false,
}: ActionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Approve Merchant KYC
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to approve <strong>{storeName}</strong>? This will activate the merchant&apos;s public storefront, auto-create their financial <strong>VendorWallet</strong>, and queue their Chapa payout subaccount.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm()}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-medium"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 2. REJECT MODAL ─────────────────────────────────────────────────────────
export function RejectVendorDialog({
  isOpen,
  onClose,
  onConfirm,
  storeName,
  isPending = false,
}: ActionDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Please provide a detailed rejection reason (at least 10 characters).");
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to reject KYC application.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <XCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Reject Merchant KYC Application
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Please explain why <strong>{storeName}&apos;s</strong> KYC submission is being rejected. This explanation will be displayed to the merchant so they can correct their documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Rejection Reason <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. The uploaded trade license is expired (2015 E.C.). Please provide a renewed business license for 2016 E.C."
            rows={4}
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl resize-none"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || reason.trim().length < 10}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 font-medium"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 3. SUSPEND MODAL ────────────────────────────────────────────────────────
export function SuspendVendorDialog({
  isOpen,
  onClose,
  onConfirm,
  storeName,
  isPending = false,
}: ActionDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Please provide a detailed suspension reason (at least 10 characters).");
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to suspend vendor.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Suspend Merchant Store
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Suspending <strong>{storeName}</strong> will immediately hide their storefront from the marketplace and <strong>lock their VendorWallet</strong> to prevent payout withdrawals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Suspension Reason <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Account suspended due to excessive cancellation rate (>15%) and multiple unresolved customer counterfeit disputes."
            rows={4}
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl resize-none"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || reason.trim().length < 10}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-medium"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Confirm Suspension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 4. REACTIVATE MODAL ─────────────────────────────────────────────────────
export function ReactivateVendorDialog({
  isOpen,
  onClose,
  onConfirm,
  storeName,
  isPending = false,
}: ActionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <RefreshCw className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Reactivate Suspended Store
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to reactivate <strong>{storeName}</strong>? This will restore their store visibility on the marketplace and <strong>unlock their VendorWallet</strong> for payouts.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm()}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-medium"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reactivate Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
