/**
 * frontend/features/vendors/components/kyc/kyc-status-banner.tsx
 * ==============================================================
 * Contextual notification banner guiding sellers on required KYC verification steps.
 */

"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorProfile } from "../../types";

interface KYCStatusBannerProps {
  profile: VendorProfile | null;
  className?: string;
}

export function KYCStatusBanner({ profile, className = "" }: KYCStatusBannerProps) {
  if (!profile) return null;

  const { status, rejection_reason, suspension_reason } = profile;

  if (status === "APPROVED") {
    return null; // No warning needed for approved stores
  }

  if (status === "DRAFT") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-md dark:border-amber-500/20 ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Complete Merchant KYC Verification
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                Your store is currently in <strong>Draft mode</strong>. To publish products, receive customer orders, and enable bank payouts, please submit your Ethiopian business documents.
              </p>
            </div>
          </div>
          <Link href="/seller/onboarding" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold shadow-md shadow-amber-500/10 gap-2">
              Start Verification
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-5 backdrop-blur-md dark:border-blue-500/20 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              KYC Documents Under Review
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Your business registration and tax documents have been submitted and are currently being reviewed by the EthioMart Compliance Team. Approvals typically take 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-5 backdrop-blur-md dark:border-rose-500/20 ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-600 dark:text-rose-400 text-base">
                KYC Verification Rejected
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                <strong>Reason:</strong> {rejection_reason || "Documents provided were expired, mismatched, or illegible."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please update your documents and resubmit for verification.
              </p>
            </div>
          </div>
          <Link href="/seller/onboarding" className="shrink-0 w-full sm:w-auto">
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-md gap-2"
            >
              Update & Resubmit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600/15 via-red-600/5 to-transparent p-5 backdrop-blur-md dark:border-red-500/30 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-600 dark:text-red-400 text-base">
              Store Suspended & Payouts Frozen
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
              <strong>Suspension Notice:</strong> {suspension_reason || "Account suspended due to policy or compliance violation."}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
              Your storefront is hidden and payout withdrawals are locked. Please reach out to <a href="mailto:compliance@ethiomart.com" className="underline font-semibold">compliance@ethiomart.com</a> to appeal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
