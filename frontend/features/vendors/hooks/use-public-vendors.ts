/**
 * frontend/features/vendors/hooks/use-public-vendors.ts
 * =====================================================
 * React hook for public store directory and public store detail.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { vendorService } from "../services/vendor-service";
import { PublicStore } from "../types";

export function usePublicVendors(initialSearch?: string) {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>(initialSearch || "");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.listPublicStores({
        search: search.trim() || undefined,
        page_size: 24,
      });
      setStores(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err?.message || "Failed to load stores directory.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return {
    stores,
    totalCount,
    search,
    setSearch,
    isLoading,
    error,
    refetch: fetchStores,
  };
}

export function usePublicStoreDetail(slug: string) {
  const [store, setStore] = useState<PublicStore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStore = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await vendorService.getPublicStore(slug);
      setStore(data);
    } catch (err: any) {
      setError(err?.message || `Store '${slug}' not found.`);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  return {
    store,
    isLoading,
    error,
    refetch: fetchStore,
  };
}
