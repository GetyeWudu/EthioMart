import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface CartItem {
  id: string;
  variant: string;
  quantity: number;
  selected_facility: string | null;
  variant_details: {
    id: string;
    sku: string;
    price: string;
    attribute_values: { attribute_name: string; value: string; }[];
    product: {
      id: string;
      title: string;
      slug: string;
      vendor_name: string;
      category_name?: string;
      images: { image_url: string; is_primary: boolean }[];
      variants?: {
        id: string;
        sku: string;
        price: string;
        attribute_values: { attribute_name: string; value: string; }[];
      }[];
    };
  };
  facility_details?: any;
}

interface CartStore {
  items: CartItem[];
  sessionId: string | null;
  isLoading: boolean;
  cartId: string | null;
  serverSubtotal: number;
  serverAutomaticDiscount: number;
  
  initializeCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number, facilityId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItemVariant: (itemId: string, newVariantId: string, quantity: number, facilityId: string | null) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  mergeCart: () => Promise<void>;
  
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,
      isLoading: false,
      cartId: null,
      serverSubtotal: 0,
      serverAutomaticDiscount: 0,

      initializeCart: async () => {
        set({ isLoading: true });
        try {
          if (!get().sessionId) {
            set({ sessionId: crypto.randomUUID() });
          }
          const sid = get().sessionId;
          const headers = sid ? { 'X-Session-Key': sid } : undefined;
          
          const res = await api.get('/carts/', { headers });
          set({ 
            items: res.data.items || [], 
            cartId: res.data.id,
            serverSubtotal: res.data.subtotal || 0,
            serverAutomaticDiscount: res.data.automatic_discount || 0
          });
        } catch (error) {
          console.error("Failed to initialize cart", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (variantId, quantity = 1, facilityId) => {
        set({ isLoading: true });
        try {
          const sid = get().sessionId;
          const headers = sid ? { 'X-Session-Key': sid } : undefined;
          
          await api.post('/carts/items/', {
            variant: variantId,
            quantity,
            selected_facility: facilityId
          }, { headers });
          await get().initializeCart();
        } catch (error) {
          console.error("Failed to add item", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (itemId, quantity) => {
        if (quantity < 1) return;
        try {
          const sid = get().sessionId;
          const headers = sid ? { 'X-Session-Key': sid } : undefined;
          
          await api.patch(`/carts/items/${itemId}/`, { quantity }, { headers });
          await get().initializeCart();
        } catch (error) {
          console.error("Failed to update item", error);
          throw error;
        }
      },

      updateItemVariant: async (itemId, newVariantId, quantity, facilityId) => {
        set({ isLoading: true });
        try {
          const sid = get().sessionId;
          const headers = sid ? { 'X-Session-Key': sid } : undefined;
          
          await api.delete(`/carts/items/${itemId}/`, { headers });
          await api.post('/carts/items/', {
            variant: newVariantId,
            quantity: quantity,
            selected_facility: facilityId
          }, { headers });
          
          await get().initializeCart();
        } catch (error) {
          console.error("Failed to update item variant", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (itemId) => {
        try {
          const sid = get().sessionId;
          const headers = sid ? { 'X-Session-Key': sid } : undefined;
          
          await api.delete(`/carts/items/${itemId}/`, { headers });
          await get().initializeCart();
        } catch (error) {
          console.error("Failed to remove item", error);
        }
      },

      clearCart: () => set({ items: [], cartId: null, serverSubtotal: 0, serverAutomaticDiscount: 0 }),

      mergeCart: async () => {
        const sid = get().sessionId;
        if (!sid) return;
        try {
          const res = await api.post('/carts/merge/', { session_key: sid });
          set({ 
            items: res.data.items || [], 
            cartId: res.data.id,
            serverSubtotal: res.data.subtotal || 0,
            serverAutomaticDiscount: res.data.automatic_discount || 0
          });
        } catch (error) {
          console.log("No cart to merge or error", error);
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.variant_details?.price || '0');
          return total + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'gech-cart-storage',
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
