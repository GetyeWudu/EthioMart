/**
 * frontend/stores/auth-store.ts
 * ==============================
 * Zustand global authentication store.
 * Provides role getters (isSuperAdmin, isAdmin, isSeller, isCustomer), token persistence, and profile sync.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth-service";
import { useCartStore } from "./cart-store";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Role getters
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isSeller: () => boolean;
  isCustomer: () => boolean;

  // Actions
  setAuth: (user: User, access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      isSuperAdmin: () => {
        const user = get().user;
        return Boolean(user && user.is_superuser);
      },

      isAdmin: () => {
        const user = get().user;
        return Boolean(user && (user.is_staff || user.is_superuser || user.role === "ADMIN"));
      },

      isSeller: () => {
        const user = get().user;
        return Boolean(user && user.role === "SELLER");
      },

      isCustomer: () => {
        const user = get().user;
        return Boolean(user && user.role === "CUSTOMER");
      },

      setAuth: (user: User, access: string, refresh: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("userAuth", "true");

          // Set cookies on current origin for Next.js middleware route access
          document.cookie = `ethiomart_access=${encodeURIComponent(access)}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `ethiomart_refresh=${encodeURIComponent(refresh)}; path=/; max-age=2592000; SameSite=Lax`;
        }
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
          isLoading: false,
        });

        // Trigger sync for wishlist and cart
        setTimeout(() => {
          import("./wishlist-store").then(({ useWishlistStore }) => {
            useWishlistStore.getState().syncGuestWishlist();
          });
        }, 100);
      },

      setUser: (user: User) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        set({ user });
      },

      logout: async () => {
        const refresh = get().refreshToken;
        try {
          if (refresh) {
            await authService.logout(refresh);
          }
        } catch {
          // Continue local cleanup even if network fails
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            localStorage.removeItem("userAuth");

            // Clear Cart and generate a new Session ID for the guest cart
            useCartStore.getState().clearCart();
            useCartStore.setState({ sessionId: crypto.randomUUID() });

            // Expire cookies
            document.cookie = "ethiomart_access=; path=/; max-age=0; SameSite=Lax";
            document.cookie = "ethiomart_refresh=; path=/; max-age=0; SameSite=Lax";
          }
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const res = await authService.getMe();
          if (res?.user) {
            get().setUser(res.user);
            set({ isAuthenticated: true });
            
            // Hydrate wishlist
            import("./wishlist-store").then(({ useWishlistStore }) => {
              useWishlistStore.getState().fetchWishlistIds();
            });
          }
        } catch {
          // Not logged in or expired
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "ethiomart-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
