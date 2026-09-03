/**
 * frontend/features/vendors/hooks/use-admin-vendors.ts
 * ===================================================
 * React hook for Admin moderation of vendors: listing, filtering,
 * reviewing KYC submissions, approving, rejecting, suspending, reactivating,
 * custom commission adjustment, and manual Chapa retry triggers.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { vendorService } from "../services/vendor-service";
import { AdminVendorListItem, AdminVendorDetail } from "../types";

export function useAdminVendors(initialFilters?: {
  status?: string;
  vendor_type?: string;
  tier?: string;
  search?: string;
}) {
  const [vendors, setVendors] = useState<AdminVendorListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState(initialFilters || { status: "ALL" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.listAdminVendors(filters);
      setVendors(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err?.message || "Failed to load vendors list.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const setFilterParam = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    vendors,
    totalCount,
    filters,
    isLoading,
    isActionPending,
    error,
    refetch: fetchVendors,
    setFilterParam,
    setFilters,
  };
}

export function useAdminVendorDetail(vendorId: string) {
  const [vendor, setVendor] = useState<AdminVendorDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await vendorService.getAdminVendor(vendorId);
      setVendor(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load vendor details.");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const approve = async () => {
    setIsActionPending(true);
    setError(null);
    try {
      const updated = await vendorService.approveVendor(vendorId);
      setVendor(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to approve vendor.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const reject = async (reason: string) => {
    setIsActionPending(true);
    setError(null);
    try {
      const updated = await vendorService.rejectVendor(vendorId, reason);
      setVendor(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to reject vendor.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const suspend = async (reason: string) => {
    setIsActionPending(true);
    setError(null);
    try {
      const updated = await vendorService.suspendVendor(vendorId, reason);
      setVendor(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to suspend vendor.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const reactivate = async () => {
    setIsActionPending(true);
    setError(null);
    try {
      const updated = await vendorService.reactivateVendor(vendorId);
      setVendor(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to reactivate vendor.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const updateCommission = async (rate: number | string) => {
    setIsActionPending(true);
    setError(null);
    try {
      const updated = await vendorService.updateCommissionRate(vendorId, rate);
      setVendor(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || "Failed to update commission rate.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const retryChapa = async () => {
    setIsActionPending(true);
    setError(null);
    try {
      const res = await vendorService.retryChapaProvisioning(vendorId);
      return res;
    } catch (err: any) {
      const msg = err?.message || "Failed to trigger Chapa retry.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsActionPending(false);
    }
  };

  return {
    vendor,
    isLoading,
    isActionPending,
    error,
    refetch: fetchVendor,
    approve,
    reject,
    suspend,
    reactivate,
    updateCommission,
    retryChapa,
  };
}
