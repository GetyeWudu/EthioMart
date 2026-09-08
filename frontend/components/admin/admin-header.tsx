"use client";

import {
  MagnifyingGlassIcon,
  HamburgerMenuIcon,
  PersonIcon,
  LockClosedIcon,
  GearIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NAV_SECTIONS, NAV_ITEMS } from "./admin-sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { DashboardIcon } from "@radix-ui/react-icons";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function AdminHeader() {
  const pathname = usePathname();
  const { data: analyticsData } = useSWR("/admin/analytics/?range=30d", fetcher);
  const ops = analyticsData?.operational_counters || {};

  // Find active item name and section title
  let activeSectionName = "Admin Control";
  let activeItemName = "Overview";

  for (const section of NAV_SECTIONS) {
    const matched = section.items.find(
      (item) => pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/admin")
    );
    if (matched) {
      activeSectionName = section.title;
      activeItemName = matched.name;
      break;
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl px-4 shadow-2xs dark:border-slate-800/80 dark:bg-slate-950/85 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      {/* Mobile menu sheet trigger */}
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white" />}>
          <HamburgerMenuIcon className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate the platform administration features</SheetDescription>

          {/* Brand */}
          <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-6 dark:border-slate-800">
            <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <Image
                src="/logo/abukii.png"
                alt="EthioMart Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ethio<span className="text-[#FF7900]">Mart</span>
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1.5 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/admin");
                // @ts-ignore
                const badgeValue = item.badgeKey ? ops[item.badgeKey] : null;

                return (
                  <li key={item.name}>
                    <SheetClose nativeButton={false} render={
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden",
                          isActive
                            ? "text-[#0D4FA8] bg-[#EBF2FC] rounded-r-xl dark:bg-[#1261C9]/10 dark:text-[#4D8FE0] font-semibold"
                            : "text-slate-600 hover:bg-slate-50 rounded-r-xl dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                        )}
                      />
                    }>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1261C9] rounded-r-full" />
                      )}
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#1261C9] dark:text-[#4D8FE0]" : "text-slate-400")} />
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">{item.name}</span>
                        {badgeValue > 0 && (
                          <span
                            className={cn(
                              "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[9px] font-mono font-bold ml-2 shrink-0",
                              isActive
                                ? "bg-[#1261C9] text-white"
                                : "bg-[#D5E5F8] text-[#0D4FA8] dark:bg-[#1261C9]/15 dark:text-[#7AB0EE]"
                            )}
                          >
                            {badgeValue}
                          </span>
                        )}
                      </div>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Right Side: Global Status, Search, Actions & Profile */}
      <div className="flex flex-1 items-center justify-end gap-2.5 sm:gap-3.5">


        {/* Global Search Bar */}
        <div className="relative w-full max-w-[200px] sm:max-w-xs md:max-w-sm">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="admin-search-field"
            className="w-full pl-9 pr-8 bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-[#1261C9] h-9 text-xs transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            placeholder="Search sellers, orders, items..."
            type="search"
          />
          <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[9px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Theme Toggle */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>

        {/* Notifications Dropdown */}
        <div className="shrink-0">
          <NotificationBell />
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" aria-hidden="true" />

        {/* Profile Dropdown */}
        <AdminProfileDropdown />
      </div>
    </header>
  );
}

function AdminProfileDropdown() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isSuper = Boolean(user?.is_superuser);
  const title = isSuper ? "Super Admin" : "Operational Admin";
  const subtitle = isSuper ? "Root Authority" : "Moderator";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 outline-none group hover:opacity-90 transition-opacity">
        <Avatar className="h-9 w-9 shadow-sm border border-slate-200 dark:border-slate-800">
          <AvatarImage src="" alt={user?.full_name || title} />
          <AvatarFallback className="bg-[#E8F0FB] text-[#1261C9] dark:bg-[#1261C9]/20 dark:text-[#7AB0EE] font-bold text-xs">
            {(user?.full_name || title).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-1.5 shadow-xl">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name || "Platform Admin"}</p>
          <p className="text-[10px] font-mono text-slate-400 truncate">{user?.email || "admin@ethiomart.com"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/admin/settings" className="block">
          <DropdownMenuItem className="flex items-center px-3 py-2 text-xs font-medium cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
            <GearIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Platform Settings</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/admin/audit-logs" className="block">
          <DropdownMenuItem className="flex items-center px-3 py-2 text-xs font-medium cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
            <PersonIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Audit Trail</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <ExitIcon className="mr-2 h-3.5 w-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
