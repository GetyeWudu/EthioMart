/**
 * frontend/features/vendors/components/kyc/kyc-status-badge.tsx
 * =============================================================
 * Renders an accessible, aesthetic badge for vendor status and trust tier.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { VendorStatus, TrustTier } from "../../types";

interface KYCStatusBadgeProps {
  status: VendorStatus;
  className?: string;
}

export function KYCStatusBadge({ status, className = "" }: KYCStatusBadgeProps) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge
          className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 gap-1.5 px-2.5 py-1 font-medium transition-all ${className}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Approved & Active
        </Badge>
      );

    case "PENDING_REVIEW":
      return (
        <Badge
          className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 gap-1.5 px-2.5 py-1 font-medium animate-pulse ${className}`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          Pending KYC Review
        </Badge>
      );

    case "REJECTED":
      return (
        <Badge
          className={`bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 gap-1.5 px-2.5 py-1 font-medium ${className}`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          KYC Rejected
        </Badge>
      );

    case "SUSPENDED":
      return (
        <Badge
          className={`bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 gap-1.5 px-2.5 py-1 font-medium ${className}`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          Suspended
        </Badge>
      );

    case "DRAFT":
    default:
      return (
        <Badge
          className={`bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 gap-1.5 px-2.5 py-1 font-medium ${className}`}
        >
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Draft (Unsubmitted)
        </Badge>
      );
  }
}

interface TrustTierBadgeProps {
  tier: TrustTier;
  className?: string;
}

export function TrustTierBadge({ tier, className = "" }: TrustTierBadgeProps) {
  switch (tier) {
    case "VIP":
      return (
        <Badge
          className={`bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 gap-1.5 px-2.5 py-1 font-semibold shadow-sm ${className}`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          VIP Merchant
        </Badge>
      );

    case "TRUSTED":
      return (
        <Badge
          className={`bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 gap-1.5 px-2.5 py-1 font-medium ${className}`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          Trusted Merchant
        </Badge>
      );

    case "PROBATION":
    default:
      return (
        <Badge
          className={`bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 gap-1.5 px-2.5 py-1 font-medium ${className}`}
        >
          <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
          Probation Tier
        </Badge>
      );
  }
}
