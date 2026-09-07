"use client";

import React, { useState } from "react";
import { UpdateIcon } from "@radix-ui/react-icons";

interface AdminSalesChartProps {
  timeline?: Array<{
    date: string;
    gmv: number;
    orders: number;
  }>;
  isLoading?: boolean;
}

export function SalesChart({ timeline = [], isLoading = false }: AdminSalesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const defaultData = [
    { date: "Jan", gmv: 45000, orders: 12 },
    { date: "Feb", gmv: 52000, orders: 15 },
    { date: "Mar", gmv: 38000, orders: 10 },
    { date: "Apr", gmv: 65000, orders: 18 },
    { date: "May", gmv: 48000, orders: 14 },
    { date: "Jun", gmv: 80000, orders: 22 },
    { date: "Jul", gmv: 74000, orders: 19 },
    { date: "Aug", gmv: 90000, orders: 25 },
    { date: "Sep", gmv: 85000, orders: 23 },
    { date: "Oct", gmv: 110000, orders: 30 },
    { date: "Nov", gmv: 95000, orders: 27 },
    { date: "Dec", gmv: 130000, orders: 35 },
  ];

  const data = timeline.length > 0 ? timeline : defaultData;
  const maxSales = Math.max(1, ...data.map((d) => d.gmv));

  const viewBoxWidth = 1000;
  const viewBoxHeight = 240;

  const createPath = (dataPoints: Array<{ gmv: number }>) => {
    if (dataPoints.length === 0) return "";
    let path = "";
    const stepX = viewBoxWidth / Math.max(1, dataPoints.length - 1);

    dataPoints.forEach((point, i) => {
      const x = i * stepX;
      const y = viewBoxHeight - (point.gmv / maxSales) * (viewBoxHeight - 30) - 15;

      if (i === 0) {
        path += `M ${x},${y}`;
      } else {
        const prevX = (i - 1) * stepX;
        const prevY = viewBoxHeight - (dataPoints[i - 1].gmv / maxSales) * (viewBoxHeight - 30) - 15;
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

  if (isLoading) {
    return (
      <div className="h-60 flex items-center justify-center text-slate-400 text-xs gap-2">
        <UpdateIcon className="w-5 h-5 animate-spin text-indigo-600" />
        Loading sales data...
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="relative h-60 w-full">
        {/* Guides */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between">
            <span>ETB {maxSales.toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="border-b border-slate-100/60 dark:border-slate-800/60 pb-1 flex justify-between">
            <span>ETB {(maxSales * 0.66).toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="border-b border-slate-100/40 dark:border-slate-800/40 pb-1 flex justify-between">
            <span>ETB {(maxSales * 0.33).toLocaleString("en-ET", { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>ETB 0</span>
          </div>
        </div>

        {/* SVG Bezier */}
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="adminSalesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="90%" stopColor="#4f46e5" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#adminSalesGradient)" />
          <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((item, i) => {
            const x = i * (viewBoxWidth / Math.max(1, data.length - 1));
            const y = viewBoxHeight - (item.gmv / maxSales) * (viewBoxHeight - 30) - 15;
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle cx={x} cy={y} r="25" fill="transparent" />
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

        {hoveredIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150"
            style={{
              left: `${hoveredIndex * (100 / Math.max(1, data.length - 1))}%`,
              top: `${Math.max(10, 100 - (data[hoveredIndex].gmv / maxSales) * 100)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-950 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl dark:bg-white dark:text-slate-900 whitespace-nowrap mb-2 font-mono flex flex-col items-center">
              <span className="font-bold text-[10px] text-slate-400">{data[hoveredIndex].date}</span>
              <span className="font-black text-indigo-400 dark:text-indigo-600">
                ETB {data[hoveredIndex].gmv.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400">{data[hoveredIndex].orders} orders</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center w-full mt-3 px-1 text-[10px] font-mono text-slate-400">
        {data.map((item, i) => (
          <span key={i} className={`transition-colors ${hoveredIndex === i ? "text-indigo-600 font-bold" : ""}`}>
            {item.date}
          </span>
        ))}
      </div>
    </div>
  );
}
