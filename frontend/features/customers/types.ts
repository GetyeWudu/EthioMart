/**
 * frontend/features/customers/types.ts
 * ====================================
 * TypeScript interfaces for Admin Customer Management & Analytics.
 */

export interface CustomerAddress {
  id: string;
  full_name: string;
  phone_number: string;
  city: string;
  subcity: string;
  woreda?: string;
  house_no?: string;
  landmark?: string;
  is_default: boolean;
}

export interface CustomerOrderSummary {
  id: string;
  order_number: string;
  total_amount: string;
  payment_status: "PENDING" | "PAID" | "FAILED";
  delivery_method: string;
  created_at: string;
  items_count: number;
}

export interface CustomerDisputeSummary {
  id: string;
  reason: string;
  reason_display: string;
  status: "UNDER_REVIEW" | "REFUNDED" | "REJECTED" | "CLOSED";
  status_display: string;
  disputed_amount: string;
  refund_amount: string;
  created_at: string;
}

export interface AdminCustomerItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  avatar: string | null;
  google_id: string | null;
  created_at: string;
  total_orders: number;
  total_spent: string;
  disputes_count: number;
  last_order_date: string | null;
}

export interface AdminCustomerDetail extends AdminCustomerItem {
  updated_at: string;
  addresses: CustomerAddress[];
  orders: CustomerOrderSummary[];
  disputes: CustomerDisputeSummary[];
}

export interface AdminCustomerStats {
  total_customers: number;
  active_customers: number;
  verified_customers: number;
  inactive_customers: number;
  new_this_month: number;
  total_spent_etb: string;
  total_orders_placed: number;
}

export interface CustomerFilterParams {
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE" | "VERIFIED" | "UNVERIFIED";
  ordering?: string;
}
