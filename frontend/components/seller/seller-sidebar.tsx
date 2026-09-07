"use client";

import {
  DashboardIcon,
  CubeIcon,
  ArchiveIcon,
  TokensIcon,
  HomeIcon,
  PersonIcon,
  BarChartIcon,
  BookmarkIcon,
  GearIcon,
  CardStackIcon,
  ChatBubbleIcon,
  ExitIcon,
  BackpackIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";
import { useSellerStore } from "@/stores/seller-store";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export const NAV_ITEMS = [
  { name: "Overview", href: "/seller", icon: DashboardIcon },
  { name: "Products", href: "/seller/products", icon: CubeIcon },
  { name: "Multi-Hub Inventory", href: "/seller/inventory", icon: TokensIcon },
  { name: "Warehouses & Pickups", href: "/seller/warehouses", icon: HomeIcon, restricted: true },
  { name: "Orders", href: "/seller/orders", icon: ArchiveIcon },
  { name: "Disputes", href: "/seller/disputes", icon: LockClosedIcon },
  { name: "Team & Staff RBAC", href: "/seller/team", icon: PersonIcon, restricted: true },
  { name: "Earnings & Wallet", href: "/seller/earnings", icon: CardStackIcon, restricted: true },
  { name: "Analytics", href: "/seller/analytics", icon: BarChartIcon, restricted: true },
  { name: "Promotions", href: "/seller/promotions", icon: BookmarkIcon },
  { name: "Reviews", href: "/seller/reviews", icon: ChatBubbleIcon },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  
  const isSidebarCollapsed = useSellerStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useSellerStore((s) => s.toggleSidebar);

  const isOwner = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role;
  const isManager = user?.vendor_staff_role === "MANAGER";
  const isClerk = user?.vendor_staff_role === "INVENTORY_CLERK";

  const hasAccess = isOwner || isManager;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex shadow-sm transition-all duration-300",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800", isSidebarCollapsed ? "justify-center px-0" : "justify-between px-6")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-indigo-600 text-white shadow-sm">
            <BackpackIcon className="h-4 w-4 stroke-[2.5]" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Gech<span className="text-indigo-600 dark:text-indigo-400">Express</span>
            </span>
          )}
        </div>
        
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-slate-500", isSidebarCollapsed && "hidden")} onClick={toggleSidebar}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
      </div>

      {isSidebarCollapsed && (
        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={toggleSidebar}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
        {!isSidebarCollapsed && (
          <div className="px-6 mb-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Main Menu
            </p>
          </div>
        )}
        <ul className="space-y-1.5 px-3">
          {NAV_ITEMS.map((item) => {
            if (item.name === "Earnings & Wallet" && !isOwner) return null;

            if (isClerk) {
              const clerkAllowed = ["Overview", "Multi-Hub Inventory", "Warehouses & Pickups"];
              if (!clerkAllowed.includes(item.name)) return null;
            } else {
              if (item.restricted && !hasAccess) return null;
            }

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden whitespace-nowrap",
                    isSidebarCollapsed ? "justify-center rounded-xl px-0 w-12 mx-auto" : "gap-3 rounded-r-xl",
                    isActive
                      ? (isSidebarCollapsed ? "text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" : "text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400")
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                  )}
                >
                  {isActive && !isSidebarCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
