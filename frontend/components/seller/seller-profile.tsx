"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useVendorProfile } from "@/features/vendors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SellerProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { profile } = useVendorProfile();

  const handleSignOut = async () => {
    await logout();
    toast.success("Successfully logged out");
    window.location.href = "/login";
  };

  const displayName = user?.full_name || user?.first_name || "Merchant";
  const initials = (user?.first_name?.[0] || "S") + (user?.last_name?.[0] || "E");

  return (
    <div className="relative flex items-center gap-2 group cursor-pointer">
      <Avatar className="h-9 w-9 border-2 border-indigo-200 dark:border-indigo-800 ring-2 ring-transparent hover:ring-indigo-500/30 transition-all shadow-sm">
        <AvatarImage src={profile?.store_logo || ""} alt={displayName} className="object-cover" />
        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 font-bold">
          {initials.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-900 dark:ring-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <Link href="/seller/profile" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <User className="mr-2 h-4 w-4" />
          Profile
        </Link>
        <Link href="/seller/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Link>
        <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
        <button onClick={handleSignOut} className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
