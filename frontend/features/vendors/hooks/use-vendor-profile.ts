/**
 * frontend/features/vendors/hooks/use-vendor-profile.ts
 * =====================================================
 * React hook for managing authenticated seller profile, KYC submission,
 * document uploads, and bank payout configuration.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { vendorService } from "../services/vendor-service";
import {
  VendorProfile,
  VendorBankDetails,
  KYCDocument,
  KYCSubmitPayload,
  UpdateVendorProfilePayload,
} from "../types";

export function useVendorProfile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [bankDetails, setBankDetails] = useState<VendorBankDetails | null>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vendorService.getSellerProfile();
      setProfile(data);
      if (data.bank_details) setBankDetails(data.bank_details);
      if (data.kyc_documents) setDocuments(data.kyc_documents);
    } catch (err: any) {
      setError(err?.message || "Failed to load seller profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (payload: UpdateVendorProfilePayload | FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await vendorService.updateSellerProfile(payload);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to update profile.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveBankDetails = async (
    data: Omit<VendorBankDetails, "id" | "chapa_subaccount_id">
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await vendorService.saveSellerBankDetails(data);
      setBankDetails(saved);
      return saved;
    } catch (err: any) {
      const msg = err?.message || "Failed to save bank details.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadDocument = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const doc = await vendorService.uploadSellerDocument(formData);
      setDocuments((prev) => [...prev.filter((d) => d.id !== doc.id), doc]);
      return doc;
    } catch (err: any) {
      const msg = err?.message || "Failed to upload document.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await vendorService.deleteSellerDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      const msg = err?.message || "Failed to delete document.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitKYC = async (payload: KYCSubmitPayload = {}) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await vendorService.submitKYCReview(payload);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to submit KYC verification.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    profile,
    bankDetails,
    documents,
    isLoading,
    isSubmitting,
    error,
    refetch: fetchProfile,
    updateProfile,
    saveBankDetails,
    uploadDocument,
    deleteDocument,
    submitKYC,
  };
}
