import {
  Laptop,
  Smartphone,
  Shirt,
  Footprints,
  Home,
  Sparkles,
  Trophy,
  Heart,
  Baby,
  Watch,
  Car,
  Package,
  LucideIcon,
} from "lucide-react";

export interface DepartmentTheme {
  icon: LucideIcon;
  badgeBg: string;
  iconColor: string;
  borderHover: string;
  borderActive: string;
  accentBg: string;
  accentGradient: string;
  badgeText: string;
}

export const DEPARTMENT_THEMES: Record<string, DepartmentTheme> = {
  "consumer-electronics": {
    icon: Laptop,
    badgeBg: "bg-blue-50 dark:bg-blue-950/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderHover: "hover:border-blue-300 dark:hover:border-blue-700",
    borderActive: "border-blue-600 dark:border-blue-500",
    accentBg: "bg-blue-500/10",
    accentGradient: "from-blue-500/10 via-transparent to-transparent",
    badgeText: "Tech & Gadgets",
  },
  "mobile-phones-tablets": {
    icon: Smartphone,
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderHover: "hover:border-indigo-300 dark:hover:border-indigo-700",
    borderActive: "border-indigo-600 dark:border-indigo-500",
    accentBg: "bg-indigo-500/10",
    accentGradient: "from-indigo-500/10 via-transparent to-transparent",
    badgeText: "Mobile & Devices",
  },
  "fashion-apparel": {
    icon: Shirt,
    badgeBg: "bg-purple-50 dark:bg-purple-950/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderHover: "hover:border-purple-300 dark:hover:border-purple-700",
    borderActive: "border-purple-600 dark:border-purple-500",
    accentBg: "bg-purple-500/10",
    accentGradient: "from-purple-500/10 via-transparent to-transparent",
    badgeText: "Fashion & Style",
  },
  "footwear-shoes": {
    icon: Footprints,
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
    borderActive: "border-amber-600 dark:border-amber-500",
    accentBg: "bg-amber-500/10",
    accentGradient: "from-amber-500/10 via-transparent to-transparent",
    badgeText: "Shoes & Sneakers",
  },
  "home-kitchen": {
    icon: Home,
    badgeBg: "bg-teal-50 dark:bg-teal-950/50",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderHover: "hover:border-teal-300 dark:hover:border-teal-700",
    borderActive: "border-teal-600 dark:border-teal-500",
    accentBg: "bg-teal-500/10",
    accentGradient: "from-teal-500/10 via-transparent to-transparent",
    badgeText: "Home & Living",
  },
  "beauty-personal-care": {
    icon: Sparkles,
    badgeBg: "bg-rose-50 dark:bg-rose-950/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderHover: "hover:border-rose-300 dark:hover:border-rose-700",
    borderActive: "border-rose-600 dark:border-rose-500",
    accentBg: "bg-rose-500/10",
    accentGradient: "from-rose-500/10 via-transparent to-transparent",
    badgeText: "Beauty & Health",
  },
  "sports-outdoors": {
    icon: Trophy,
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
    borderActive: "border-emerald-600 dark:border-emerald-500",
    accentBg: "bg-emerald-500/10",
    accentGradient: "from-emerald-500/10 via-transparent to-transparent",
    badgeText: "Active & Sports",
  },
  "watches-jewelry": {
    icon: Watch,
    badgeBg: "bg-yellow-50 dark:bg-yellow-950/50",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    borderHover: "hover:border-yellow-300 dark:hover:border-yellow-700",
    borderActive: "border-yellow-600 dark:border-yellow-500",
    accentBg: "bg-yellow-500/10",
    accentGradient: "from-yellow-500/10 via-transparent to-transparent",
    badgeText: "Accessories",
  },
  "kids-baby": {
    icon: Baby,
    badgeBg: "bg-sky-50 dark:bg-sky-950/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderHover: "hover:border-sky-300 dark:hover:border-sky-700",
    borderActive: "border-sky-600 dark:border-sky-500",
    accentBg: "bg-sky-500/10",
    accentGradient: "from-sky-500/10 via-transparent to-transparent",
    badgeText: "Kids & Toys",
  },
  "automotive-tools": {
    icon: Car,
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-300",
    borderHover: "hover:border-slate-400 dark:hover:border-slate-600",
    borderActive: "border-slate-800 dark:border-slate-200",
    accentBg: "bg-slate-500/10",
    accentGradient: "from-slate-500/10 via-transparent to-transparent",
    badgeText: "Motors & Tools",
  },
};

const DEFAULT_THEME: DepartmentTheme = {
  icon: Package,
  badgeBg: "bg-indigo-50 dark:bg-indigo-950/50",
  iconColor: "text-indigo-600 dark:text-indigo-400",
  borderHover: "hover:border-indigo-300 dark:hover:border-indigo-700",
  borderActive: "border-indigo-600 dark:border-indigo-500",
  accentBg: "bg-indigo-500/10",
  accentGradient: "from-indigo-500/10 via-transparent to-transparent",
  badgeText: "Catalog",
};

export function getDepartmentTheme(slugOrName?: string): DepartmentTheme {
  if (!slugOrName) return DEFAULT_THEME;

  const key = slugOrName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (DEPARTMENT_THEMES[key]) {
    return DEPARTMENT_THEMES[key];
  }

  // Keyword heuristic fallbacks
  if (key.includes("phone") || key.includes("tablet")) return DEPARTMENT_THEMES["mobile-phones-tablets"];
  if (key.includes("elect") || key.includes("comput") || key.includes("laptop")) return DEPARTMENT_THEMES["consumer-electronics"];
  if (key.includes("cloth") || key.includes("fash") || key.includes("apparel") || key.includes("shirt")) return DEPARTMENT_THEMES["fashion-apparel"];
  if (key.includes("shoe") || key.includes("footwear") || key.includes("sneaker")) return DEPARTMENT_THEMES["footwear-shoes"];
  if (key.includes("home") || key.includes("kitchen") || key.includes("furn")) return DEPARTMENT_THEMES["home-kitchen"];
  if (key.includes("beaut") || key.includes("cosmetic") || key.includes("skin") || key.includes("care")) return DEPARTMENT_THEMES["beauty-personal-care"];
  if (key.includes("sport") || key.includes("fitness") || key.includes("gym") || key.includes("outdoor")) return DEPARTMENT_THEMES["sports-outdoors"];
  if (key.includes("watch") || key.includes("jewel")) return DEPARTMENT_THEMES["watches-jewelry"];
  if (key.includes("kid") || key.includes("baby") || key.includes("toy")) return DEPARTMENT_THEMES["kids-baby"];
  if (key.includes("auto") || key.includes("motor") || key.includes("tool")) return DEPARTMENT_THEMES["automotive-tools"];

  return DEFAULT_THEME;
}
