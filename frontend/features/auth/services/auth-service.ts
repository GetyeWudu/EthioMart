/**
 * frontend/features/auth/services/auth-service.ts
 * ===============================================
 * Typed service connecting frontend UI to Django Auth & Staff API endpoints.
 */

import { apiClient } from "@/lib/api";
import {
  AuthResponse,
  CustomerRegisterPayload,
  SellerRegisterPayload,
  LoginPayload,
  GoogleAuthPayload,
  StaffCreatePayload,
  User,
} from "../types";

export const authService = {
  /**
   * Register a new Customer.
   */
  async registerCustomer(payload: CustomerRegisterPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register/customer/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Register a new Merchant / Seller.
   */
  async registerSeller(payload: SellerRegisterPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register/seller/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Login with email and password.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Google OAuth token exchange.
   */
  async googleAuth(payload: GoogleAuthPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/google/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Logout user, blacklist token, and clear cookies.
   */
  async logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },

  /**
   * Fetch invite details.
   */
  async getInviteDetails(token: string): Promise<any> {
    return apiClient<any>(`/vendors/staff/invite-details/?token=${token}`, {
      method: "GET",
    });
  },

  /**
   * Accept an invite and register/login.
   */
  async acceptInvite(payload: any): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/vendors/staff/accept-invite/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get current authenticated user profile.
   */
  async getMe(): Promise<{ success: boolean; user: User }> {
    return apiClient<{ success: boolean; user: User }>("/auth/me/", {
      method: "GET",
    });
  },

  /**
   * Update profile.
   */
  async updateMe(payload: Partial<User>): Promise<{ success: boolean; user: User }> {
    return apiClient<{ success: boolean; user: User }>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Verify email via signed token.
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Request password reset email.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>("/auth/password/reset/request/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Confirm password reset with new password.
   */
  async confirmPasswordReset(payload: { token: string; new_password: string; confirm_password: string }): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>("/auth/password/reset/confirm/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Super Admin only: provision an Operational Admin or Super Admin.
   */
  async provisionStaff(payload: StaffCreatePayload): Promise<{ success: boolean; user: User; temporary_password?: string }> {
    return apiClient<{ success: boolean; user: User; temporary_password?: string }>("/auth/admin/staff/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
