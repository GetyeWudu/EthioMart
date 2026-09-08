"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Star, Settings, Heart, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

const SIDEBAR_LINKS = [
  { href: "/customer", label: "Dashboard Overview", icon: User },
  { href: "/customer/orders", label: "My Orders", icon: Package },
  { href: "/customer/wishlist", label: "Wishlist", icon: Heart },
  { href: "/customer/reviews", label: "My Reviews", icon: Star },
  { href: "/customer/settings", label: "Account Settings", icon: Settings },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    window.location.href = "/";
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sticky top-24">
        <div className="mb-6 px-4 py-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Account</h2>
          <p className="text-sm text-slate-500">{user?.email || "customer@ethiomart.com"}</p>
        </div>
        
        <nav className="space-y-1">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={buttonVariants({ 
                  variant: isActive ? "secondary" : "ghost", 
                  className: "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800" 
                })}
              >
                <link.icon className="mr-3 h-5 w-5 text-slate-500" />
                {link.label}
              </Link>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={handleLogout}
              className={buttonVariants({ variant: "ghost", className: "w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950 cursor-pointer" })}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Log out
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
