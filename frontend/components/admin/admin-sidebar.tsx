"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  PieChart,
  Settings,
  ShieldAlert,
  Layers,
  FolderTree,
  Sparkles,
  Bell,
  Tags,
  Award,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export const NAV_GROUPS = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: PieChart },
    ]
  },
  {
    title: "Catalog Management",
    icon: Layers,
    items: [
      { name: "Products Queue", href: "/admin/products", icon: Package },
      { name: "Taxonomy Tree", href: "/admin/taxonomy", icon: FolderTree },
      { name: "Dynamic Attributes", href: "/admin/attributes", icon: Sparkles },
      { name: "Brands", href: "/admin/brands", icon: Award },
      { name: "Promotions", href: "/admin/promotions", icon: Tags },
    ]
  },
  {
    title: "Platform Management",
    icon: Store,
    items: [
      { name: "Vendors & KYC", href: "/admin/vendors", icon: Store },
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Disputes & Claims", href: "/admin/disputes", icon: ShieldAlert },
    ]
  },
  {
    title: "Finance & Reports",
    icon: CreditCard,
    items: [
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Commissions", href: "/admin/commissions", icon: PieChart },
      { name: "Reports", href: "/admin/reports", icon: PieChart },
    ]
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  const handleSignOut = async () => {
    await logout();
    toast.success("Successfully logged out");
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">
          G
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          GechExpress <span className="font-normal text-slate-500">Admin</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-8">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <group.icon className="h-4 w-4" />
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/admin");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-indigo-50/80 text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-500 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
