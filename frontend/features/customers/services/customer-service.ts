/**
 * frontend/features/customers/services/customer-service.ts
 * =======================================================
 * API service for Admin Customer Management, Analytics, and Actions.
 */

import { apiClient } from "@/lib/api";
import {
  AdminCustomerItem,
  AdminCustomerDetail,
  AdminCustomerStats,
  CustomerFilterParams,
} from "../types";

export const customerService = {
  /**
   * Retrieves all customers with optional search, status filtering, and sorting.
   */
  async getCustomers(
    params: CustomerFilterParams = {}
  ): Promise<{ success: boolean; count: number; customers: AdminCustomerItem[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.ordering) query.set("ordering", params.ordering);

    const queryString = query.toString();
    const endpoint = `/admin/customers/${queryString ? `?${queryString}` : ""}`;
    return apiClient<{ success: boolean; count: number; customers: AdminCustomerItem[] }>(endpoint);
  },

  /**
   * Retrieves high-level aggregated customer metrics.
   */
  async getCustomerStats(): Promise<{ success: boolean; stats: AdminCustomerStats }> {
    return apiClient<{ success: boolean; stats: AdminCustomerStats }>("/admin/customers/stats/");
  },

  /**
   * Retrieves single customer full profile with addresses and orders.
   */
  async getCustomerDetail(
    id: string
  ): Promise<{ success: boolean; customer: AdminCustomerDetail }> {
    return apiClient<{ success: boolean; customer: AdminCustomerDetail }>(`/admin/customers/${id}/`);
  },

  /**
   * Toggles customer account status (Activate / Suspend).
   */
  async toggleCustomerStatus(
    id: string,
    isActive?: boolean
  ): Promise<{ success: boolean; message: string; is_active: boolean }> {
    return apiClient<{ success: boolean; message: string; is_active: boolean }>(
      `/admin/customers/${id}/toggle-status/`,
      {
        method: "POST",
        body: JSON.stringify(isActive !== undefined ? { is_active: isActive } : {}),
      }
    );
  },

  /**
   * Manually verifies a customer's email.
   */
  async verifyCustomerEmail(
    id: string
  ): Promise<{ success: boolean; message: string; is_email_verified: boolean }> {
    return apiClient<{ success: boolean; message: string; is_email_verified: boolean }>(
      `/admin/customers/${id}/verify-email/`,
      {
        method: "POST",
      }
    );
  },
};
