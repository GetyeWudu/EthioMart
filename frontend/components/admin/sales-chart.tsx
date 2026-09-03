export function SalesChart() {
  const data = [
    { month: "Jan", sales: 120 },
    { month: "Feb", sales: 152 },
    { month: "Mar", sales: 138 },
    { month: "Apr", sales: 185 },
    { month: "May", sales: 148 },
    { month: "Jun", sales: 210 },
    { month: "Jul", sales: 194 },
    { month: "Aug", sales: 240 },
    { month: "Sep", sales: 215 },
    { month: "Oct", sales: 280 },
    { month: "Nov", sales: 245 },
    { month: "Dec", sales: 320 },
  ];

  const maxSales = Math.max(...data.map(d => d.sales));

  return (
    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-6">
      {data.map((item) => (
        <div key={item.month} className="flex flex-col items-center flex-1 group">
          <div className="w-full relative flex items-end justify-center h-[240px]">
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-xs py-1 px-2 rounded dark:bg-white dark:text-slate-900 whitespace-nowrap z-10 pointer-events-none">
              {item.sales}k Orders
            </div>
            {/* Bar */}
            <div 
              className="w-full max-w-[40px] bg-indigo-500/80 hover:bg-indigo-500 dark:bg-indigo-500/60 dark:hover:bg-indigo-400 rounded-t-sm transition-all duration-300"
              style={{ height: `${(item.sales / maxSales) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            {item.month}
          </span>
        </div>
      ))}
    </div>
  );
}
