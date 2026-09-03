/**
 * features/inventory/types.ts
 * ============================
 * TypeScript domain contracts for Multi-Warehouse Inventory & Scoped Staff RBAC.
 */

export type StaffRole =
  | "OWNER"
  | "MANAGER"
  | "INVENTORY_CLERK"
  | "ORDER_FULFILLMENT"
  | "CUSTOMER_SUPPORT";

export type MovementType =
  | "PURCHASE_RECEIPT"
  | "ORDER_FULFILLMENT"
  | "DAMAGED_WRITE_OFF"
  | "CUSTOMER_RETURN"
  | "INVENTORY_COUNT_CORRECTION"
  | "TRANSFER_OUT"
  | "TRANSFER_IN";

export interface WarehouseLocation {
  id: string;
  vendor_id: string;
  name: string;
  code: string;
  city: string;
  subcity?: string;
  wereda?: string;
  street_address?: string;
  contact_name?: string;
  contact_phone?: string;
  is_active: boolean;
  is_default: boolean;
  is_pickup_point: boolean;
  pickup_operating_hours?: string;
  sku_count?: number;
  total_units?: number;
  created_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  warehouse_city: string;
  is_pickup_point?: boolean;
  variant_id: string;
  product_id?: string;
  product_title: string;
  sku: string;
  variant_attributes?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  low_stock_threshold: number;
  is_low_stock?: boolean;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  warehouse_name: string;
  warehouse_code: string;
  variant_sku: string;
  product_title?: string;
  variant_name?: string;
  movement_type: MovementType;
  movement_type_display: string;
  quantity_delta: number;
  balance_after: number;
  notes?: string;
  reference_order_id?: string;
  created_at: string;
}

export interface VendorStaffMember {
  id: string;
  vendor_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  role: StaffRole;
  role_display: string;
  assigned_facility?: string;
  facility_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface StockAdjustmentPayload {
  warehouse_id: string;
  variant_id: string;
  quantity_delta: number;
  movement_type: MovementType;
  notes?: string;
}

export interface StockTransferPayload {
  source_warehouse_id: string;
  target_warehouse_id: string;
  variant_id: string;
  quantity: number;
  notes?: string;
}

export interface StaffInvitePayload {
  email: string;
  role: StaffRole;
  assigned_warehouse_id?: string;
}
