/**
 * frontend/app/admin/vendors/[id]/page.tsx
 * ========================================
 * Complete Admin Vendor Review, KYC Inspector, and Moderation Action Center.
 * Enterprise production-grade styling for the main vendor box and moderation console.
 */

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
  Building2,
  ShieldAlert,
  Clock,
  ExternalLink,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAdminVendorDetail,
  KYCStatusBadge,
  TrustTierBadge,
  KYCDocumentViewer,
  ChapaProvisionCard,
  CommissionRateEditor,
  WalletCard,
  ApproveVendorDialog,
  RejectVendorDialog,
  SuspendVendorDialog,
  ReactivateVendorDialog,
  DeleteVendorIssueDialog,
} from "@/features/vendors";
import { cn } from "@/lib/utils";

export default function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    vendor,
    isLoading,
    isActionPending,
    error,
    refetch,
    approve,
    reject,
    suspend,
    reactivate,
    updateCommission,
    retryChapa,
  } = useAdminVendorDetail(id);

  // Dialog State
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500 font-medium">Loading vendor moderation dossier...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
          Error loading vendor
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {error || "Vendor not found."}
        </p>
        <Link href="/admin/vendors">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
            <ArrowLeft className="h-4 w-4" /> Return to Vendors List
          </Button>
        </Link>
      </div>
    );
  }

  const {
    store_name,
    status,
    tier,
    seller_email,
    seller_name,
    vendor_type,
    business_type,
    tin_number,
    vat_registered,
    vat_number,
    contact_phone,
    contact_email,
    city,
    subcity,
    commission_rate,
    kyc_documents = [],
    bank_details,
    wallet,
    created_at,
    rejection_reason,
    suspension_reason,
  } = vendor;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Top Navigation & Context Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/vendors"
          className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Vendor Moderation Queue
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isActionPending}
          className="h-8 gap-1.5 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold px-3 bg-white dark:bg-slate-900 shadow-2xs text-slate-700 dark:text-slate-300"
        >
          {isActionPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          )}
          Refresh Dossier
        </Button>
      </div>

      {/* Main Enterprise Vendor Box */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs backdrop-blur-md">
        {/* Status Top Accent Line */}
        <div
          className={cn(
            "h-1.5 w-full",
            status === "APPROVED" && "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
            status === "PENDING_REVIEW" && "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500",
            status === "SUSPENDED" && "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600",
            status === "REJECTED" && "bg-gradient-to-r from-red-500 to-rose-700",
            status === "DRAFT" && "bg-slate-300 dark:bg-slate-700"
          )}
        />

        <div className="p-6 sm:p-7 space-y-6">
          {/* Identity & Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Store Avatar with Status Dot */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 dark:from-indigo-950/60 dark:to-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
                  <Store className="h-8 w-8" />
                </div>
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
                    status === "APPROVED" && "bg-emerald-500",
                    status === "PENDING_REVIEW" && "bg-amber-500 animate-pulse",
                    status === "SUSPENDED" && "bg-rose-500",
                    status === "REJECTED" && "bg-red-500",
                    status === "DRAFT" && "bg-slate-400"
                  )}
                  title={`Status: ${status}`}
                />
              </div>

              {/* Store Details & Badges */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                    {store_name}
                  </h1>
                  <KYCStatusBadge status={status} />
                  <TrustTierBadge tier={tier} />
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border",
                      vendor_type === "PLATFORM"
                        ? "bg-indigo-50/70 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    {vendor_type === "PLATFORM" ? "Direct Platform" : "3rd-Party"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                    ID: {id.slice(0, 8)}...
                  </span>

                  {vendor.slug && (
                    <Link
                      href={`/stores/${vendor.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline font-mono"
                    >
                      ethiomart.com/stores/{vendor.slug}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Registered {new Date(created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Enterprise Action Control Suite */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {status === "PENDING_REVIEW" && (
                <>
                  <Button
                    onClick={() => setIsApproveOpen(true)}
                    disabled={isActionPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-xs h-9 px-3.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve KYC
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectOpen(true)}
                    disabled={isActionPending}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl gap-1.5 text-xs font-semibold h-9 px-3.5"
                  >
                    <XCircle className="h-4 w-4" /> Reject KYC
                  </Button>
                </>
              )}

              {status === "APPROVED" && (
                <Button
                  variant="outline"
                  onClick={() => setIsSuspendOpen(true)}
                  disabled={isActionPending}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/40 rounded-xl gap-1.5 text-xs font-semibold h-9 px-3.5"
                >
                  <AlertTriangle className="h-4 w-4" /> Suspend Store
                </Button>
              )}

              {status === "SUSPENDED" && (
                <Button
                  onClick={() => setIsReactivateOpen(true)}
                  disabled={isActionPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-xs h-9 px-3.5"
                >
                  <RefreshCw className="h-4 w-4" /> Reactivate Store
                </Button>
              )}

              {/* Issue Sanction & Delete Store Button */}
              <Button
                variant="ghost"
                onClick={() => setIsDeleteOpen(true)}
                disabled={isActionPending}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded-xl gap-1.5 text-xs font-semibold h-9 px-3 transition-colors"
                title="Issue Sanction & Delete Store"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete Store</span>
              </Button>
            </div>
          </div>

          {/* Executive Metadata Ribbon inside the Vendor Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            {/* 1: Merchant Owner */}
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Merchant Owner
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {seller_name || "Merchant"}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <span className="truncate">{seller_email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(seller_email)}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                  title="Copy email"
                >
                  {copiedEmail ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* 2: Business Registration */}
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Entity Type & TIN
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {business_type || "Commercial Entity"}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block truncate">
                {tin_number ? `TIN: ${tin_number}` : "TIN Not Provided"}
              </span>
            </div>

            {/* 3: Operating Location */}
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Headquarters
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {city || "Addis Ababa"}{subcity ? `, ${subcity}` : ""}
              </span>
              <span className="text-[11px] text-slate-500 block truncate font-mono">
                {contact_phone || "No phone registered"}
              </span>
            </div>

            {/* 4: Platform Economics */}
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Platform Economics
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 block">
                {commission_rate}% Commission
              </span>
              <span className="text-[11px] text-slate-500 block">
                {vat_registered ? `VAT Registered` : "Non-VAT Registered"}
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Alert Banners inside the Vendor Box */}
        {status === "PENDING_REVIEW" && (
          <div className="mx-6 mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                Regulatory KYC Submission Awaiting Operator Review
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Verify business license, taxpayer ID certificate, and Fayda/Kebele identification below before approving this store for public marketplace transactions.
              </p>
            </div>
          </div>
        )}

        {status === "REJECTED" && rejection_reason && (
          <div className="mx-6 mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-300">
                KYC Application Rejected
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                <strong>Rejection Reason:</strong> {rejection_reason}
              </p>
            </div>
          </div>
        )}

        {status === "SUSPENDED" && suspension_reason && (
          <div className="mx-6 mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">
                Store Suspended Under Platform Governance
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                <strong>Suspension Reason:</strong> {suspension_reason}. Public catalog visibility is disabled and wallet payouts are currently locked.
              </p>
            </div>
          </div>
        )}

        {status === "APPROVED" && (
          <div className="mx-6 mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                Verified & Active Merchant — Authorized for Live Transactions with 72h Escrow Window
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono font-medium">
              Chapa Enabled
            </span>
          </div>
        )}
      </div>

      {/* Grid: KYC Document Inspection & Business Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: KYC Documents & Bank/Chapa */}
        <div className="lg:col-span-2 space-y-6">
          <KYCDocumentViewer
            documents={kyc_documents}
            businessType={business_type}
            tinNumber={tin_number}
          />

          <ChapaProvisionCard
            bankDetails={bank_details}
            onRetryChapa={retryChapa}
          />
        </div>

        {/* Right 1 Col: Commission, Wallet, and Business Specs */}
        <div className="space-y-6">
          <CommissionRateEditor
            currentRate={commission_rate}
            onUpdateCommission={updateCommission}
          />

          {/* Business Entity Overview Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 backdrop-blur-md shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              Business Registration
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Entity Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{business_type}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">TIN Number:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{tin_number || "None"}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">VAT Registered:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {vat_registered ? `Yes (${vat_number || "Active"})` : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-800 dark:text-slate-200 text-right">
                  {city}, {subcity ? `${subcity}` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Contact Phone:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{contact_phone || "None"}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Support Email:</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px] font-mono">{contact_email || seller_email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Projection Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Vendor Financial Balances & Escrow
        </h3>
        <WalletCard wallet={wallet || null} />
      </div>

      {/* Action Dialog Modals */}
      <ApproveVendorDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={async () => {
          await approve();
          setIsApproveOpen(false);
        }}
        storeName={store_name}
        isPending={isActionPending}
      />

      <RejectVendorDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={async (reason) => {
          if (reason) await reject(reason);
        }}
        storeName={store_name}
        isPending={isActionPending}
      />

      <SuspendVendorDialog
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={async (reason) => {
          if (reason) await suspend(reason);
        }}
        storeName={store_name}
        isPending={isActionPending}
      />

      <ReactivateVendorDialog
        isOpen={isReactivateOpen}
        onClose={() => setIsReactivateOpen(false)}
        onConfirm={async () => {
          await reactivate();
          setIsReactivateOpen(false);
        }}
        storeName={store_name}
        isPending={isActionPending}
      />

      {/* Delete / Regulatory Sanction Issue Dialog */}
      <DeleteVendorIssueDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async (reason, category) => {
          await suspend(`Sanctioned & Terminated [${category}]: ${reason}`);
          setIsDeleteOpen(false);
          router.push("/admin/vendors");
        }}
        storeName={store_name}
        sellerEmail={seller_email}
        isPending={isActionPending}
      />
    </div>
  );
}
