"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ShoppingBag, ShoppingCart, Heart, Search, Menu, User, LogOut, ChevronDown, ChevronRight, Sun, Moon, Monitor, Home, Grid, PlusCircle, LogIn, Flame } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { CategoryMegaMenu } from "@/components/catalog/category-mega-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { catalogService } from "@/features/products/services/catalog-service";
import { CategoryNode } from "@/features/products/types";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Categories", href: "/categories" },
  { 
    name: "Products", 
    href: "/products",
    subItems: [
      { name: "All Products", href: "/products" },
      { name: "New Arrivals", href: "/products?sort=new" },
      { name: "Trending", href: "/products?sort=trending" },
    ]
  },
  { name: "Deals", href: "/deals" },
  { name: "Stores", href: "/stores" },
];

export function CustomerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    catalogService
      .getCategoryTree()
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.warn("Unable to connect to marketplace server for categories:", err?.message || err);
      });
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMobileMenu = (menu: string) => {
    setOpenMobileMenu(openMobileMenu === menu ? null : menu);
  };

  const { items } = useCartStore();
  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);
  const { savedProductIds } = useWishlistStore();

  const wishlistCount = mounted ? savedProductIds.length : 0;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userStr));
      } catch (e) { }
      
      // Auto-sync or fetch wishlist for authenticated users
      const { useWishlistStore } = require("@/stores/wishlist-store");
      const { savedProductIds, syncGuestWishlist, fetchWishlistIds } = useWishlistStore.getState();
      if (savedProductIds.length > 0) {
        syncGuestWishlist();
      } else {
        fetchWishlistIds();
      }
    } else {
      setIsLoggedIn(!!localStorage.getItem("userAuth"));
    }

    // Initialize cart on mount
    const { useCartStore } = require("@/stores/cart-store");
    useCartStore.getState().initializeCart();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const { useAuthStore } = await import("@/stores/auth-store");
      await useAuthStore.getState().logout();
    } catch {
      localStorage.removeItem("userAuth");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      document.cookie = "ethiomart_access=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "ethiomart_refresh=; path=/; max-age=0; SameSite=Lax";
    }
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = "/";
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHomePage = pathname === "/";
  const showNavLinks = isHomePage && !isScrolled;
  const headerSolid = isScrolled || !isHomePage;

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
        headerSolid
          ? "bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md text-slate-900 dark:text-slate-50 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm py-2.5 sm:py-3"
          : "bg-transparent text-slate-50 border-b border-white/15 py-3.5 sm:py-4"
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-12 items-center justify-between gap-3 sm:gap-4 lg:gap-8">

          {/* LEFT: Logo & Mobile Menu */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden rounded-full shrink-0 hover:bg-white/10 hover:text-white text-slate-300 transition-colors h-10 w-10")}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-3 text-slate-900 dark:text-slate-50">
                    <div className="relative h-11 w-11 rounded-2xl overflow-hidden shadow-lg shadow-[#1261C9]/25 shrink-0 border border-white/40 dark:border-slate-700">
                      <Image
                        src="/logo/abukii.png"
                        alt="EthioMart Logo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <span className="text-xl font-black tracking-tight">
                        <span className="text-[#1261C9]">Ethio</span><span className="text-[#FF7900]">Mart</span>
                      </span>
                      <span className="block text-[11px] font-semibold tracking-normal text-[#1261C9] dark:text-blue-400">
                        Ethiopia&apos;s local marketplace
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-6 pb-6 overflow-y-auto max-h-[85vh] scrollbar-none">
                  {/* SEARCH */}
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="pl-9 bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 h-11"
                    />
                  </form>

                  {/* PROFILE CARD */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                      {isLoggedIn ? (
                        <img src="https://i.pravatar.cc/150?u=ethiomart_user" alt="Avatar" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{isLoggedIn ? user?.name || "Welcome Back!" : "Welcome!"}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{isLoggedIn ? "View your account profile" : "Sign in to your account"}</p>
                    </div>
                  </div>

                  {/* APPEARANCE */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Appearance</h4>
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60">
                      <button type="button" onClick={() => setTheme("light")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors", mounted && theme === "light" ? "bg-white text-[#1261C9] shadow-sm dark:bg-[#1261C9]/20 dark:text-[#4D8FE0]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}>
                        <Sun className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setTheme("dark")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors", mounted && theme === "dark" ? "bg-white text-[#1261C9] shadow-sm dark:bg-[#1261C9]/20 dark:text-[#4D8FE0]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}>
                        <Moon className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setTheme("system")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors", mounted && theme === "system" ? "bg-white text-[#1261C9] shadow-sm dark:bg-[#1261C9]/20 dark:text-[#4D8FE0]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}>
                        <Monitor className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* GET STARTED */}
                  {!isLoggedIn && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Get Started</h4>
                      <div className="flex flex-col gap-1">
                        <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                          <LogIn className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm font-medium">Sign In</span>
                        </Link>
                        <Link href="/register" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                          <PlusCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm font-medium">Create Account</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* QUICK ACCESS */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Quick Access</h4>
                    <div className="flex flex-col gap-1">
                      <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                        <Home className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium">Home</span>
                      </Link>
                      <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                        <Grid className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium">All Products</span>
                      </Link>
                      <Link href="/deals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                        <Flame className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium">Flash Deals</span>
                      </Link>
                      <Link href="/cart" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm font-medium">Cart</span>
                        </div>
                        {cartItemsCount > 0 && (
                          <span 
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7900] text-[10px] font-bold text-white"
                            style={{ fontFamily: 'system-ui, sans-serif' }}
                          >
                            {cartItemsCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>

                  {/* SHOP CATEGORIES (Dynamic Accordion) */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Shop Categories</h4>
                    <Accordion className="w-full">
                      {categories.slice(0, 8).map((root) => (
                        <AccordionItem value={root.id} key={root.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                          <AccordionTrigger className="hover:no-underline py-3 px-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                            {root.name}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col gap-1 pl-4 pb-2">
                              {root.children?.slice(0, 6).map((subcat) => (
                                <Link 
                                  key={subcat.id} 
                                  href={`/products?category=${subcat.slug}`}
                                  className="py-2 px-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {subcat.name}
                                </Link>
                              ))}
                              <Link 
                                href={`/products?category=${root.slug}`}
                                className="py-2 px-2 text-sm font-medium text-emerald-600 dark:text-emerald-500 hover:underline"
                                onClick={() => setIsOpen(false)}
                              >
                                View all {root.name} →
                              </Link>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    <Link href="/categories" className="mt-4 flex items-center justify-center w-full py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors" onClick={() => setIsOpen(false)}>
                      Browse Full Directory
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-3 group shrink-0 transition-transform hover:scale-105">
              <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden shadow-lg shadow-[#1261C9]/25 border border-white/40 dark:border-slate-700 shrink-0">
                <Image
                  src="/logo/abukii.png"
                  alt="EthioMart Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                  <span className="text-[#1261C9]">Ethio</span><span className="text-[#FF7900]">Mart</span>
                </span>
                <span className={cn(
                  "text-[11px] font-semibold tracking-normal mt-0.5 transition-colors",
                  headerSolid ? "text-[#1261C9] dark:text-blue-400" : "text-blue-200"
                )}>
                  Ethiopia&apos;s local marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation (Only rendered on Home page, and hidden on scroll) */}
            {isHomePage && (
              <div
                className={cn(
                  "hidden xl:flex items-center overflow-hidden transition-all duration-300 ease-in-out",
                  isScrolled
                    ? "max-w-0 opacity-0 pointer-events-none -translate-x-3 ml-0"
                    : "max-w-[700px] opacity-100 translate-x-0 ml-4 gap-1"
                )}
              >
                <NavigationMenu>
                  <NavigationMenuList className="gap-1 flex-nowrap shrink-0">
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <NavigationMenuItem key={link.href} className="shrink-0">
                          <Link 
                            href={link.href}
                            className={cn(
                              "group relative inline-flex h-9 w-max items-center justify-center px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none duration-300 !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[active]:!bg-transparent whitespace-nowrap",
                              headerSolid 
                                ? (isActive ? "text-[#1261C9] dark:text-[#4D8FE0]" : "text-slate-600 dark:text-slate-300 hover:text-[#1261C9] dark:hover:text-[#4D8FE0]")
                                : (isActive ? "text-[#FF7900]" : "text-slate-200 hover:text-white")
                            )}
                          >
                            {link.name}
                          </Link>
                        </NavigationMenuItem>
                      );
                    })}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            )}
          </div>

          {/* CENTER: Expanded Search Bar */}
          <div
            className={cn(
              "relative flex-1 mx-2 sm:mx-4 hidden md:flex items-center transition-all duration-300 ease-in-out",
              !showNavLinks ? "max-w-2xl lg:max-w-3xl" : "max-w-md lg:max-w-xl"
            )}
          >
            <form onSubmit={handleSearch} className="relative w-full group">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-[#1261C9] transition-colors" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-20 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#1261C9]/20 focus:border-[#1261C9] outline-none transition-all"
              />
              <div className="absolute right-3 top-2.5 hidden sm:flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm pointer-events-none">
                ⌘K
              </div>
            </form>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 shrink-0">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className={cn(
                "md:hidden h-9 w-9 rounded-full transition-colors",
                headerSolid
                  ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              )}
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle className={cn("h-9 w-9 rounded-full transition-colors", headerSolid ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-slate-200 hover:bg-white/10 hover:text-white")} />

            {/* Wishlist */}
            <Link href="/wishlist" className={cn("hidden sm:flex h-9 w-9 items-center justify-center rounded-full transition-colors relative group", headerSolid ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-slate-200 hover:bg-white/10 hover:text-white")}>
              <Heart className="h-4 w-4 transition-transform group-hover:scale-110" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {isLoggedIn && <NotificationBell />}

            {/* User Account / Sign In */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className={cn("hidden md:flex items-center gap-2 h-9 px-4 rounded-full transition-colors text-sm font-medium shrink-0", headerSolid ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" : "bg-white/15 text-white hover:bg-white/25")}>
                  <User className="h-4 w-4" />
                  <span className="hidden xl:inline max-w-[100px] truncate">{user?.name || "Account"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-950/95 backdrop-blur-xl border-slate-800 text-slate-200 shadow-xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {user?.role === "ADMIN" ? (
                      <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                        <User className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    ) : user?.role === "SELLER" ? (
                      <DropdownMenuItem onClick={() => router.push("/seller")} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                        <User className="mr-2 h-4 w-4" />
                        <span>Seller Dashboard</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => router.push("/customer/settings")} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push("/customer/orders")} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-rose-500/10 text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className={cn("hidden md:flex items-center gap-2 h-9 px-4 rounded-full transition-colors text-sm font-medium shrink-0", headerSolid ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" : "bg-white/15 text-white hover:bg-white/25")}>
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link 
              href="/cart" 
              className={cn(
                "relative flex items-center justify-center h-10 w-10 rounded-full transition-transform hover:scale-105 shadow-sm",
                headerSolid 
                  ? "bg-[#1261C9] dark:bg-[#1261C9] text-white" 
                  : "bg-[#FF7900] text-white"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemsCount > 0 && (
                <span 
                  className={cn(
                    "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ring-2",
                    headerSolid 
                      ? "bg-[#FF7900] text-white ring-white dark:ring-slate-950" 
                      : "bg-white text-[#1261C9] ring-transparent"
                  )}
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>


      </div>
    </header>
  );
}
