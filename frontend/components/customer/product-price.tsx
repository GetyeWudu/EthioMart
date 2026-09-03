interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ProductPrice({ price, originalPrice, discountPercentage, size = "md", className = "" }: ProductPriceProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl"
  };

  const originalSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  const badgeSizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
    xl: "px-3 py-1 text-base"
  };

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-bold text-slate-900 dark:text-white ${sizeClasses[size]}`}>
        ${price.toFixed(2)}
      </span>
      
      {originalPrice && originalPrice > price && (
        <span className={`font-medium text-slate-500 line-through dark:text-slate-400 ${originalSizeClasses[size]}`}>
          ${originalPrice.toFixed(2)}
        </span>
      )}
      
      {discountPercentage && discountPercentage > 0 && (
        <span className={`rounded-full bg-rose-100 font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 ${badgeSizeClasses[size]}`}>
          -{discountPercentage}%
        </span>
      )}
    </div>
  );
}
