/**
 * frontend/features/vendors/types.ts
 * ==================================
 * TypeScript domain contracts for the EthioMart vendors domain,
 * matching Django apps.vendors models, enums, and serializers.
 */

export type VendorType = "PLATFORM" | "THIRD_PARTY";

export type VendorStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type TrustTier = "PROBATION" | "TRUSTED" | "VIP";

export type BusinessType =
  | "INDIVIDUAL"
  | "SOLE_PROPRIETORSHIP"
  | "PLC"
  | "SHARE_COMPANY";

export type DocumentType =
  | "TIN_CERTIFICATE"
  | "VAT_CERTIFICATE"
  | "TRADE_LICENSE"
  | "FAYDA_ID"
  | "PASSPORT_OR_KEBELE"
  | "POWER_OF_ATTORNEY"
  | "OTHER";

export interface KYCDocument {
  id: string;
  document_type: DocumentType;
  document_type_display: string;
  file: string;
  document_number?: string;
  is_verified: boolean;
  notes?: string;
  created_at: string;
}

export interface VendorBankDetails {
  id?: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  chapa_subaccount_id?: string;
}

export interface VendorWallet {
  available_balance: string;
  pending_balance: string;
  locked_payout_balance?: string;
  total_withdrawn: string;
  is_payout_locked: boolean;
  lock_reason?: string;
}

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED";

export interface PayoutRequest {
  id: string;
  requested_amount: string;
  transfer_fee: string;
  disbursed_amount: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_reference: string;
  status: PayoutStatus;
  status_display: string;
  failure_reason?: string;
  completed_at?: string;
  created_at: string;
}

export type LedgerEntryType = "ESCROW_CREDIT" | "ESCROW_RELEASE" | "ESCROW_REFUND" | "WITHDRAWAL";

export interface VendorLedgerEntry {
  id: string;
  sub_order_id?: string | null;
  entry_type: LedgerEntryType;
  entry_type_display: string;
  amount: string;
  commission_rate: string;
  commission_deducted: string;
  platform_net_revenue: string;
  platform_vat_amount: string;
  seller_vat_advisory: string;
  is_vat_registered_vendor: boolean;
  net_amount: string;
  notes: string;
  created_at: string;
}

export interface VendorProfile {
  id: string;
  store_name: string;
  slug: string;
  status: VendorStatus;
  status_display: string;
  vendor_type: VendorType;
  is_verified: boolean;
  verified_at: string | null;
  rejection_reason?: string;
  suspension_reason?: string;
  tier: TrustTier;
  tier_display: string;
  dispute_rate: string;
  cancellation_rate: string;
  total_completed_orders: number;
  business_type: BusinessType;
  business_type_display: string;
  tin_number: string;
  vat_registered: boolean;
  vat_number?: string;
  business_license_number?: string;
  contact_email?: string;
  contact_phone?: string;
  city: string;
  subcity?: string;
  wereda?: string;
  street_address?: string;
  commission_rate: string;
  store_description?: string;
  store_logo: string | null;
  store_banner: string | null;
  bank_details?: VendorBankDetails | null;
  kyc_documents?: KYCDocument[];
  allowed_categories?: { id: string; name: string; slug: string; name_am?: string }[];
  wallet?: VendorWallet | null;
  created_at: string;
  updated_at: string;
}

export interface AdminVendorListItem {
  id: string;
  store_name: string;
  slug: string;
  seller_email: string;
  vendor_type: VendorType;
  status: VendorStatus;
  status_display: string;
  tier: TrustTier;
  tier_display: string;
  is_verified: boolean;
  commission_rate: string;
  created_at: string;
}

export interface AdminVendorDetail extends VendorProfile {
  seller_email: string;
  seller_name: string;
  verified_by?: string | null;
}

export interface StorePromotion {
  name: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number;
  is_coupon_required: boolean;
  coupon_code?: string | null;
  scope_type: string;
}

export interface PublicStore {
  slug: string;
  store_name: string;
  store_description: string;
  store_logo: string | null;
  store_banner: string | null;
  city: string;
  contact_email: string;
  contact_phone: string;
  is_verified?: boolean;
  tier?: TrustTier;
  tier_display?: string;
  product_count?: number;
  active_promotions?: StorePromotion[];
}

export interface KYCSubmitPayload {
  business_type?: BusinessType;
  tin_number?: string;
  vat_registered?: boolean;
  vat_number?: string;
  business_license_number?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  subcity?: string;
  wereda?: string;
  street_address?: string;
}

export interface UpdateVendorProfilePayload {
  store_name?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  subcity?: string;
  wereda?: string;
  street_address?: string;
}
