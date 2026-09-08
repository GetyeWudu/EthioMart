/**
 * frontend/features/customers/components/admin/customer-stats-cards.tsx
 * ====================================================================
 * High-impact analytical KPI metric cards for Admin Customer Management.
 */

"use client";

import Link from "next/link";
import { Users, UserCheck, Wallet, UserPlus, ArrowRight } from "lucide-react";
import { AdminCustomerStats } from "../../types";

interface CustomerStatsCardsProps {
  stats?: AdminCustomerStats;
  isLoading?: boolean;
}

export function CustomerStatsCards({ stats, isLoading = false }: CustomerStatsCardsProps) {
  const formatETB = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const total = stats?.total_customers ?? 0;
  const active = stats?.active_customers ?? 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 100;
  const verified = stats?.verified_customers ?? 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 100;

  const cards = [
    {
      title: "Total Buyers",
      value: isLoading ? "—" : total.toLocaleString(),
      subtitle: `${activePct}% active accounts`,
      icon: Users,
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      trend: "Registered",
      href: "/admin/customers",
    },
    {
      title: "Active Shoppers",
      value: isLoading ? "—" : active.toLocaleString(),
      subtitle: `${verifiedPct}% email verified`,
      icon: UserCheck,
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      trend: "Eligible",
      href: "/admin/customers?status=ACTIVE",
    },
    {
      title: "Cumulative Spend",
      value: isLoading ? "—" : `${formatETB(stats?.total_spent_etb || "0")} ETB`,
      subtitle: `${stats?.total_orders_placed ?? 0} total platform orders`,
      icon: Wallet,
      gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      trend: "Lifetime GMV",
      href: "/admin/orders",
    },
    {
      title: "New This Month",
      value: isLoading ? "—" : (stats?.new_this_month ?? 0).toLocaleString(),
      subtitle: "Past 30 days signups",
      icon: UserPlus,
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      trend: "Acquisitions",
      href: "/admin/customers?ordering=-created_at",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Link
            key={idx}
            href={card.href}
            className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group cursor-pointer block"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight truncate">
                    {card.value}
                  </h3>
                </div>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {card.subtitle}
                </p>
              </div>

              <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${card.iconBg} shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>

            <div className="relative z-10 mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
              View details <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
