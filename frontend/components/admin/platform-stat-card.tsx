import { TrendingDown, TrendingUp, LucideIcon, Wallet, Percent, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformStatCardProps {
  title: string;
  amount: string;
  trend: string;
  trendUp: boolean;
  highlight?: boolean;
  icon?: LucideIcon;
  subtitle?: string;
}

function getDefaultIcon(title: string): LucideIcon {
  const lower = title.toLowerCase();
  if (lower.includes("gmv") || lower.includes("revenue") || lower.includes("sales") || lower.includes("earnings")) {
    return Wallet;
  }
  if (lower.includes("fee") || lower.includes("commission") || lower.includes("rate") || lower.includes("tax")) {
    return Percent;
  }
  if (lower.includes("merchant") || lower.includes("seller") || lower.includes("vendor") || lower.includes("store")) {
    return Store;
  }
  return Users;
}

export function PlatformStatCard({
  title,
  amount,
  trend,
  trendUp,
  highlight = false,
  icon,
  subtitle,
}: PlatformStatCardProps) {
  const Icon = icon || getDefaultIcon(title);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-3.5 sm:p-6 transition-all duration-300 group hover:shadow-xl hover:-translate-y-0.5 min-w-0 w-full",
        highlight
          ? "border-blue-500/30 bg-gradient-to-br from-[#1261C9]/10 via-white to-blue-50/30 dark:from-[#1261C9]/20 dark:via-slate-900 dark:to-slate-950 shadow-md shadow-blue-500/5"
          : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* Decorative ambient glow for highlight card */}
      {highlight && (
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#1261C9]/15 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header: Title and Icon Badge */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className={cn(
            "text-xs sm:text-sm font-semibold tracking-wide truncate",
            highlight ? "text-[#1261C9] dark:text-[#4D8FE0]" : "text-slate-500 dark:text-slate-400"
          )}
          title={title}
        >
          {title}
        </span>
        <div
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
            highlight
              ? "bg-[#1261C9] text-white shadow-md shadow-blue-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-[#1261C9] group-hover:border-blue-200 dark:group-hover:border-blue-800"
          )}
        >
          <Icon className="h-5 w-5 stroke-[2.2]" />
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 sm:mt-4 min-w-0">
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate" title={amount}>
          {amount}
        </p>
      </div>

      {/* Footer: Trend and Context */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold tracking-tight",
            trendUp
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          )}
        >
          {trendUp ? <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" /> : <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />}
          {trend}
        </span>
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          {subtitle || "vs last month"}
        </span>
      </div>
    </div>
  );
}
