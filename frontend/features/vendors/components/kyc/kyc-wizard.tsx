/**
 * frontend/features/vendors/components/kyc/kyc-wizard.tsx
 * =======================================================
 * 3-step KYC verification wizard enforcing Option A Ethiopian compliance:
 *   - Step 1: Store & Entity Information (Business Type, Store Name, 10-digit TIN, VAT, Location)
 *   - Step 2: Document Upload (Strict Option A document validation matrix)
 *   - Step 3: Bank / Settlement Account (CBE, Awash, Dashen, Telebirr)
 *   - Review & Submit to Compliance
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileCheck2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Loader2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KYCDocUploader } from "./kyc-doc-uploader";
import {
  VendorProfile,
  VendorBankDetails,
  KYCDocument,
  BusinessType,
  DocumentType,
} from "../../types";

interface KYCWizardProps {
  profile: VendorProfile;
  bankDetails: VendorBankDetails | null;
  documents: KYCDocument[];
  onUpdateProfile: (data: any) => Promise<any>;
  onSaveBankDetails: (data: any) => Promise<any>;
  onUploadDocument: (formData: FormData) => Promise<any>;
  onDeleteDocument: (docId: string) => Promise<any>;
  onSubmitKYC: (data: any) => Promise<any>;
}

const BUSINESS_TYPES: { value: BusinessType; label: string; desc: string }[] = [
  {
    value: "INDIVIDUAL",
    label: "Individual Merchant (ግለሰብ)",
    desc: "Sole trader selling personal handcrafted or sourced goods. Requires TIN + Fayda ID.",
  },
  {
    value: "SOLE_PROPRIETORSHIP",
    label: "Sole Proprietorship (ግል ድርጅት)",
    desc: "Registered individual enterprise with trade license. Requires TIN + Trade License.",
  },
  {
    value: "PLC",
    label: "Private Limited Company (PLC)",
    desc: "Registered corporate entity. Requires TIN + Renewed Trade License.",
  },
  {
    value: "SHARE_COMPANY",
    label: "Share Company (SC)",
    desc: "Joint-stock company. Requires TIN + Renewed Trade License.",
  },
];

const ETHIOPIAN_BANKS = [
  { code: "32", name: "Commercial Bank of Ethiopia (CBE)" },
  { code: "96", name: "Awash International Bank" },
  { code: "85", name: "Dashen Bank" },
  { code: "telebirr", name: "Ethio Telecom - Telebirr" },
  { code: "10", name: "Abyssinia Bank" },
  { code: "20", name: "Cooperative Bank of Oromia" },
  { code: "30", name: "Hibret Bank" },
  { code: "40", name: "Nib International Bank" },
  { code: "50", name: "Wegagen Bank" },
  { code: "60", name: "Zemen Bank" },
];

export function KYCWizard({
  profile,
  bankDetails,
  documents,
  onUpdateProfile,
  onSaveBankDetails,
  onUploadDocument,
  onDeleteDocument,
  onSubmitKYC,
}: KYCWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Form State — Step 1: Entity Info
  const [storeName, setStoreName] = useState<string>(profile.store_name || "");
  const [businessType, setBusinessType] = useState<BusinessType>(
    profile.business_type || "INDIVIDUAL"
  );
  const [tinNumber, setTinNumber] = useState<string>(profile.tin_number || "");
  const [vatRegistered, setVatRegistered] = useState<boolean>(profile.vat_registered || false);
  const [vatNumber, setVatNumber] = useState<string>(profile.vat_number || "");
  const [businessLicenseNumber, setBusinessLicenseNumber] = useState<string>(
    profile.business_license_number || ""
  );
  const [city, setCity] = useState<string>(profile.city || "Addis Ababa");
  const [subcity, setSubcity] = useState<string>(profile.subcity || "");
  const [wereda, setWereda] = useState<string>(profile.wereda || "");
  const [streetAddress, setStreetAddress] = useState<string>(profile.street_address || "");
  const [contactPhone, setContactPhone] = useState<string>(profile.contact_phone || "");
  const [contactEmail, setContactEmail] = useState<string>(profile.contact_email || "");

  // Form State — Step 3: Bank Details
  const [bankCode, setBankCode] = useState<string>(bankDetails?.bank_code || "32");
  const [accountNumber, setAccountNumber] = useState<string>(
    bankDetails?.account_number || ""
  );
  const [accountName, setAccountName] = useState<string>(bankDetails?.account_name || "");

  // ── Document Compliance Checks (Option A) ─────────────────────────────────
  const uploadedDocTypes = new Set(documents.map((d) => d.document_type));
  const hasTIN = uploadedDocTypes.has("TIN_CERTIFICATE");
  const hasVATCert = uploadedDocTypes.has("VAT_CERTIFICATE");
  const hasFaydaOrPassport =
    uploadedDocTypes.has("FAYDA_ID") || uploadedDocTypes.has("PASSPORT_OR_KEBELE");
  const hasTradeLicense = uploadedDocTypes.has("TRADE_LICENSE");

  const isIndividual = businessType === "INDIVIDUAL";
  const isDocumentsValid = isIndividual
    ? hasTIN && hasFaydaOrPassport && (!vatRegistered || hasVATCert)
    : hasTIN && hasTradeLicense && (!vatRegistered || hasVATCert);

  // ── Step Navigation Handlers ──────────────────────────────────────────────
  const handleStep1Next = async () => {
    setErrorMessage(null);
    if (!storeName.trim()) {
      setErrorMessage("Store name is required.");
      return;
    }
    const cleanTIN = tinNumber.replace(/\s|-/g, "");
    if (!cleanTIN || cleanTIN.length !== 10 || !/^\d{10}$/.test(cleanTIN)) {
      setErrorMessage("TIN Number must be exactly 10 numeric digits.");
      return;
    }

    if (vatRegistered && (!vatNumber || !vatNumber.trim())) {
      setErrorMessage("VAT Registration Number is required when business is VAT-registered.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateProfile({
        store_name: storeName.trim(),
        business_type: businessType,
        tin_number: cleanTIN,
        vat_registered: vatRegistered,
        vat_number: vatRegistered ? vatNumber.trim() : "",
        business_license_number: businessLicenseNumber.trim(),
        city: city.trim(),
        subcity: subcity.trim(),
        wereda: wereda.trim(),
        street_address: streetAddress.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
      });
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save business details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Next = () => {
    setErrorMessage(null);
    if (!isDocumentsValid) {
      if (!hasTIN) {
        setErrorMessage("Please upload your TIN Certificate (የግብር ከፋይ መለያ).");
        return;
      }
      if (isIndividual && !hasFaydaOrPassport) {
        setErrorMessage(
          "Individual merchants must upload a Fayda National Digital ID (ፋይዳ) or Passport/Kebele ID."
        );
        return;
      }
      if (!isIndividual && !hasTradeLicense) {
        setErrorMessage(
          "Corporate entities must upload a renewed Trade License (የታደሰ ንግድ ፈቃድ)."
        );
        return;
      }
      if (vatRegistered && !hasVATCert) {
        setErrorMessage(
          "VAT-registered businesses must upload an official VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት)."
        );
        return;
      }
    }
    setCurrentStep(3);
  };

  const handleStep3Next = async () => {
    setErrorMessage(null);
    if (!accountNumber.trim()) {
      setErrorMessage("Bank account number is required.");
      return;
    }
    if (!accountName.trim()) {
      setErrorMessage("Account holder name is required.");
      return;
    }

    const selectedBank = ETHIOPIAN_BANKS.find((b) => b.code === bankCode);

    setIsSubmitting(true);
    try {
      await onSaveBankDetails({
        bank_code: bankCode,
        bank_name: selectedBank ? selectedBank.name : "Commercial Bank of Ethiopia",
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });
      setCurrentStep(4); // Review & Submit
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save bank payout details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmitKYC({
        business_type: businessType,
        tin_number: tinNumber.replace(/\s|-/g, ""),
        vat_registered: vatRegistered,
        vat_number: vatRegistered ? vatNumber.trim() : "",
        business_license_number: businessLicenseNumber.trim(),
        city: city.trim(),
        subcity: subcity.trim(),
        wereda: wereda.trim(),
        street_address: streetAddress.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "KYC submission failed. Please review your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-white/70 dark:bg-slate-950/70 p-8 sm:p-12 text-center backdrop-blur-xl shadow-xl space-y-6 max-w-2xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            KYC Verification Submitted!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Thank you for completing your merchant KYC application. The EthioMart compliance team has received your documents and will review your submission within 24–48 hours.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-left space-y-1.5">
          <p>
            <strong>Store:</strong> {storeName} ({businessType})
          </p>
          <p>
            <strong>TIN:</strong> {tinNumber}
          </p>
          <p>
            <strong>Status:</strong> Pending KYC Review
          </p>
        </div>
        <Button
          onClick={() => router.push("/seller")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-md"
        >
          Go to Seller Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Wizard Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: "Business Entity", icon: Building2 },
            { step: 2, label: "KYC Documents", icon: FileCheck2 },
            { step: 3, label: "Payout Bank", icon: CreditCard },
            { step: 4, label: "Review & Submit", icon: ShieldCheck },
          ].map(({ step, label, icon: Icon }) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;

            return (
              <div
                key={step}
                className="flex flex-col items-center gap-2 relative z-10 cursor-pointer"
                onClick={() => {
                  if (isCompleted) setCurrentStep(step);
                }}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-sm ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    isCurrent
                      ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                      : isCompleted
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800 -z-0" />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── STEP 1: BUSINESS ENTITY INFO ──────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Step 1: Store & Entity Information
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your legal business classification in Ethiopia and provide your tax identification details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUSINESS_TYPES.map((bt) => (
              <div
                key={bt.value}
                onClick={() => setBusinessType(bt.value)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  businessType === bt.value
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30 ring-2 ring-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {bt.label}
                  </span>
                  {businessType === bt.value && (
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{bt.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Store Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Addis Crafts & Textiles"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Ethiopian TIN (10 Digits) <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                maxLength={10}
                placeholder="10-digit TIN (e.g. 0012345678)"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                City / Region
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Addis Ababa"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Subcity / Zone
              </Label>
              <Input
                value={subcity}
                onChange={(e) => setSubcity(e.target.value)}
                placeholder="e.g. Bole / Kirkos"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Contact Phone (+251)
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+251911223344"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Support Email
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="support@yourstore.com"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* ── Ethiopian Tax Classification & VAT Section ────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Ethiopian Tax Classification (የታክስ ምደባ) <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[11px] text-slate-500 font-medium">Ministry of Revenues Guidelines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Non-VAT / TOT */}
              <div
                onClick={() => {
                  setVatRegistered(false);
                  setVatNumber("");
                }}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  !vatRegistered
                    ? "border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30 ring-2 ring-emerald-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      Non-VAT / Turnover Tax (TOT)
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      የተርንኦቨር ታክስ (ቶት) ከፋይ
                    </span>
                  </div>
                  {!vatRegistered && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  For small businesses, sole traders, or retail shops with annual revenue below 2,000,000 ETB. Only requires a standard 10-digit TIN.
                </p>
              </div>

              {/* Option 2: VAT-Registered */}
              <div
                onClick={() => setVatRegistered(true)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  vatRegistered
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30 ring-2 ring-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      VAT-Registered Business (15%)
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      የተጨማሪ እሴት ታክስ (ቫት) የተመዘገበ
                    </span>
                  </div>
                  {vatRegistered && (
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  For registered corporate entities or businesses with official VAT Certificate from Ministry of Revenues (annual turnover &gt; 2M ETB).
                </p>
              </div>
            </div>

            {/* Conditional VAT Number Field & Notice */}
            {vatRegistered && (
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    VAT Registration Number (የቫት ምዝገባ ቁጥር) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="e.g. VAT-10928374 or 10-12 digit VAT No"
                    className="bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/60 font-mono text-sm"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Requirement:</strong> You will be required to upload your official <strong>VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት)</strong> in Step 2.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              onClick={handleStep1Next}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium px-6 py-2.5 rounded-xl shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Continue to Documents <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: REGULATORY DOCUMENTS (OPTION A) ───────────────────────── */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-indigo-500" />
              Step 2: Upload Regulatory KYC Documents
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ethiopian regulatory compliance requires the following documents for{" "}
              <strong>{BUSINESS_TYPES.find((b) => b.value === businessType)?.label}</strong>
              {vatRegistered ? " (VAT-Registered 15%)" : " (TOT Merchant)"}.
            </p>
          </div>

          {/* Option A Requirement Checklist Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-3">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-xs sm:text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Required Document Checklist for {businessType}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  hasTIN
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                {hasTIN ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-400 shrink-0" />
                )}
                <span className="font-medium">1. TIN Certificate (የግብር ከፋይ መለያ)</span>
              </div>

              {isIndividual ? (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    hasFaydaOrPassport
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {hasFaydaOrPassport ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-400 shrink-0" />
                  )}
                  <span className="font-medium">2. Fayda Digital ID / Passport</span>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    hasTradeLicense
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {hasTradeLicense ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-400 shrink-0" />
                  )}
                  <span className="font-medium">2. Renewed Trade License (ንግድ ፈቃድ)</span>
                </div>
              )}

              {vatRegistered && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl border sm:col-span-2 ${
                    hasVATCert
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300"
                  }`}
                >
                  {hasVATCert ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-indigo-400 shrink-0" />
                  )}
                  <span className="font-medium">3. VAT Registration Certificate (የቫት ምዝገባ ሰርተፊኬት) *Mandatory</span>
                </div>
              )}
            </div>
          </div>

          {/* Uploader Component */}
          <KYCDocUploader
            documents={documents}
            onUpload={onUploadDocument}
            onDelete={onDeleteDocument}
            allowedTypes={
              isIndividual
                ? vatRegistered
                  ? ["TIN_CERTIFICATE", "VAT_CERTIFICATE", "FAYDA_ID", "PASSPORT_OR_KEBELE", "OTHER"]
                  : ["TIN_CERTIFICATE", "FAYDA_ID", "PASSPORT_OR_KEBELE", "OTHER"]
                : vatRegistered
                  ? ["TIN_CERTIFICATE", "VAT_CERTIFICATE", "TRADE_LICENSE", "POWER_OF_ATTORNEY", "OTHER"]
                  : ["TIN_CERTIFICATE", "TRADE_LICENSE", "POWER_OF_ATTORNEY", "OTHER"]
            }
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleStep2Next}
              disabled={!isDocumentsValid}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50"
            >
              Continue to Payout Bank <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: BANK DETAILS ─────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Step 3: Payout Settlement Account
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your settlement bank or mobile wallet where cleared earnings will be deposited via Chapa Transfer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Settlement Bank / Mobile Wallet <span className="text-rose-500">*</span>
              </Label>
              <Select value={bankCode} onValueChange={(val) => setBankCode(val || "32")}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  {ETHIOPIAN_BANKS.map((b) => (
                    <SelectItem key={b.code} value={b.code}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Account Number / Phone (Telebirr) <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 1000123456789 or 0912345678"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Account Holder Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Must match legal entity / TIN holder name"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              <p className="text-xs text-slate-500">
                The account holder name must match the name on your TIN certificate and national ID.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleStep3Next}
              disabled={isSubmitting || !accountNumber.trim() || !accountName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium px-6 py-2.5 rounded-xl shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Review Application <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW & SUBMIT ───────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Step 4: Review Application & Submit
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Please double-check your submitted details before submitting to compliance.
            </p>
          </div>

          <div className="space-y-4">
            {/* Business Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  1. Business Entity
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 h-auto p-0"
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">Store Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{storeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Entity Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{businessType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">TIN Number:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{tinNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location:</span>
                  <span className="text-slate-800 dark:text-slate-200">{city}, {subcity}</span>
                </div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  2. Regulatory Documents ({documents.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 h-auto p-0"
                >
                  Edit
                </Button>
              </div>
              <div className="space-y-1.5 pt-1 text-xs">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{d.document_type_display || d.document_type}</span>
                    {d.document_number && (
                      <span className="text-slate-400 font-mono">({d.document_number})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  3. Settlement Account
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 h-auto p-0"
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">Bank:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ETHIOPIAN_BANKS.find((b) => b.code === bankCode)?.name || bankCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Number:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{accountName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300">
            By submitting your application, you certify that all information and regulatory documents provided are genuine, authentic, and registered with the Ethiopian Ministry of Revenues and Ministry of Trade.
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Submit KYC Application
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
