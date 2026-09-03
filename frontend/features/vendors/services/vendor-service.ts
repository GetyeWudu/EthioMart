/**
 * frontend/features/vendors/services/vendor-service.ts
 * ===================================================
 * Complete API service for GechExpress Vendor domain:
 *   - Seller Self-Service (/api/v1/vendors/me/...)
 *   - Public Storefront (/api/v1/vendors/...)
 *   - Admin Moderation (/api/v1/admin/vendors/...)
 */

import { apiClient } from "@/lib/api";
import {
  VendorProfile,
  VendorWallet,
  VendorLedgerEntry,
  PayoutRequest,
  VendorBankDetails,
  KYCDocument,
  AdminVendorListItem,
  AdminVendorDetail,
  PublicStore,
  KYCSubmitPayload,
  UpdateVendorProfilePayload,
} from "../types";

export const vendorService = {
  // ─── 1. Seller Self-Service (/api/v1/vendors/me/) ─────────────────────────

  /**
   * Retrieves or auto-creates the authenticated seller's profile.
   */
  async getSellerProfile(): Promise<VendorProfile> {
    return apiClient<VendorProfile>("/vendors/me/");
  },

  /**
   * Updates store branding, contact, or location details.
   */
  async updateSellerProfile(
    payload: UpdateVendorProfilePayload | FormData
  ): Promise<VendorProfile> {
    return apiClient<VendorProfile>("/vendors/me/", {
      method: "PATCH",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  },

  /**
   * Retrieves the seller's wallet snapshot (available balance, 72h escrow pending, total withdrawn, lock status).
   */
  async getSellerWallet(): Promise<VendorWallet> {
    return apiClient<VendorWallet>("/vendors/me/wallet/");
  },

  /**
   * Retrieves the seller's financial ledger entries (escrow credits, releases, MoR VAT breakdowns, withdrawals).
   */
  async getSellerLedger(): Promise<VendorLedgerEntry[]> {
    return apiClient<VendorLedgerEntry[]>("/vendors/me/ledger/");
  },

  /**
   * Dispatches a seller payout withdrawal request (Chapa Transfer API).
   */
  async requestWithdrawal(payload: {
    amount: number | string;
    bank_code?: string;
    account_number?: string;
    account_name?: string;
    bank_name?: string;
  }): Promise<any> {
    return apiClient<any>("/vendors/me/wallet/withdraw/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves the list of historical and pending payout requests.
   */
  async getPayoutRequests(): Promise<any[]> {
    return apiClient<any[]>("/vendors/me/payouts/");
  },

  /**
   * Retrieves supported Ethiopian banks and mobile wallets from Chapa directory.
   */
  async getSupportedBanks(): Promise<{ success: boolean; banks: { id: string; name: string; code: string }[] }> {
    return apiClient<{ success: boolean; banks: { id: string; name: string; code: string }[] }>("/payments/banks/");
  },

  /**
   * Retrieves the seller's saved bank settlement details.
   */
  async getSellerBankDetails(): Promise<VendorBankDetails> {
    return apiClient<VendorBankDetails>("/vendors/me/bank/");
  },

  /**
   * Creates or updates the seller's bank payout details.
   */
  async saveSellerBankDetails(
    data: Omit<VendorBankDetails, "id" | "chapa_subaccount_id">
  ): Promise<VendorBankDetails> {
    return apiClient<VendorBankDetails>("/vendors/me/bank/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Lists all uploaded KYC regulatory documents for the authenticated seller.
   */
  async getSellerDocuments(): Promise<KYCDocument[]> {
    return apiClient<KYCDocument[]>("/vendors/me/documents/");
  },

  /**
   * Uploads a single KYC document file with its document_type and optional document_number.
   */
  async uploadSellerDocument(formData: FormData): Promise<KYCDocument> {
    return apiClient<KYCDocument>("/vendors/me/documents/", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Deletes an unverified KYC document.
   */
  async deleteSellerDocument(docId: string): Promise<void> {
    return apiClient<void>(`/vendors/me/documents/${docId}/`, {
      method: "DELETE",
    });
  },

  /**
   * Submits KYC details for compliance verification.
   * Transitions seller from DRAFT/REJECTED to PENDING_REVIEW.
   */
  async submitKYCReview(payload: KYCSubmitPayload = {}): Promise<VendorProfile> {
    return apiClient<VendorProfile>("/vendors/me/kyc/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── 2. Public Storefront (/api/v1/vendors/) ──────────────────────────────

  /**
   * Lists approved active stores with optional search filtering.
   */
  async listPublicStores(params?: {
    search?: string;
    page_size?: number;
  }): Promise<{ count: number; results: PublicStore[] }> {
    return apiClient<{ count: number; results: PublicStore[] }>("/vendors/", {
      params: {
        search: params?.search,
        page_size: params?.page_size ?? 24,
      },
    });
  },

  /**
   * Retrieves an approved store's public profile by slug.
   */
  async getPublicStore(slug: string): Promise<PublicStore> {
    return apiClient<PublicStore>(`/vendors/${slug}/`);
  },

  // ─── 3. Admin Moderation (/api/v1/admin/vendors/) ─────────────────────────

  /**
   * Lists all vendors for moderation with filters.
   */
  async listAdminVendors(params?: {
    status?: string;
    vendor_type?: string;
    tier?: string;
    search?: string;
  }): Promise<{ count: number; results: AdminVendorListItem[] }> {
    return apiClient<{ count: number; results: AdminVendorListItem[] }>(
      "/admin/vendors/",
      {
        params: {
          status: params?.status && params.status !== "ALL" ? params.status : undefined,
          vendor_type: params?.vendor_type && params.vendor_type !== "ALL" ? params.vendor_type : undefined,
          tier: params?.tier && params.tier !== "ALL" ? params.tier : undefined,
          search: params?.search || undefined,
        },
      }
    );
  },

  /**
   * Full admin vendor detail view.
   */
  async getAdminVendor(id: string): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/`);
  },

  /**
   * Approves a vendor's KYC application.
   */
  async approveVendor(id: string): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/approve/`, {
      method: "POST",
    });
  },

  /**
   * Rejects a vendor's KYC application with a mandatory reason.
   */
  async rejectVendor(id: string, reason: string): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Suspends an approved vendor store with a mandatory reason.
   */
  async suspendVendor(id: string, reason: string): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/suspend/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Reactivates a suspended vendor store.
   */
  async reactivateVendor(id: string): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/reactivate/`, {
      method: "POST",
    });
  },

  /**
   * Updates a vendor's commission rate (Super Admin only).
   */
  async updateCommissionRate(
    id: string,
    commissionRate: number | string
  ): Promise<AdminVendorDetail> {
    return apiClient<AdminVendorDetail>(`/admin/vendors/${id}/commission/`, {
      method: "PATCH",
      body: JSON.stringify({ commission_rate: String(commissionRate) }),
    });
  },

  /**
   * Manually triggers Chapa subaccount provisioning retry.
   */
  async retryChapaProvisioning(id: string): Promise<{ detail: string }> {
    return apiClient<{ detail: string }>(`/admin/vendors/${id}/retry-chapa/`, {
      method: "POST",
    });
  },
};
