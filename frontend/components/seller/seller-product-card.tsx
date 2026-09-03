"use client";

import Image from "next/image";
import Link from "next/link";
import { Edit, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SellerProductCardProps {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  sales: number;
  status: string;
  image: string;
  sku: string;
}

export function SellerProductCard({
  id,
  name,
  category,
  brand,
  price,
  stock,
  sales,
  status,
  image,
  sku,
}: SellerProductCardProps) {
  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return (
        <div className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
        {status}
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 z-10">
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 md:p-5 bg-white dark:bg-slate-950">
        <h3 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white sm:text-[15px]">
          {name}
        </h3>
        
        <div className="mt-1 flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {category} <span className="mx-1.5 opacity-50">•</span> {brand}
        </div>

        <div className="mt-3 sm:mt-6 flex items-end justify-between gap-1">
          <div className="text-sm font-bold text-slate-900 dark:text-white sm:text-[15px]">
            ETB {price.toFixed(2)}
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-500">
              {stock} stock
            </span>
            <span className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {sales} sold
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {sku}
          </span>
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
