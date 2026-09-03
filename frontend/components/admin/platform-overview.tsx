"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { TrendingUp, ArrowUpRight, BarChart3, Calendar, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function PlatformOverview() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: response, isLoading, mutate } = useSWR(`/admin/analytics/?range=${timeRange}`, fetcher);

  const timeline: any[] = response?.timeline || [];
  const kpis = response?.kpis || { total_gmv: 0, range_gmv: 0, platform_net_revenue: 0 };
  const maxGmv = Math.max(1, ...timeline.map(t => t.gmv));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Platform Transaction Volume & Growth</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Platform-wide order GMV and intermediation fee revenue over time.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {["7d", "30d", "90d", "12m"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                timeRange === range
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Deck */}
      <div className="h-60 flex items-end gap-2 sm:gap-3.5 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-slate-800">
        {timeline.map((item, idx) => {
          const heightPercent = Math.max(8, Math.round((item.gmv / maxGmv) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                ETB {item.gmv.toLocaleString('en-ET', { minimumFractionDigits: 0 })} ({item.orders} orders)
              </div>
              
              {/* Bar */}
              <div 
                style={{ height: `${heightPercent}%` }}
                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all cursor-pointer shadow-xs"
              />
              {/* Label */}
              <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">
                {item.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block" />
            Gross Retail GMV (ETB)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            10% Platform Fee Cut
          </span>
        </div>
        <div className="font-mono font-bold text-slate-900 dark:text-white">
          Period Total: ETB {kpis.range_gmv.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
