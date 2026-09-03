import { TrendingDown, TrendingUp, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueCardProps {
  title: string;
  amount: string;
  trend: string;
  trendUp: boolean;
  icon?: LucideIcon;
}

export function RevenueCard({ title, amount, trend, trendUp, icon: Icon }: RevenueCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-4 sm:p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md dark:border-white/5 dark:bg-slate-900/40 hover:border-indigo-500/30 dark:hover:border-indigo-500/30">
      {/* Subtle background glow effect based on trend */}
      <div 
        className={cn(
          "absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-20",
          trendUp ? "bg-emerald-500" : "bg-rose-500"
        )}
      />
      
      <div className="relative flex items-center justify-between z-10">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate pr-2">{title}</h3>
        {Icon && (
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors shadow-sm",
            trendUp 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="relative mt-3 flex items-baseline gap-4 z-10">
        <p className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white truncate">
          {amount}
        </p>
      </div>
      <div className="relative mt-3 flex items-center gap-2 text-sm z-10">
        <span 
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold text-[11px] uppercase tracking-wider",
            trendUp 
              ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20" 
              : "bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20"
          )}
        >
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
        <span className="text-slate-500 dark:text-slate-400 text-xs">vs last month</span>
      </div>
    </div>
  );
}
