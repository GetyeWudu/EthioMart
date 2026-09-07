/**
 * features/products/services/catalog-service.ts
 * ============================================
 * API service for taxonomy, public catalog, seller products, and admin moderation.
 */

import { apiClient } from "@/lib/api";
import {
  CategoryNode,
  Brand,
  Attribute,
  ProductListItem,
  ProductDetail,
  CreateProductPayload,
  ProductImage,
  AttributeValue,
  CategoryAttributeBinding,
} from "../types";

export const catalogService = {
  // -------------------------------------------------------------
  // Public Storefront APIs
  // -------------------------------------------------------------
  getCategoryTree: async (): Promise<CategoryNode[]> => {
    return apiClient<CategoryNode[]>("/catalog/categories/");
  },

  getRootCategories: async (): Promise<{ id: string; name: string; name_am?: string; slug: string; icon?: string }[]> => {
    return apiClient<{ id: string; name: string; name_am?: string; slug: string; icon?: string }[]>("/catalog/categories/root/");
  },

  getCategoryBySlug: async (slug: string): Promise<CategoryNode> => {
    return apiClient<CategoryNode>(`/catalog/categories/${slug}/`);
  },

  getLeafCategories: async (): Promise<{ id: string; name: string; name_am?: string; slug: string; icon?: string }[]> => {
    return apiClient<{ id: string; name: string; name_am?: string; slug: string; icon?: string }[]>("/catalog/categories/leaf/");
  },

  getCategoryAttributes: async (categoryId: string, isVariantCreator?: boolean): Promise<any[]> => {
    const params = isVariantCreator !== undefined ? { is_variant_creator: isVariantCreator } : undefined;
    // Wait, the API for category attributes is /api/v1/catalog/categories/<slug>/
    // but we can just use getCategoryBySlug and pull category_attributes, or we need to add GET /admin/categories/<pk>/attributes/ or similar?
    // Let's create an endpoint in backend if it doesn't exist, or just use the slug endpoint.
    return apiClient<any[]>(`/catalog/categories/${categoryId}/attributes/`, { params });
  },

  getBrands: async (): Promise<Brand[]> => {
    return apiClient<Brand[]>("/catalog/brands/");
  },

  createSellerBrand: async (name: string): Promise<Brand> => {
    return apiClient<Brand>("/catalog/brands/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  getCategoryBrands: async (categoryId: string): Promise<Brand[]> => {
    return apiClient<Brand[]>(`/catalog/categories/${categoryId}/brands/`);
  },

  getPublicProducts: async (params?: {
    category?: string;
    brand?: string;
    vendor?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    deals?: boolean;
    on_sale?: boolean;
    in_stock?: boolean;
    featured?: boolean;
  }): Promise<ProductListItem[]> => {
    return apiClient<ProductListItem[]>("/catalog/products/", { params });
  },

  getProductBySlug: async (slug: string): Promise<ProductDetail> => {
    return apiClient<ProductDetail>(`/catalog/products/${slug}/`);
  },

  getProductRecommendations: async (
    slug: string
  ): Promise<{ similar_items: ProductListItem[]; store_items: ProductListItem[] }> => {
    return apiClient<{ similar_items: ProductListItem[]; store_items: ProductListItem[] }>(
      `/catalog/products/${slug}/recommendations/`
    );
  },

  // -------------------------------------------------------------
  // Seller Portal APIs
  // -------------------------------------------------------------
  getSellerProducts: async (params?: { 
    status?: string; 
    search?: string; 
    archived?: string;
    category?: string;
    ordering?: string;
  }): Promise<ProductListItem[]> => {
    return apiClient<ProductListItem[]>("/catalog/seller/products/", { params });
  },

  getSellerProductDetail: async (id: string): Promise<ProductDetail> => {
    return apiClient<ProductDetail>(`/catalog/seller/products/${id}/`);
  },

  createProduct: async (payload: CreateProductPayload): Promise<ProductDetail> => {
    return apiClient<ProductDetail>("/catalog/seller/products/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateProduct: async (id: string, payload: any): Promise<ProductDetail> => {
    return apiClient<ProductDetail>(`/catalog/seller/products/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    return apiClient<void>(`/catalog/seller/products/${id}/`, {
      method: "DELETE",
    });
  },

  submitProductForReview: async (id: string): Promise<{ status: string; message?: string; errors?: string[] }> => {
    return apiClient<{ status: string; message?: string; errors?: string[] }>(`/catalog/seller/products/${id}/submit/`, {
      method: "POST",
    });
  },

  uploadProductImage: async (productId: string, file: File, isPrimary: boolean = false): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("is_primary", String(isPrimary));

    return apiClient<ProductImage>(`/catalog/seller/products/${productId}/images/`, {
      method: "POST",
      body: formData,
    });
  },

  createSellerAttributeValue: async (attributeId: string, value: string): Promise<AttributeValue> => {
    return apiClient<AttributeValue>(`/catalog/seller/attributes/${attributeId}/values/`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  },

  adjustStock: async (payload: { variant_id: string; warehouse_id: string; quantity_delta: number; movement_type: string; notes?: string }): Promise<any> => {
    return apiClient<any>("/inventory/stock/adjust/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------------
  // Admin Moderation & Taxonomy APIs

  // -------------------------------------------------------------
  getAdminProducts: async (params?: { status?: string; search?: string; page?: number }): Promise<{ success: boolean; pagination: { count: number; total_pages: number; current_page: number; next: string | null; previous: string | null; }; results: ProductListItem[] }> => {
    return apiClient<{ success: boolean; pagination: { count: number; total_pages: number; current_page: number; next: string | null; previous: string | null; }; results: ProductListItem[] }>("/catalog/admin/products/", { params });
  },

  getAdminProductDetail: async (id: string): Promise<ProductDetail> => {
    return apiClient<ProductDetail>(`/catalog/admin/products/${id}/`);
  },

  approveProduct: async (id: string): Promise<{ status: string; message: string }> => {
    return apiClient<{ status: string; message: string }>(`/catalog/admin/products/${id}/approve/`, {
      method: "POST",
    });
  },

  rejectProduct: async (id: string, reason: string): Promise<{ status: string; message: string }> => {
    return apiClient<{ status: string; message: string }>(`/catalog/admin/products/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  createCategory: async (payload: { name: string; name_am?: string; parent_id?: string; icon?: string; commission_rate_override?: number | string | null }): Promise<CategoryNode> => {
    return apiClient<CategoryNode>("/catalog/admin/categories/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCategory: async (id: string, payload: { name?: string; name_am?: string; parent_id?: string; icon?: string; commission_rate_override?: number | string | null }): Promise<CategoryNode> => {
    return apiClient<CategoryNode>(`/catalog/admin/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    return apiClient<void>(`/catalog/admin/categories/${id}/`, {
      method: "DELETE",
    });
  },

  getAttributes: async (): Promise<Attribute[]> => {
    return apiClient<Attribute[]>("/catalog/admin/attributes/");
  },

  createAttribute: async (payload: { name: string; name_am?: string; attribute_type: string; unit?: string }): Promise<Attribute> => {
    return apiClient<Attribute>("/catalog/admin/attributes/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAttribute: async (id: string, payload: { name?: string; name_am?: string; unit?: string }): Promise<Attribute> => {
    return apiClient<Attribute>(`/catalog/admin/attributes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  createAttributeValue: async (attributeId: string, data: { value: string; value_am?: string; color_code?: string }): Promise<AttributeValue> => {
    return apiClient<AttributeValue>(`/catalog/admin/attributes/${attributeId}/values/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteAttributeValue: async (attributeId: string, valueId: string): Promise<void> => {
    return apiClient<void>(`/catalog/admin/attributes/${attributeId}/values/${valueId}/`, {
      method: "DELETE",
    });
  },

  bindCategoryAttribute: async (
    categoryId: string,
    attributeId: string,
    data: { is_required?: boolean; is_variant_creator?: boolean; is_filterable?: boolean }
  ): Promise<CategoryAttributeBinding> => {
    return apiClient<CategoryAttributeBinding>(`/catalog/admin/categories/${categoryId}/attributes/`, {
      method: "POST",
      body: JSON.stringify({ attribute_id: attributeId, ...data }),
    });
  },

  getAllCategoryAttributeBindings: async (): Promise<any[]> => {
    const data = await apiClient<any>("/catalog/admin/category-attributes/");
    return data.results || data;
  },

  deleteCategoryAttributeBinding: async (bindingId: string): Promise<void> => {
    return apiClient<void>(`/catalog/admin/category-attributes/${bindingId}/`, {
      method: "DELETE",
    });
  },

  createBrand: async (data: any): Promise<Brand> => {
    return apiClient<Brand>("/catalog/admin/brands/", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  updateBrand: async (brandId: string, data: any): Promise<Brand> => {
    return apiClient<Brand>(`/catalog/admin/brands/${brandId}/`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  deleteBrand: async (brandId: string): Promise<void> => {
    return apiClient<void>(`/catalog/admin/brands/${brandId}/`, {
      method: "DELETE",
    });
  },
};
