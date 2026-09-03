/**
 * features/products/types.ts
 * ==========================
 * TypeScript definitions for Catalog, Taxonomy, Attributes, and Products.
 */

export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "ARCHIVED";

export type ProductType = "SIMPLE" | "CONFIGURABLE_VARIANT";

export type AttributeType =
  | "TEXT"
  | "NUMBER"
  | "SELECT"
  | "MULTI_SELECT"
  | "BOOLEAN";

export interface CategoryNode {
  id: string;
  name: string;
  name_am?: string;
  slug: string;
  depth: number;
  icon?: string;
  image?: string;
  commission_rate_override?: string | null;
  effective_commission_rate?: string;
  is_leaf: boolean;
  product_count?: number;
  full_path?: string;
  children: CategoryNode[];
  attributes?: CategoryAttributeBinding[];
}

export interface RootCategory {
  id: string;
  name: string;
  name_am?: string;
  slug: string;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string;
  website?: string;
  is_verified: boolean;
  product_count?: number;
  categories?: { id: string; name: string; slug: string }[];
}

export interface AttributeValue {
  id: string;
  value: string;
  value_am?: string;
  color_code?: string;
}

export interface Attribute {
  id: string;
  name: string;
  name_am?: string;
  attribute_type: AttributeType;
  unit?: string;
  values: AttributeValue[];
}

export interface CategoryAttributeBinding {
  id: string;
  attribute: Attribute;
  is_variant_creator: boolean;
  is_required: boolean;
  is_filterable: boolean;
}

export interface ProductImage {
  id: string;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  price: string;
  compare_at_price?: string;
  cost_price?: string;
  weight_kg?: string;
  is_default: boolean;
  is_active: boolean;
  attribute_values: {
    attribute_id: string;
    attribute_name: string;
    value_id: string;
    value: string;
    color_code?: string;
  }[];
  total_available_stock: number;
  warehouse_stocks?: {
    warehouse_id: string;
    warehouse_name: string;
    warehouse_code: string;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    is_pickup_point?: boolean;
  }[];
}

export interface ProductSpecification {
  attribute_name: string;
  value: string;
  unit?: string;
}

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  price: string;
  compare_at_price?: string;
  category_name: string;
  category_slug: string;
  brand_name?: string;
  vendor_name: string;
  vendor_slug: string;
  vendor_tier?: "PROBATION" | "TRUSTED" | "VIP";
  vendor_location?: string;
  primary_image?: string;
  status: ProductStatus;
  product_type: ProductType;
  total_available_stock: number;
  price_display?: string;
  min_price?: string;
  max_price?: string;
  original_price?: string;
  effective_price?: string;
  discount_percentage?: number;
  promotion_badge?: string;
  default_variant_id?: string;
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  can_be_hard_deleted?: boolean;
}

export interface ProductDetail {
  id: string;
  title: string;
  title_am?: string;
  slug: string;
  short_description?: string;
  description: string;
  category: {
    id: string;
    name: string;
    slug: string;
    breadcrumbs?: { name: string; slug: string }[];
  };
  brand?: Brand;
  vendor: {
    id: string;
    store_name: string;
    slug: string;
    tier: "PROBATION" | "TRUSTED" | "VIP";
    city?: string;
  };
  product_type: ProductType;
  status: ProductStatus;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  custom_specifications?: Record<string, string>;
  price: string;
  compare_at_price?: string;
  price_display?: string;
  min_price?: string;
  max_price?: string;
  original_price?: string;
  effective_price?: string;
  discount_percentage?: number;
  promotion_badge?: string;
  avg_rating?: number;
  review_count?: number;
  shipping_class?: "STANDARD" | "HEAVY" | "BULKY" | "FRAGILE" | "DIGITAL";
  weight_kg?: number | string;
  length_cm?: number | string;
  width_cm?: number | string;
  height_cm?: number | string;
  total_available_stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  title: string;
  title_am?: string;
  category_id: string;
  brand_id?: string;
  short_description?: string;
  description: string;
  product_type: ProductType;
  // Shipping & Dimensions
  shipping_class?: "STANDARD" | "HEAVY" | "BULKY" | "FRAGILE" | "DIGITAL";
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  // For SIMPLE products
  price?: number;
  compare_at_price?: number;
  initial_stock?: number;
  warehouse_id?: string;
  // Custom technical specifications (JSON key-value)
  custom_specifications?: Record<string, string>;
  // Specifications
  specifications?: { attribute_id: string; value_id?: string; custom_value?: string }[];
  // Configurable variants
  variants?: {
    sku?: string;
    price: number;
    compare_at_price?: number;
    weight_kg?: number;
    initial_stock?: number;
    attribute_value_ids: string[];
  }[];
}
