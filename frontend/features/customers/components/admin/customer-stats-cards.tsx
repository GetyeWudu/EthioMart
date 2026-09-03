/**
 * frontend/features/customers/components/admin/customer-stats-cards.tsx
 * ====================================================================
 * High-impact analytical KPI metric cards for Admin Customer Management.
 */

"use client";

import { Users, UserCheck, Wallet, UserPlus, TrendingUp } from "lucide-react";
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
    },
    {
      title: "Active Shoppers",
      value: isLoading ? "—" : active.toLocaleString(),
      subtitle: `${verifiedPct}% email verified`,
      icon: UserCheck,
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      trend: "Eligible",
    },
    {
      title: "Cumulative Spend",
      value: isLoading ? "—" : `${formatETB(stats?.total_spent_etb || "0")} ETB`,
      subtitle: `${stats?.total_orders_placed ?? 0} total platform orders`,
      icon: Wallet,
      gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      trend: "Lifetime GMV",
    },
    {
      title: "New This Month",
      value: isLoading ? "—" : (stats?.new_this_month ?? 0).toLocaleString(),
      subtitle: "Past 30 days signups",
      icon: UserPlus,
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      trend: "Acquisitions",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {card.subtitle}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
