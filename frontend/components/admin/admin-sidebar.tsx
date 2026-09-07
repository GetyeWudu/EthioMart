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
  TokensIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import api from "@/lib/api";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badgeKey?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/admin", icon: DashboardIcon },
  { name: "Analytics", href: "/admin/analytics", icon: PieChartIcon },
  { name: "Products Queue", href: "/admin/products", icon: CubeIcon },
  { name: "Multi-Hub Inventory", href: "/admin/inventory", icon: TokensIcon, badgeKey: "low_stock_alerts" },
  { name: "Taxonomy Tree", href: "/admin/taxonomy", icon: ListBulletIcon },
  { name: "Dynamic Attributes", href: "/admin/attributes", icon: StarIcon },
  { name: "Brand Registry", href: "/admin/brands", icon: SunIcon },
  { name: "Orders", href: "/admin/orders", icon: ArchiveIcon },
  { name: "Vendors & KYC", href: "/admin/vendors", icon: PersonIcon, badgeKey: "pending_kyc" },
  { name: "Customer Directory", href: "/admin/customers", icon: AvatarIcon },
  { name: "Promotions", href: "/admin/promotions", icon: IdCardIcon },
  { name: "Payments & Escrow", href: "/admin/payments", icon: CardStackIcon, badgeKey: "pending_payouts_count" },
  { name: "Commission Splits", href: "/admin/commissions", icon: LayersIcon },
  { name: "MoR Tax Reports", href: "/admin/reports", icon: FileTextIcon },
  { name: "Disputes Arbitration", href: "/admin/disputes", icon: LockClosedIcon, badgeKey: "active_disputes" },
  { name: "Notifications Hub", href: "/admin/notifications", icon: BellIcon },
];

export const NAV_SECTIONS = [
  { title: "Main Menu", items: NAV_ITEMS },
];

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function AdminSidebar() {
  const pathname = usePathname();
  const isAdminSidebarCollapsed = useAdminStore((s) => s.isAdminSidebarCollapsed);
  const toggleAdminSidebar = useAdminStore((s) => s.toggleAdminSidebar);
  const { data: analyticsData } = useSWR("/admin/analytics/?range=30d", fetcher);

  const ops = analyticsData?.operational_counters || {};

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex shadow-sm transition-all duration-300 select-none",
        isAdminSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800",
          isAdminSidebarCollapsed ? "justify-center px-0" : "justify-between px-6"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-indigo-600 text-white shadow-sm">
            <DashboardIcon className="h-4 w-4 stroke-[2.5]" />
          </div>
          {!isAdminSidebarCollapsed && (
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Gech<span className="text-indigo-600 dark:text-indigo-400">Express</span>
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 text-slate-500", isAdminSidebarCollapsed && "hidden")}
          onClick={toggleAdminSidebar}
          title="Collapse sidebar"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
      </div>

      {isAdminSidebarCollapsed && (
        <div className="flex justify-center mt-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
            onClick={toggleAdminSidebar}
            title="Expand sidebar"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation without scrollbar */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <ul className="space-y-0.5">
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
                    "flex items-center px-4 py-3 text-base font-medium transition-all relative overflow-hidden whitespace-nowrap",
                    isAdminSidebarCollapsed ? "justify-center rounded-xl px-0 w-12 mx-auto" : "gap-3 rounded-r-xl",
                    isActive
                      ? "text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                  )}
                >
                  {isActive && !isAdminSidebarCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                    )}
                  />
                  {!isAdminSidebarCollapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate">{item.name}</span>
                      {badgeValue > 0 && (
                        <span
                          className={cn(
                            "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[9px] font-bold font-mono ml-2 shrink-0",
                            isActive
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                          )}
                        >
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

      {/* Bottom Live Chapa Widget */}
      <div className="mt-auto border-t border-slate-200/80 p-3 dark:border-slate-800 shrink-0">
        {!isAdminSidebarCollapsed ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Chapa Live
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                Operational
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Platform GMV</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                ETB {Number(analyticsData?.kpis?.total_gmv || 0).toLocaleString("en-ET", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Disputes</span>
              <span className={cn(
                "text-[11px] font-mono font-semibold",
                (ops.active_disputes || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
              )}>
                {ops.active_disputes || 0} active
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300" title="Chapa Live Operational">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
