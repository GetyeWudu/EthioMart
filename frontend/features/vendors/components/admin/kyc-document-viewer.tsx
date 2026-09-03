/**
 * frontend/features/vendors/components/admin/kyc-document-viewer.tsx
 * =================================================================
 * Document verification inspector for compliance officers.
 * Highlights Option A compliance matrix (Individual vs Corporate)
 * and provides document review cards.
 */

"use client";

import {
  FileCheck2,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KYCDocument, BusinessType } from "../../types";

interface KYCDocumentViewerProps {
  documents: KYCDocument[];
  businessType: BusinessType;
  tinNumber: string;
}

export function KYCDocumentViewer({
  documents,
  businessType,
  tinNumber,
}: KYCDocumentViewerProps) {
  const uploadedDocTypes = new Set(documents.map((d) => d.document_type));
  const hasTIN = uploadedDocTypes.has("TIN_CERTIFICATE");
  const hasFaydaOrPassport =
    uploadedDocTypes.has("FAYDA_ID") || uploadedDocTypes.has("PASSPORT_OR_KEBELE");
  const hasTradeLicense = uploadedDocTypes.has("TRADE_LICENSE");

  const isIndividual = businessType === "INDIVIDUAL";
  const isCompliant = isIndividual
    ? hasTIN && hasFaydaOrPassport
    : hasTIN && hasTradeLicense;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-500" />
            KYC Document Verification
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Entity Type: <span className="font-semibold text-slate-700 dark:text-slate-200">{businessType}</span> • TIN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{tinNumber}</span>
          </p>
        </div>

        <div>
          {isCompliant ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Option A Requirements Met
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Missing Mandatory Documents
            </div>
          )}
        </div>
      </div>

      {/* Compliance Matrix Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div
          className={`flex items-center justify-between p-3 rounded-2xl border ${
            hasTIN
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {hasTIN ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            )}
            <span className="font-medium">TIN Certificate (የግብር ከፋይ መለያ)</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {hasTIN ? "Verified Present" : "Missing"}
          </span>
        </div>

        {isIndividual ? (
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              hasFaydaOrPassport
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {hasFaydaOrPassport ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span className="font-medium">Fayda National Digital ID / Passport</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {hasFaydaOrPassport ? "Verified Present" : "Missing"}
            </span>
          </div>
        ) : (
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              hasTradeLicense
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {hasTradeLicense ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span className="font-medium">Renewed Trade License (የታደሰ ንግድ ፈቃድ)</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {hasTradeLicense ? "Verified Present" : "Missing"}
            </span>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Attached Files ({documents.length})
        </h4>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
            No KYC documents have been uploaded by this vendor yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block truncate">
                      {doc.document_type_display || doc.document_type}
                    </span>
                    {doc.document_number && (
                      <span className="text-xs text-slate-500 font-mono block">
                        Doc #: {doc.document_number}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {doc.is_verified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pending Review
                      </span>
                    )}
                  </span>

                  {doc.file && (
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Inspect Document
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
