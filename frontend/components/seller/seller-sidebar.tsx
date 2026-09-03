"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Warehouse,
  Users,
  BarChart3,
  Tags,
  Settings,
  Wallet,
  MessageSquare,
  LogOut,
  ShoppingBag,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

export const NAV_ITEMS = [
  { name: "Overview", href: "/seller", icon: LayoutDashboard },
  { name: "Products", href: "/seller/products", icon: Package },
  { name: "Multi-Hub Inventory", href: "/seller/inventory", icon: Boxes },
  { name: "Warehouses & Pickups", href: "/seller/warehouses", icon: Warehouse, restricted: true },
  { name: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { name: "Disputes", href: "/seller/disputes", icon: ShieldAlert },
  { name: "Team & Staff RBAC", href: "/seller/team", icon: Users, restricted: true },
  { name: "Earnings & Wallet", href: "/seller/earnings", icon: Wallet, restricted: true },
  { name: "Analytics", href: "/seller/analytics", icon: BarChart3, restricted: true },
  { name: "Promotions", href: "/seller/promotions", icon: Tags },
  { name: "Reviews", href: "/seller/reviews", icon: MessageSquare },
  { name: "Store Settings", href: "/seller/settings", icon: Settings, restricted: true },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // If role is OWNER, they get full access to everything including Finance.
  const isOwner = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role;
  // If role is MANAGER, they get access to operational stuff but not Finance.
  const isManager = user?.vendor_staff_role === "MANAGER";
  const isClerk = user?.vendor_staff_role === "INVENTORY_CLERK";
  
  const hasAccess = isOwner || isManager;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/50 lg:flex shadow-sm">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/50 px-6 dark:border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Gech<span className="text-indigo-500 dark:text-indigo-400">Express</span> <span className="font-normal text-slate-500 text-sm">Seller</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            // "Earnings & Wallet" is strictly for OWNER
            if (item.name === "Earnings & Wallet" && !isOwner) return null;
            
            // Clerk specific restrictions
            if (isClerk) {
              const clerkAllowed = ["Overview", "Multi-Hub Inventory", "Warehouses & Pickups"];
              if (!clerkAllowed.includes(item.name)) return null;
            } else {
              // "restricted" items (like Warehouses, Team) require at least MANAGER
              if (item.restricted && !hasAccess) return null;
            }

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-700 dark:from-indigo-500/10 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 rounded-l-none"
                      : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white border-l-2 border-transparent rounded-l-none"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
