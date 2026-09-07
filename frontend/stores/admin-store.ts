import { create } from 'zustand';

interface AdminStoreState {
  isAdminSidebarCollapsed: boolean;
  toggleAdminSidebar: () => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  isAdminSidebarCollapsed: false,
  toggleAdminSidebar: () => set((state) => ({ isAdminSidebarCollapsed: !state.isAdminSidebarCollapsed })),
}));
