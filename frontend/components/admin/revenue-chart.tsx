export function RevenueChart() {
  const data = [
    { day: "Mon", revenue: 45000 },
    { day: "Tue", revenue: 52000 },
    { day: "Wed", revenue: 38000 },
    { day: "Thu", revenue: 65000 },
    { day: "Fri", revenue: 48000 },
    { day: "Sat", revenue: 80000 },
    { day: "Sun", revenue: 74000 },
  ];

  const maxRev = Math.max(...data.map(d => d.revenue));

  return (
    <div className="h-[250px] w-full flex items-end justify-between gap-4 pt-6 px-2">
      {data.map((item) => (
        <div key={item.day} className="flex flex-col items-center flex-1 group">
          <div className="w-full relative flex items-end justify-center h-[200px]">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-xs py-1 px-2 rounded dark:bg-white dark:text-slate-900 whitespace-nowrap z-10 pointer-events-none">
              ${(item.revenue / 1000).toFixed(1)}k
            </div>
            <div 
              className="w-full bg-emerald-500/80 hover:bg-emerald-500 dark:bg-emerald-500/60 dark:hover:bg-emerald-400 rounded-t-sm transition-all duration-300"
              style={{ height: `${(item.revenue / maxRev) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            {item.day}
          </span>
        </div>
      ))}
    </div>
  );
}
