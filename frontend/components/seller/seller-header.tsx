"use client";

import { MagnifyingGlassIcon, HamburgerMenuIcon, BackpackIcon, GearIcon, ExitIcon, BellIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SellerProfile } from "./seller-profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { NAV_ITEMS } from "./seller-sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SellerHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-4 shadow-sm dark:border-white/5 dark:bg-slate-950/50 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-slate-500" />}>
          <HamburgerMenuIcon className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
          <SheetDescription className="sr-only">Access seller dashboard links</SheetDescription>
          {/* Brand */}
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-600 text-white shadow-sm">
              <BackpackIcon className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gech<span className="text-indigo-600 dark:text-indigo-400">Express</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-6 mb-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Main Menu
              </p>
            </div>
            <ul className="space-y-1.5 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.name}>
                    <SheetClose nativeButton={false} render={
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden",
                          isActive
                            ? "text-indigo-700 bg-indigo-50 rounded-r-xl dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "text-slate-600 hover:bg-slate-50 rounded-r-xl dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-white"
                        )}
                      />
                    }>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                      )}
                      <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                      {item.name}
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
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
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="search-field"
              className="w-full pl-10 bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 rounded-full focus-visible:ring-indigo-500 h-10 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-sm"
              placeholder="Search..."
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

            {/* Profile */}
            <SellerProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
