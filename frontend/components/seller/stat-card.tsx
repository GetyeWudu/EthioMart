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
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColorClass, trend, href }: StatCardProps) {
  const CardContent = (
    <div className={cn(
      "group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/50",
      href ? "hover:shadow-md hover:border-indigo-500/30 dark:hover:border-indigo-500/30 cursor-pointer active:scale-[0.98]" : ""
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-800 transition-colors", iconColorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-4">
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend && trend}
          {subtitle && <span className="text-slate-500 dark:text-slate-400 text-xs">{subtitle}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
