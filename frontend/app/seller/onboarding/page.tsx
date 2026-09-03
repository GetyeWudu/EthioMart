/**
 * frontend/app/seller/onboarding/page.tsx
 * =======================================
 * Full KYC Onboarding & Compliance Verification Wizard page.
 */

"use client";

import { useVendorProfile } from "@/features/vendors";
import { KYCWizard } from "@/features/vendors";
import { KYCStatusBadge } from "@/features/vendors";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SellerOnboardingPage() {
  const {
    profile,
    bankDetails,
    documents,
    isLoading,
    updateProfile,
    saveBankDetails,
    uploadDocument,
    deleteDocument,
    submitKYC,
  } = useVendorProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500">Loading merchant verification profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-xl mx-auto space-y-3">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
          Failed to load seller profile
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Please make sure you are logged in with an active Seller account.
        </p>
        <Link href="/seller" className="inline-block text-xs font-semibold text-indigo-600 underline">
          Return to Seller Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/seller"
              className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Merchant KYC & Regulatory Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Submit your Ethiopian regulatory business identification and tax documents to activate your store and payouts.
          </p>
        </div>

        <div className="shrink-0">
          <KYCStatusBadge status={profile.status} />
        </div>
      </div>

      {/* KYC Multi-Step Wizard */}
      <KYCWizard
        profile={profile}
        bankDetails={bankDetails}
        documents={documents}
        onUpdateProfile={updateProfile}
        onSaveBankDetails={saveBankDetails}
        onUploadDocument={uploadDocument}
        onDeleteDocument={deleteDocument}
        onSubmitKYC={submitKYC}
      />
    </div>
  );
}
