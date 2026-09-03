/**
 * frontend/app/admin/vendors/[id]/page.tsx
 * ========================================
 * Complete Admin Vendor Review, KYC Inspector, and Moderation Action Center.
 */

"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  ShieldAlert,
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
} from "@/features/vendors";

export default function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
          Error loading vendor
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {error || "Vendor not found."}
        </p>
        <Link href="/admin/vendors">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
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
    wereda,
    street_address,
    commission_rate,
    kyc_documents = [],
    bank_details,
    wallet,
    created_at,
    rejection_reason,
    suspension_reason,
  } = vendor;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Back Link & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/vendors"
          className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vendor Moderation Queue
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isActionPending}
          className="gap-1.5 border-slate-200 dark:border-slate-800 rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Main Vendor Header Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              <Store className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {store_name}
                </h1>
                <KYCStatusBadge status={status} />
                <TrustTierBadge tier={tier} />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                <span>
                  Owner: <strong className="text-slate-700 dark:text-slate-200">{seller_name}</strong> ({seller_email})
                </span>
                <span>•</span>
                <span>
                  Type: <strong className="text-slate-700 dark:text-slate-200">{vendor_type}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Joined {new Date(created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {status === "PENDING_REVIEW" && (
              <>
                <Button
                  onClick={() => setIsApproveOpen(true)}
                  disabled={isActionPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-md shadow-emerald-500/10"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve KYC
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejectOpen(true)}
                  disabled={isActionPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-md shadow-rose-500/10"
                >
                  <XCircle className="h-4 w-4" /> Reject KYC
                </Button>
              </>
            )}

            {status === "APPROVED" && (
              <Button
                variant="destructive"
                onClick={() => setIsSuspendOpen(true)}
                disabled={isActionPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-md shadow-red-500/10"
              >
                <AlertTriangle className="h-4 w-4" /> Suspend Store
              </Button>
            )}

            {status === "SUSPENDED" && (
              <Button
                onClick={() => setIsReactivateOpen(true)}
                disabled={isActionPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-md"
              >
                <RefreshCw className="h-4 w-4" /> Reactivate Store
              </Button>
            )}
          </div>
        </div>

        {/* Reason Notices */}
        {status === "REJECTED" && rejection_reason && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            <strong>Rejection Reason:</strong> {rejection_reason}
          </div>
        )}

        {status === "SUSPENDED" && suspension_reason && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
            <strong>Suspension Reason:</strong> {suspension_reason}
          </div>
        )}
      </div>

      {/* Grid: KYC Document Inspection & Business Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: KYC Documents & Bank/Chapa */}
        <div className="lg:col-span-2 space-y-8">
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
        <div className="space-y-8">
          <CommissionRateEditor
            currentRate={commission_rate}
            onUpdateCommission={updateCommission}
          />

          {/* Business Entity Overview Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 backdrop-blur-xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              Business Registration
            </h3>

            <div className="space-y-3 text-xs">
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
                  {vat_registered ? `Yes (${vat_number || "N/A"})` : "No"}
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
                <span className="text-slate-800 dark:text-slate-200">{contact_phone || "None"}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Support Email:</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{contact_email || seller_email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Projection Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Vendor Financial Balances
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
    </div>
  );
}
