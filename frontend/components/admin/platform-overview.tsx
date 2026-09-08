"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { UpdateIcon } from "@radix-ui/react-icons";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function PlatformOverview() {
  const [timeRange, setTimeRange] = useState("30d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { data: response, isLoading } = useSWR(`/admin/analytics/?range=${timeRange}`, fetcher);

  const timeline: any[] = response?.timeline || [];
  const kpis = response?.kpis || { total_gmv: 0, range_gmv: 0, platform_net_revenue: 0 };

  // Fallback defaults if timeline is currently empty in database
  const defaultData = [
    { date: "Day 1", gmv: 42000, net: 4200, orders: 12 },
    { date: "Day 5", gmv: 58000, net: 5800, orders: 18 },
    { date: "Day 10", gmv: 51000, net: 5100, orders: 16 },
    { date: "Day 15", gmv: 74000, net: 7400, orders: 24 },
    { date: "Day 20", gmv: 89000, net: 8900, orders: 29 },
    { date: "Day 25", gmv: 95000, net: 9500, orders: 32 },
    { date: "Day 30", gmv: 128000, net: 12800, orders: 41 },
  ];

  const data = timeline.length > 0
    ? timeline.map((t) => ({
        date: t.date,
        gmv: Number(t.gmv) || 0,
        net: (Number(t.gmv) || 0) * 0.1, // 10% platform cut
        orders: Number(t.orders) || 0,
      }))
    : defaultData;

  const maxGmv = Math.max(1, ...data.map((d) => d.gmv));

  // SVG dimensions
  const viewBoxWidth = 1000;
  const viewBoxHeight = 240;

  // Bezier curve generator
  const createPath = (dataPoints: Array<{ gmv: number }>) => {
    if (dataPoints.length === 0) return "";
    let path = "";
    const stepX = viewBoxWidth / Math.max(1, dataPoints.length - 1);

    dataPoints.forEach((point, i) => {
      const x = i * stepX;
      const y = viewBoxHeight - (point.gmv / maxGmv) * (viewBoxHeight - 30) - 15;

      if (i === 0) {
        path += `M ${x},${y}`;
      } else {
        const prevX = (i - 1) * stepX;
        const prevY = viewBoxHeight - (dataPoints[i - 1].gmv / maxGmv) * (viewBoxHeight - 30) - 15;
        const cp1x = prevX + stepX / 2;
        const cp1y = prevY;
        const cp2x = x - stepX / 2;
        const cp2y = y;
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
      }
    });
    return path;
  };

  const linePath = createPath(data);
  const areaPath = `${linePath} L ${viewBoxWidth},${viewBoxHeight} L 0,${viewBoxHeight} Z`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/50 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans font-black text-slate-900 dark:text-white text-lg tracking-tight">
              Platform Transaction Volume (ETB)
            </h2>
            <Badge variant="outline" className="bg-[#EBF2FC] text-[#0D4FA8] border-[#A8C4ED] font-mono text-[10px]">
              ETB
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global Gross Merchandise Value (GMV) and EthioMart platform commission earnings.
          </p>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {["7d", "30d", "90d", "12m"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                timeRange === range
                  ? "bg-white dark:bg-slate-800 text-[#1261C9] dark:text-[#4D8FE0] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      {isLoading ? (
        <div className="h-60 flex items-center justify-center text-slate-400 text-xs gap-2">
          <UpdateIcon className="w-5 h-5 animate-spin text-[#1261C9]" />
          Loading platform metrics...
        </div>
      ) : (
        <div className="relative h-60 w-full select-none">
          {/* Y-axis Guides */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-1 flex justify-between">
              <span>ETB {maxGmv.toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
            </div>
            <div className="border-b border-slate-100/60 dark:border-slate-800/50 pb-1 flex justify-between">
              <span>ETB {(maxGmv * 0.66).toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
            </div>
            <div className="border-b border-slate-100/40 dark:border-slate-800/30 pb-1 flex justify-between">
              <span>ETB {(maxGmv * 0.33).toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>ETB 0</span>
            </div>
          </div>

          {/* SVG Smooth Curve */}
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="absolute inset-0 h-full w-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="adminGmvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
                <stop offset="90%" stopColor="#4f46e5" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Gradient Area */}
            <path d={areaPath} fill="url(#adminGmvGradient)" />

            {/* Main Stroke Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {data.map((item, i) => {
              const x = i * (viewBoxWidth / Math.max(1, data.length - 1));
              const y = viewBoxHeight - (item.gmv / maxGmv) * (viewBoxHeight - 30) - 15;
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  <circle cx={x} cy={y} r="24" fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "6" : "3.5"}
                    fill={isHovered ? "#4f46e5" : "white"}
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredIndex !== null && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150"
              style={{
                left: `${hoveredIndex * (100 / Math.max(1, data.length - 1))}%`,
                top: `${Math.max(10, 100 - (data[hoveredIndex].gmv / maxGmv) * 100)}%`,
                transform: "translate(-50%, -115%)",
              }}
            >
              <div className="bg-slate-950 text-white text-[11px] py-2 px-3.5 rounded-2xl shadow-2xl dark:bg-white dark:text-slate-900 whitespace-nowrap font-mono flex flex-col items-center border border-white/10 dark:border-slate-800">
                <span className="font-bold text-[10px] text-slate-400">{data[hoveredIndex].date}</span>
                <span className="font-black text-[#4D8FE0] dark:text-[#1261C9] text-xs mt-0.5">
                  Gross: ETB {data[hoveredIndex].gmv.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400 dark:text-emerald-600 font-semibold mt-0.5">
                  Platform Fee (10%): ETB {data[hoveredIndex].net.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-400">
                  {data[hoveredIndex].orders} transactions
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* X-Axis Date Ticks */}
      <div className="flex justify-between items-center w-full px-1 text-[10px] font-mono text-slate-400">
        {data.map((item, i) => (
          <span
            key={i}
            className={`transition-colors ${hoveredIndex === i ? "text-[#1261C9] dark:text-[#4D8FE0] font-bold" : ""}`}
          >
            {item.date}
          </span>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1261C9] inline-block" />
            Gross Retail GMV (ETB)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            10% Platform Intermediation Fee
          </span>
        </div>
        <div className="font-mono font-bold text-slate-900 dark:text-white">
          Period Gross: ETB {kpis.range_gmv.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
