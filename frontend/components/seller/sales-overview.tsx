"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { SalesChart } from "./sales-chart";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function SalesOverview() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: response, isLoading } = useSWR(`/vendors/me/analytics/?range=${timeRange}`, fetcher);

  const timeline: any[] = response?.timeline || [];
  const kpis = response?.kpis || { range_gross_gmv: 0, range_net_earnings: 0 };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Store Sales Trajectory & Net Earnings</h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px]">
              Currency: ETB
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gross sales revenue and net wallet credits after platform commission.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {["7d", "30d", "90d", "12m"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${timeRange === range
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <SalesChart timeline={timeline} isLoading={isLoading} />

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block" />
            Gross Retail Sales (ETB)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            Net Seller Earnings (ETB)
          </span>
        </div>
        <div className="font-mono font-bold text-slate-900 dark:text-white">
          Period Net: ETB {kpis.range_net_earnings.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
