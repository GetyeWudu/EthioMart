import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  trend?: React.ReactNode;
  href?: string;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass,
  trend,
  href,
  highlight = false,
}: StatCardProps) {
  const CardContent = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5",
        highlight
          ? "border-blue-500/30 bg-gradient-to-br from-[#1261C9]/10 via-white to-blue-50/30 dark:from-[#1261C9]/20 dark:via-slate-900 dark:to-slate-950 shadow-md shadow-blue-500/5"
          : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            "text-xs sm:text-sm font-semibold tracking-wide",
            highlight ? "text-[#1261C9] dark:text-[#4D8FE0]" : "text-slate-500 dark:text-slate-400"
          )}
        >
          {title}
        </h3>
        {Icon && (
          <div
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
              highlight
                ? "bg-[#1261C9] text-white shadow-md shadow-blue-500/25"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-[#1261C9] group-hover:border-blue-200 dark:group-hover:border-blue-800",
              iconColorClass
            )}
          >
            <Icon className="h-5 w-5 stroke-[2.2]" />
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-4">
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </p>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          {trend && <div>{trend}</div>}
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-[#1261C9] rounded-2xl">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
