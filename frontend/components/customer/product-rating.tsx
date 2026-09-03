import { Star } from "lucide-react";

interface ProductRatingProps {
  rating: number;
  maxRating?: number;
  reviewsCount?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function ProductRating({ 
  rating, 
  maxRating = 5, 
  reviewsCount, 
  showCount = true,
  size = "md",
  className = "",
  interactive = false,
  onRate
}: ProductRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, i) => {
          const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
          const isInteractive = interactive && onRate;
          
          return (
            <div 
              key={i} 
              className={`relative ${isInteractive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
              onClick={() => isInteractive && onRate(i + 1)}
            >
              <Star className={`${sizeClasses[size]} text-slate-200 dark:text-slate-700`} strokeWidth={2} />
              
              {fillPercentage > 0 && (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${sizeClasses[size]} fill-amber-400 text-amber-400`} strokeWidth={2} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {(rating > 0 || showCount) && (
        <div className={`flex items-center gap-1 text-slate-500 dark:text-slate-400 ${textClasses[size]}`}>
          {rating > 0 && <span className="font-medium text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>}
          {showCount && reviewsCount !== undefined && (
            <span>({reviewsCount})</span>
          )}
        </div>
      )}
    </div>
  );
}
