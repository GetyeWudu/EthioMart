import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  images: string[];
  itemCount?: number;
}

export function CategoryCard({ id, name, slug, images, itemCount }: CategoryCardProps) {
  // Ensure we always have exactly 4 images for the 2x2 grid
  const safeImages = images && images.length > 0 ? images.filter(Boolean) : [];
  const displayImages = safeImages.length >= 4 
    ? safeImages.slice(0, 4) 
    : safeImages.length > 0
    ? Array.from({ length: 4 }, (_, i) => safeImages[i % safeImages.length])
    : [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop", // Watch
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop", // Running shoe
        "https://images.unsplash.com/photo-1585515320310-259814833e62?q=80&w=300&auto=format&fit=crop", // Cookware
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop", // Smartphone
      ];

  return (
    <Link href={`/products?category=${slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30">
      {/* 2x2 Image Grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-[2px] aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900 p-[2px]">
        {displayImages.map((img, index) => (
          <div key={index} className="relative h-full w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
            <Image
              src={img}
              alt={`${name} image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
      
      {/* Footer / Info Panel */}
      <div className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-slate-950">
        <div className="flex flex-col">
          <h3 className="font-bold text-[11px] sm:text-[14px] text-slate-900 dark:text-slate-100 leading-tight font-serif group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>
          {itemCount !== undefined && (
            <p className="text-[9px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </p>
          )}
        </div>
        <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:bg-indigo-500 group-hover:text-white shrink-0 shadow-sm border border-slate-200 dark:border-slate-800">
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      </div>
    </Link>
  );
}
