/**
 * features/inventory/services/inventory-service.ts
 * ================================================
 * API service for multi-location inventory, stock ledger adjustments, and staff delegation.
 */

import { apiClient } from "@/lib/api";
import {
  WarehouseLocation,
  WarehouseStock,
  StockMovement,
  VendorStaffMember,
  StockAdjustmentPayload,
  StockTransferPayload,
  StaffInvitePayload,
} from "../types";

export const inventoryService = {
  // -------------------------------------------------------------
  // Warehouse Facilities
  // -------------------------------------------------------------
  getWarehouses: async (): Promise<WarehouseLocation[]> => {
    return apiClient<WarehouseLocation[]>("/inventory/warehouses/");
  },

  createWarehouse: async (payload: Partial<WarehouseLocation>): Promise<WarehouseLocation> => {
    return apiClient<WarehouseLocation>("/inventory/warehouses/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateWarehouse: async (id: string, payload: Partial<WarehouseLocation>): Promise<WarehouseLocation> => {
    return apiClient<WarehouseLocation>(`/inventory/warehouses/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  setPrimaryWarehouse: async (id: string): Promise<WarehouseLocation> => {
    return apiClient<WarehouseLocation>(`/inventory/warehouses/${id}/set-primary/`, {
      method: "POST",
    });
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    return apiClient<void>(`/inventory/warehouses/${id}/`, {
      method: "DELETE",
    });
  },

  // -------------------------------------------------------------
  // Multi-Hub Stock & Ledger
  // -------------------------------------------------------------
  getStocks: async (params?: { warehouse_id?: string; search?: string; low_stock?: boolean }): Promise<WarehouseStock[]> => {
    return apiClient<WarehouseStock[]>("/inventory/stock/", { params });
  },

  adjustStock: async (payload: StockAdjustmentPayload): Promise<WarehouseStock> => {
    return apiClient<WarehouseStock>("/inventory/stock/adjust/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  transferStock: async (payload: StockTransferPayload): Promise<{ status: string; message: string }> => {
    return apiClient<{ status: string; message: string }>("/inventory/stock/transfer/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMovements: async (params?: { warehouse?: string; sku?: string; page?: number }): Promise<StockMovement[]> => {
    return apiClient<StockMovement[]>("/inventory/stock/movements/", { params });
  },

  // -------------------------------------------------------------
  // Staff Roles & Delegation (/vendors/staff/)
  // -------------------------------------------------------------
  getStaffMembers: async (): Promise<VendorStaffMember[]> => {
    return apiClient<VendorStaffMember[]>("/vendors/staff/");
  },

  inviteStaffMember: async (payload: { email: string; role: string; assigned_warehouse_id?: string }): Promise<any> => {
    // Map assigned_warehouse_id to assigned_facility_id for the backend
    const apiPayload = {
      email: payload.email,
      role: payload.role,
      assigned_facility_id: payload.assigned_warehouse_id
    };
    return apiClient<any>("/vendors/staff/", {
      method: "POST",
      body: JSON.stringify(apiPayload),
    });
  },

  removeStaffMember: async (id: string): Promise<void> => {
    return apiClient<void>(`/vendors/staff/${id}/`, {
      method: "DELETE",
    });
  },
};
