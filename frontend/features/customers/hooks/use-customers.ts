/**
 * frontend/features/customers/hooks/use-customers.ts
 * ==================================================
 * SWR Hook for reactive Customer Management, search filtering, and actions.
 */

"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { customerService } from "../services/customer-service";
import { CustomerFilterParams, AdminCustomerItem, AdminCustomerStats } from "../types";

export function useCustomers(initialFilters: CustomerFilterParams = { status: "ALL", ordering: "-created_at" }) {
  const [filters, setFilters] = useState<CustomerFilterParams>(initialFilters);

  const key = ["/admin/customers/", filters.search, filters.status, filters.ordering];

  const {
    data: customerData,
    error: customerError,
    isLoading: isLoadingCustomers,
    isValidating,
    mutate: mutateCustomers,
  } = useSWR(
    key,
    () => customerService.getCustomers(filters),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const {
    data: statsData,
    error: statsError,
    isLoading: isLoadingStats,
    mutate: mutateStats,
  } = useSWR(
    "/admin/customers/stats/",
    () => customerService.getCustomerStats(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const setFilterParam = useCallback((key: keyof CustomerFilterParams, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ status: "ALL", ordering: "-created_at", search: "" });
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([
      mutateCustomers(),
      mutateStats(),
    ]);
  }, [mutateCustomers, mutateStats]);

  const toggleStatus = useCallback(
    async (customerId: string, targetActive?: boolean) => {
      const res = await customerService.toggleCustomerStatus(customerId, targetActive);
      await refetch();
      return res;
    },
    [refetch]
  );

  const verifyEmail = useCallback(
    async (customerId: string) => {
      const res = await customerService.verifyCustomerEmail(customerId);
      await refetch();
      return res;
    },
    [refetch]
  );

  return {
    customers: (customerData?.customers || []) as AdminCustomerItem[],
    totalCount: customerData?.count ?? 0,
    stats: statsData?.stats as AdminCustomerStats | undefined,
    filters,
    setFilterParam,
    resetFilters,
    isLoading: isLoadingCustomers || isLoadingStats,
    isValidating,
    error: customerError || statsError,
    refetch,
    toggleStatus,
    verifyEmail,
  };
}
