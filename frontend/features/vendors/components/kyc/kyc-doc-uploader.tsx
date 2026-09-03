/**
 * frontend/features/vendors/components/kyc/kyc-doc-uploader.tsx
 * =============================================================
 * Regulatory KYC document upload component with file validation,
 * document type dropdown, and uploaded list with delete actions.
 */

"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  File,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentType, KYCDocument } from "../../types";

interface KYCDocUploaderProps {
  documents: KYCDocument[];
  onUpload: (formData: FormData) => Promise<any>;
  onDelete: (docId: string) => Promise<any>;
  isSubmitting?: boolean;
  allowedTypes?: DocumentType[];
}

const ALL_DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  {
    value: "TIN_CERTIFICATE",
    label: "TIN Certificate (የግብር ከፋይ መለያ)",
    description: "Tax Identification Number certificate issued by ERCA / Ministry of Revenues.",
  },
  {
    value: "VAT_CERTIFICATE",
    label: "VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት)",
    description: "Official VAT registration document from Ministry of Revenues (mandatory for VAT-registered merchants).",
  },
  {
    value: "TRADE_LICENSE",
    label: "Renewed Trade License (የታደሰ ንግድ ፈቃድ)",
    description: "Current year renewed business license from Ministry of Trade.",
  },
  {
    value: "FAYDA_ID",
    label: "Fayda National Digital ID (ፋይዳ)",
    description: "Ethiopian National Digital ID credential or slip.",
  },
  {
    value: "PASSPORT_OR_KEBELE",
    label: "Passport or Kebele ID",
    description: "Valid Ethiopian Passport, Resident Kebele ID, or Driver's License.",
  },
  {
    value: "POWER_OF_ATTORNEY",
    label: "Power of Attorney (ውክልና)",
    description: "Legal representation document if acting on behalf of a company.",
  },
  {
    value: "OTHER",
    label: "Other Supporting Document",
    description: "Any supplementary commercial or tax registration document.",
  },
];

export function KYCDocUploader({
  documents,
  onUpload,
  onDelete,
  isSubmitting = false,
  allowedTypes,
}: KYCDocUploaderProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>(
    allowedTypes ? allowedTypes[0] : "TIN_CERTIFICATE"
  );
  const [docNumber, setDocNumber] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTypes = allowedTypes
    ? ALL_DOCUMENT_TYPES.filter((t) => allowedTypes.includes(t.value))
    : ALL_DOCUMENT_TYPES;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ["pdf", "jpg", "jpeg", "png"];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !validExtensions.includes(ext)) {
        setUploadError("Only PDF, JPG, or PNG files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must be under 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!selectedType) {
      setUploadError("Please choose a document type.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("document_type", selectedType);
    formData.append("file", selectedFile);
    if (docNumber.trim()) {
      formData.append("document_number", docNumber.trim());
    }

    try {
      await onUpload(formData);
      setSelectedFile(null);
      setDocNumber("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Upload className="h-4 w-4 text-indigo-500" />
          Upload New KYC Document
        </h4>

        {uploadError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-300">
              Document Type <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(val) => val && setSelectedType(val as DocumentType)}
            >
              <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-300">
              Certificate / Document No. <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. ET-TIN-8921389"
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* File Drop / Select Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center transition-all bg-white/50 dark:bg-slate-950/30 flex flex-col items-center justify-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click to browse or drag and drop your document
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium text-xs sm:text-sm shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between">
          <span>Uploaded Documents ({documents.length})</span>
          {documents.length > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Files attached
            </span>
          )}
        </h4>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
            No KYC documents uploaded yet. Please upload required documents above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <File className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {doc.document_type_display || doc.document_type}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                      {doc.document_number && <span>No: {doc.document_number}</span>}
                      <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc.file && (
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}

                  {!doc.is_verified && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id || isSubmitting}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 w-8 p-0"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
