"use client";

import { Bell, Search, Menu, User, ShieldCheck, Settings, LogOut } from "lucide-react";
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
} from "@/components/ui/sheet";
import { NAV_GROUPS } from "./admin-sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationBell } from "@/components/navigation/notification-bell";

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-4 shadow-sm dark:border-white/5 dark:bg-slate-950/50 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button & Sidebar */}
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-slate-500" />}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col border-r border-slate-200/50 bg-white/95 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/95">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate the admin dashboard</SheetDescription>
          
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/50 px-6 dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">
              G
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              GechExpress <span className="font-normal text-slate-500">Admin</span>
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-6">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
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
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
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
        </SheetContent>
      </Sheet>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-slate-200/50 dark:bg-white/5 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-between gap-4 self-stretch lg:gap-6">
        {/* Dynamic Page Title (Desktop only) */}
        <div className="hidden lg:flex flex-1 items-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
            {pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard'}
          </h1>
        </div>

        {/* Right side Actions & Search */}
        <div className="flex flex-1 lg:flex-none items-center gap-2 sm:gap-4 justify-end">
          <form className="relative flex w-full max-w-md items-center" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="search-field"
              className="w-full pl-10 bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 rounded-full focus-visible:ring-indigo-500 h-10 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-sm"
              placeholder="Global search (Sellers, Users...)"
              type="search"
              name="search"
            />
          </form>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <NotificationBell />

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200/50 dark:lg:bg-white/10 mx-2" aria-hidden="true" />

            {/* Profile Dropdown */}
            <AdminProfileDropdown />
          </div>
        </div>
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
  const subtitle = isSuper ? "Global Control" : "Staff Moderation";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 outline-none group hover:opacity-80 transition-opacity">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="hidden lg:flex lg:flex-col lg:items-start text-left">
          <span className="text-sm font-semibold leading-none text-slate-900 dark:text-white">
            {user?.full_name || title}
          </span>
          <span className="text-xs text-slate-500 mt-1">{subtitle}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-1">
        <DropdownMenuLabel>My Account ({user?.email})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4 text-slate-500" />
          <span>Profile Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4 text-slate-500" />
          <span>System Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-rose-600 dark:text-rose-500 hover:!text-rose-700 dark:hover:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out completely</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
