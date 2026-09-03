/**
 * frontend/features/vendors/hooks/use-vendor-wallet.ts
 * ===================================================
 * React hook for fetching and managing real-time VendorWallet projections with SWR caching.
 */

"use client";

import useSWR, { mutate } from "swr";
import { vendorService } from "../services/vendor-service";
import { VendorWallet } from "../types";

export function useVendorWallet() {
  const {
    data: wallet,
    error,
    isLoading,
    mutate: refetch,
  } = useSWR<VendorWallet>("/vendors/me/wallet/", () => vendorService.getSellerWallet(), {
    revalidateOnFocus: true,
    refreshInterval: 10000, // Background polling every 10 seconds for real-time ledger updates
  });

  return {
    wallet: wallet || null,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
