"use client";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminStore } from "@/stores/admin-store";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdminSidebarCollapsed = useAdminStore((s) => s.isAdminSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className={cn("flex flex-1 flex-col min-w-0 transition-all duration-300", isAdminSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
