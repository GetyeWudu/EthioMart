import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { toast } from 'sonner';

interface WishlistStore {
  savedProductIds: string[];
  viewedProductIds: string[];
  isLoading: boolean;
  toggleWishlist: (productId: string, isAuthenticated: boolean) => Promise<void>;
  syncGuestWishlist: () => Promise<void>;
  fetchWishlistIds: () => Promise<void>;
  hasItem: (id: string) => boolean;
  markWishlistViewed: () => void;
  getUnviewedCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      savedProductIds: [],
      viewedProductIds: [],
      isLoading: false,
      
      toggleWishlist: async (productId: string, isAuthenticated: boolean) => {
        const { savedProductIds, viewedProductIds } = get();
        const isSaved = savedProductIds.includes(productId);
        
        // Optimistic UI Update
        if (isSaved) {
          set({ 
            savedProductIds: savedProductIds.filter(id => id !== productId),
            viewedProductIds: (viewedProductIds || []).filter(id => id !== productId)
          });
        } else {
          set({ 
            savedProductIds: [...savedProductIds, productId],
            // Not adding to viewedProductIds, so it triggers badge for new items
          });
        }
        
        if (isAuthenticated) {
          try {
            const res = await api.post<{ saved: boolean }>('/wishlists/toggle/', { product_id: productId });
            if (res.data?.saved) {
              toast.success("Added to wishlist");
            } else {
              toast.info("Removed from wishlist");
            }
          } catch (error: any) {
            // Revert on failure
            set({ savedProductIds, viewedProductIds });
            let msg = "Failed to update wishlist";
            if (error.message && typeof error.message === "string") {
              msg = error.message;
            } else if (error.data?.detail && typeof error.data.detail === "string") {
              msg = error.data.detail;
            }
            toast.error(msg);
          }
        } else {
          if (!isSaved) {
            toast.success("Saved locally. Sign in to sync across devices.");
          }
        }
      },
      
      syncGuestWishlist: async () => {
        const { savedProductIds } = get();
        if (savedProductIds.length === 0) return;
        
        try {
          await api.post('/wishlists/sync/', { product_ids: savedProductIds });
          // Clear local cache after successful sync, fetch will repopulate it
          set({ savedProductIds: [] });
          await get().fetchWishlistIds();
        } catch (error: any) {
          console.warn("Unable to sync guest wishlist:", error?.message || error);
        }
      },
      
      fetchWishlistIds: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get<string[]>('/wishlists/ids/');
          set({ savedProductIds: res.data || [] });
        } catch (error: any) {
          console.warn("Unable to fetch wishlist IDs:", error?.message || error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      hasItem: (id: string) => {
        return get().savedProductIds.includes(id);
      },

      markWishlistViewed: () => {
        set({ viewedProductIds: [...get().savedProductIds] });
      },

      getUnviewedCount: () => {
        const { savedProductIds, viewedProductIds } = get();
        const viewedSet = new Set(viewedProductIds || []);
        return savedProductIds.filter(id => !viewedSet.has(id)).length;
      },
    }),
    {
      name: 'ethiomart-wishlist-storage',
      partialize: (state) => ({ 
        savedProductIds: state.savedProductIds,
        viewedProductIds: state.viewedProductIds || []
      }),
    }
  )
);
