/**
 * frontend/features/auth/types.ts
 * ===============================
 * TypeScript data contracts matching EthioMart Django User & Auth models.
 */

export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string | null;
  role: UserRole;
  is_active?: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  avatar?: string | null;
  vendor_staff_role?: string | null;
  assigned_facility_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  access: string;
  refresh: string;
}

export interface CustomerRegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
  newsletter?: boolean;
}

export interface SellerRegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  allowed_category_ids?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  id_token: string;
  role?: "CUSTOMER" | "SELLER";
}

export interface StaffCreatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  is_superuser: boolean;
}

export interface JWTPayloadClaims {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  exp: number;
}
