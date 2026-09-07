"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import { useVendorProfile } from "@/features/vendors";
import { KYCStatusBadge, TrustTierBadge } from "@/features/vendors";
import { KYCDocUploader } from "@/features/vendors";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const {
    profile,
    documents,
    isLoading,
    isSubmitting,
    updateProfile,
    uploadDocument,
    deleteDocument,
  } = useVendorProfile();

  const isOwner = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role;

  const [activeTab, setActiveTab] = useState<"general" | "kyc">("general");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingKYC, setIsEditingKYC] = useState(false);

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
  }, [profile]);

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
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update profile.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 pt-6">
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Profile
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal information, storefront branding, and KYC documents.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[500px]">
          
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-1 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/80 pb-6 lg:pb-0 lg:pr-8">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === "general"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
              }`}
            >
              General Profile
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab("kyc")}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === "kyc"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                }`}
              >
                KYC Documents
              </button>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "general" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Storefront & Contact Details
                  </h2>
                  {!isEditingProfile && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="rounded-xl h-8 text-xs">
                      Edit Profile
                    </Button>
                  )}
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
                  {/* Status & Tier Fields */}
                  <div className="space-y-2 sm:col-span-2 flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                        Store Status
                      </Label>
                      {profile ? <KYCStatusBadge status={profile.status} /> : <div className="h-6 w-20 bg-slate-200 animate-pulse rounded"></div>}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                        Trust Tier
                      </Label>
                      {profile ? <TrustTierBadge tier={profile.tier} /> : <div className="h-6 w-20 bg-slate-200 animate-pulse rounded"></div>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Store Name
                    </Label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      disabled={!isEditingProfile}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Owner Email <span className="text-slate-400 font-normal">(Login account)</span>
                    </Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-not-allowed text-xs"
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
                      disabled={!isEditingProfile}
                      placeholder="Tell customers about your products and craftsmanship..."
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
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
                      disabled={!isEditingProfile}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Public Phone (+251)
                    </Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={!isEditingProfile}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      City / Region
                    </Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!isEditingProfile}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Subcity / Zone
                    </Label>
                    <Input
                      value={subcity}
                      onChange={(e) => setSubcity(e.target.value)}
                      disabled={!isEditingProfile}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-100 disabled:text-slate-900 dark:disabled:text-slate-100 disabled:cursor-default disabled:bg-slate-50/50 dark:disabled:bg-slate-900/30"
                    />
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)} className="rounded-xl">
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
                        "Save Profile"
                      )}
                    </Button>
                  </div>
                )}
              </form>
            )}

            {activeTab === "kyc" && isOwner && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Uploaded KYC Regulatory Documents
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Manage your TIN, Trade License, and Fayda ID records.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isEditingKYC ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingKYC(!isEditingKYC)}
                    className="rounded-xl h-8 text-xs shrink-0"
                  >
                    {isEditingKYC ? "Done" : "Edit Documents"}
                  </Button>
                </div>

                <KYCDocUploader
                  documents={documents}
                  onUpload={uploadDocument}
                  onDelete={deleteDocument}
                  isSubmitting={isSubmitting}
                  isEditing={isEditingKYC}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
