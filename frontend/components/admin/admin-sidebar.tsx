"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  PieChartIcon,
  CubeIcon,
  ListBulletIcon,
  StarIcon,
  SunIcon,
  IdCardIcon,
  PersonIcon,
  AvatarIcon,
  ArchiveIcon,
  LockClosedIcon,
  CardStackIcon,
  LayersIcon,
  FileTextIcon,
  BellIcon,
  ExclamationTriangleIcon,
  GearIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useSWR from "swr";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: DashboardIcon },
  { name: "Analytics", href: "/admin/analytics", icon: PieChartIcon },
  { name: "Products Queue", href: "/admin/products", icon: CubeIcon, badgeKey: "low_stock_alerts" },
  { name: "Taxonomy Tree", href: "/admin/taxonomy", icon: ListBulletIcon },
  { name: "Dynamic Attributes", href: "/admin/attributes", icon: StarIcon },
  { name: "Brands", href: "/admin/brands", icon: SunIcon },
  { name: "Promotions", href: "/admin/promotions", icon: IdCardIcon },
  { name: "Vendors & KYC", href: "/admin/vendors", icon: PersonIcon, badgeKey: "pending_kyc" },
  { name: "Customers", href: "/admin/customers", icon: AvatarIcon },
  { name: "Orders", href: "/admin/orders", icon: ArchiveIcon },
  { name: "Disputes & Claims", href: "/admin/disputes", icon: LockClosedIcon, badgeKey: "active_disputes" },
  { name: "Payments", href: "/admin/payments", icon: CardStackIcon, badgeKey: "pending_payouts_count" },
  { name: "Commissions", href: "/admin/commissions", icon: LayersIcon },
  { name: "Reports", href: "/admin/reports", icon: FileTextIcon },
  { name: "Notifications", href: "/admin/notifications", icon: BellIcon },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: ExclamationTriangleIcon },
  { name: "Settings", href: "/admin/settings", icon: GearIcon },
];

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const isAdminSidebarCollapsed = useAdminStore((s) => s.isAdminSidebarCollapsed);
  const toggleAdminSidebar = useAdminStore((s) => s.toggleAdminSidebar);
  const { data: analyticsData } = useSWR('/admin/analytics/?range=30d', fetcher);

  const ops = analyticsData?.operational_counters || {};

  const handleSignOut = async () => {
    await logout();
    toast.success("Successfully logged out");
    window.location.href = "/login";
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex shadow-sm transition-all duration-300",
      isAdminSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800", isAdminSidebarCollapsed ? "justify-center px-0" : "justify-between px-6")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">
            G
          </div>
          {!isAdminSidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              GechExpress <span className="font-normal text-slate-500">Admin</span>
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-slate-500", isAdminSidebarCollapsed && "hidden")} onClick={toggleAdminSidebar}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
      </div>

      {isAdminSidebarCollapsed && (
        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={toggleAdminSidebar}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
        {!isAdminSidebarCollapsed && (
          <div className="px-6 mb-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Main Menu
            </p>
          </div>
        )}
        <ul className="space-y-1.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/admin");
            // @ts-ignore
            const badgeValue = item.badgeKey ? ops[item.badgeKey] : null;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={isAdminSidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden whitespace-nowrap",
                    isAdminSidebarCollapsed ? "justify-center rounded-xl px-0 w-12 mx-auto" : "gap-3 rounded-r-xl",
                    isActive
                      ? (isAdminSidebarCollapsed ? "text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" : "text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400")
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                  )}
                >
                  {isActive && !isAdminSidebarCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  {!isAdminSidebarCollapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span>{item.name}</span>
                      {badgeValue > 0 && (
                        <span className={cn(
                          "flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold",
                          isActive 
                            ? "bg-indigo-600 text-white" 
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400"
                        )}>
                          {badgeValue}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          title={isAdminSidebarCollapsed ? "Log Out" : undefined}
          className={cn(
            "flex items-center text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-500 transition-colors whitespace-nowrap overflow-hidden",
            isAdminSidebarCollapsed ? "justify-center rounded-xl p-3 w-10 mx-auto" : "w-full gap-3 rounded-lg px-3 py-2"
          )}
        >
          <ExitIcon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          {!isAdminSidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
