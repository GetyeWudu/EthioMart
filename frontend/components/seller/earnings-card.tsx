import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsCardProps {
  title: string;
  amount: string;
  subtitle: string;
  trend: string;
  isPositive: boolean;
  highlight?: boolean;
}

export function EarningsCard({ title, amount, subtitle, trend, isPositive, highlight = false }: EarningsCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6 shadow-sm transition-all relative overflow-hidden",
      highlight 
        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 dark:border-amber-900/50" 
        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
    )}>
      {highlight && (
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Wallet className="h-24 w-24 text-amber-500" />
        </div>
      )}
      
      <div className="relative z-10">
        <h3 className={cn(
          "text-sm font-medium",
          highlight ? "text-amber-800 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
        )}>
          {title}
        </h3>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {amount}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              isPositive 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {trend}
          </span>
          <span className={highlight ? "text-amber-700/70 dark:text-amber-500/70" : "text-slate-500 dark:text-slate-400"}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
