"use client";

import React from "react";
import { 
  LogOut, 
  Settings, 
  User 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useVendorProfile } from "@/features/vendors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SellerProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { profile } = useVendorProfile();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch {
      // fallback
    }
    window.location.href = "/login";
  };

  const displayName = user?.full_name || user?.first_name || "Merchant";
  const initials = (user?.first_name?.[0] || "S") + (user?.last_name?.[0] || "E");
  const storeName = profile?.store_name || "EthioMart Store";
  const roleTitle = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role 
    ? "Store Owner" 
    : user?.vendor_staff_role === "MANAGER" 
    ? "Store Manager" 
    : "Staff Member";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center outline-none rounded-full ring-2 ring-transparent hover:ring-[#FF7900]/30 focus-visible:ring-2 focus-visible:ring-[#FF7900] transition-all cursor-pointer p-0 shrink-0 ml-auto">
        <Avatar className="h-9 w-9 border-2 border-[#FF7900]/30 dark:border-[#FF7900]/40 ring-2 ring-transparent hover:ring-[#FF7900]/30 transition-all shadow-xs">
          <AvatarImage src={profile?.store_logo || ""} alt={displayName} className="object-cover" />
          <AvatarFallback className="bg-[#FF7900]/15 text-[#FF7900] dark:bg-[#FF7900]/25 dark:text-orange-300 font-bold text-xs">
            {initials.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl p-1.5 shadow-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 z-50">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {storeName}
            </p>
            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-[#FF7900]/10 text-[#FF7900] dark:bg-[#FF7900]/20 dark:text-orange-300 border-[#FF7900]/20 shrink-0">
              {roleTitle}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {displayName}
          </p>
          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
            {user?.email || "merchant@ethiomart.com"}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/seller/profile")}
            className="flex items-center px-3 py-2 text-xs font-medium cursor-pointer rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <User className="mr-2.5 h-4 w-4 text-[#FF7900]" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/seller/settings")}
            className="flex items-center px-3 py-2 text-xs font-medium cursor-pointer rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="mr-2.5 h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
