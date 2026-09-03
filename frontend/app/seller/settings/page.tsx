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

  // Profile Form
  const [storeName, setStoreName] = useState<string>("");
  const [storeDescription, setStoreDescription] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [subcity, setSubcity] = useState<string>("");
  const [wereda, setWereda] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Bank Form
  const [bankCode, setBankCode] = useState<string>("32");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setStoreName(profile.store_name || "");
      setStoreDescription(profile.store_description || "");
      setContactEmail(profile.contact_email || "");
      setContactPhone(profile.contact_phone || "");
      setCity(profile.city || "Addis Ababa");
      setSubcity(profile.subcity || "");
      setWereda(profile.wereda || "");
      setStreetAddress(profile.street_address || "");
    }
    if (bankDetails) {
      setBankCode(bankDetails.bank_code || "32");
      setAccountNumber(bankDetails.account_number || "");
      setAccountName(bankDetails.account_name || "");
    }
  }, [profile, bankDetails]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile({
        store_name: storeName.trim(),
        store_description: storeDescription.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        city: city.trim(),
        subcity: subcity.trim(),
        wereda: wereda.trim(),
        street_address: streetAddress.trim(),
      });
      setProfileSuccess("Store profile updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update profile.");
    }
  };

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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {profile?.store_name || "Store Settings"}
              </h1>
              {profile && <KYCStatusBadge status={profile.status} />}
              {profile && <TrustTierBadge tier={profile.tier} />}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage storefront branding, regulatory KYC documents, and bank payout methods.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 text-right shrink-0">
          <div>
            Commission: <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.commission_rate}%</span>
          </div>
          <div>
            TIN: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile?.tin_number || "Not set"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900/50 p-1.5 mb-8 border border-slate-200 dark:border-slate-800 flex flex-wrap w-full sm:w-fit gap-1.5 rounded-2xl shadow-sm h-auto">
          <TabsTrigger
            value="profile"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
          >
            <Store className="h-4 w-4 shrink-0" /> Store Profile
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger
              value="payouts"
              className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
            >
              <CreditCard className="h-4 w-4 shrink-0" /> Payout Bank
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger
              value="documents"
              className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
            >
              <FileCheck2 className="h-4 w-4 shrink-0" /> KYC Documents ({profile?.kyc_documents?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── TAB 1: STORE PROFILE ─────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-500" />
                Storefront & Contact Details
              </h2>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Store Name
                </Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Owner Email <span className="text-slate-400 font-normal">(Login account)</span>
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70 cursor-not-allowed text-xs"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Store Description
                </Label>
                <Textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={3}
                  placeholder="Tell customers about your products and craftsmanship..."
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Public Contact Email
                </Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Public Phone (+251)
                </Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  City / Region
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
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
                  "Save Store Profile"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── TAB 2: PAYOUT BANK ──────────────────────────────────────────── */}
        <TabsContent value="payouts" className="space-y-6">
          <form
            onSubmit={handleBankSubmit}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                Settlement Bank Account (Chapa Transfer Destination)
              </h2>
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
                  Account Number / Phone (Telebirr)
                </Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Account Holder Name
                </Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {bankDetails?.chapa_subaccount_id && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
                <span>Chapa Subaccount ID:</span>
                <span className="font-mono font-bold">{bankDetails.chapa_subaccount_id}</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
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
                  "Save Bank Details"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── TAB 3: KYC DOCUMENTS ────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-indigo-500" />
                Uploaded KYC Regulatory Documents
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your TIN, Trade License, and Fayda ID records.
              </p>
            </div>

            <KYCDocUploader
              documents={documents}
              onUpload={uploadDocument}
              onDelete={deleteDocument}
              isSubmitting={isSubmitting}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
