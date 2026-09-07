"use client";

import { SellerSidebar } from "@/components/seller/seller-sidebar";
import { SellerHeader } from "@/components/seller/seller-header";
import { SuspendedStoreBanner } from "@/components/seller/suspended-store-banner";
import { ReactNode } from "react";
import { useSellerStore } from "@/stores/seller-store";
import { cn } from "@/lib/utils";

export default function SellerLayout({ children }: { children: ReactNode }) {
  const isSidebarCollapsed = useSellerStore((s) => s.isSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <SellerSidebar />
      <div className={cn("flex flex-1 flex-col min-w-0 transition-all duration-300", isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <SellerHeader />
        <SuspendedStoreBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
