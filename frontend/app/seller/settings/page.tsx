/**
 * frontend/app/seller/settings/page.tsx
 * =====================================
 * Live seller settings page connected to Django apps.vendors:
 *   - Store Branding & Profile
 *   - Business & KYC Documents
 *   - Payout Bank Details
 */

"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  CreditCard,
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useVendorProfile } from "@/features/vendors";
import { KYCStatusBadge, TrustTierBadge } from "@/features/vendors";
import { KYCDocUploader } from "@/features/vendors";
import { useAuthStore } from "@/stores/auth-store";

const ETHIOPIAN_BANKS = [
  { code: "946", name: "Commercial Bank of Ethiopia (CBE)" },
  { code: "656", name: "Awash Bank" },
  { code: "855", name: "Ethio Telecom - Telebirr" },
  { code: "130", name: "Abay Bank" },
  { code: "836", name: "Cooperative Bank of Oromia" },
  { code: "534", name: "Hibret Bank" },
  { code: "979", name: "Nib International Bank" },
  { code: "472", name: "Wegagen Bank" },
  { code: "687", name: "Zemen Bank" },
  { code: "128", name: "CBEBirr" },
];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const {
    profile,
    bankDetails,
    documents,
    isLoading,
    isSubmitting,
    updateProfile,
    saveBankDetails,
    uploadDocument,
    deleteDocument,
  } = useVendorProfile();

  // Use auth store to check if user is the OWNER
  const isOwner = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role;

  // Bank Form
  const [bankCode, setBankCode] = useState<string>("32");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);

  useEffect(() => {
    if (bankDetails) {
      setBankCode(bankDetails.bank_code || "32");
      setAccountNumber(bankDetails.account_number || "");
      setAccountName(bankDetails.account_name || "");
    }
  }, [bankDetails]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccess(null);
    setBankError(null);
    try {
      const selectedBank = ETHIOPIAN_BANKS.find((b) => b.code === bankCode);
      await saveBankDetails({
        bank_code: bankCode,
        bank_name: selectedBank ? selectedBank.name : "Commercial Bank of Ethiopia",
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });
      setBankSuccess("Bank details updated successfully.");
      setIsEditingBank(false);
      setTimeout(() => setBankSuccess(null), 4000);
    } catch (err: any) {
      setBankError(err?.message || "Failed to update bank details.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 pt-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Store Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your payout methods and settlement preferences.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[500px]">
          
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-1 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/80 pb-6 lg:pb-0 lg:pr-8">
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
              Payout Settings
            </button>
            {/* Additional settings tabs like 'Notifications' or 'Security' can be added here in the future */}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {isOwner ? (
              <form onSubmit={handleBankSubmit} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Settlement Bank Account
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Destination account for Chapa automated payouts.</p>
                  </div>
                  {!isEditingBank && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingBank(true)} className="rounded-xl h-8 text-xs shrink-0">
                      Edit Settings
                    </Button>
                  )}
                </div>

                {bankSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{bankSuccess}</span>
                  </div>
                )}

                {bankError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{bankError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Bank / Wallet Provider
                    </Label>
                    <Select value={bankCode} onValueChange={(val) => setBankCode(val || "32")} disabled={!isEditingBank}>
                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30">
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
                      Account Number / Phone (Telebirr)
                    </Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      disabled={!isEditingBank}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Account Holder Name
                    </Label>
                    <Input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      disabled={!isEditingBank}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>
                </div>

                {bankDetails?.chapa_subaccount_id && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
                    <span>Chapa Subaccount ID:</span>
                    <span className="font-mono font-bold">{bankDetails.chapa_subaccount_id}</span>
                  </div>
                )}

                {isEditingBank && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <Button type="button" variant="ghost" onClick={() => setIsEditingBank(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-medium shadow-md"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Details"
                      )}
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                You do not have permission to view or edit settlement settings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
