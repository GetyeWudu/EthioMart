"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface BrandBadgeProps {
  name: string;
  slug?: string;
  logo?: string | null;
  productCount?: number;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function BrandBadge({
  name,
  slug,
  logo,
  productCount,
  isVerified = true,
  size = "md",
  href,
  className = "",
}: BrandBadgeProps) {
  const [imgError, setImgError] = useState(false);

  // Compute clean 2-letter monogram
  const cleanName = (name || "Brand").trim();
  const words = cleanName.split(/\s+/);
  let monogram = "";
  if (words.length >= 2) {
    monogram = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    monogram = cleanName.slice(0, 2).toUpperCase();
  }

  // Size styling maps
  const sizeConfig = {
    sm: {
      avatar: "w-8 h-8 text-xs rounded-xl",
      card: "p-2 gap-2 text-xs",
      shield: "w-3 h-3",
    },
    md: {
      avatar: "w-12 h-12 text-sm rounded-2xl",
      card: "p-3 sm:p-4 gap-2.5 text-xs sm:text-sm",
      shield: "w-3.5 h-3.5",
    },
    lg: {
      avatar: "w-16 h-16 text-base rounded-3xl",
      card: "p-5 gap-3 text-sm sm:text-base",
      shield: "w-4 h-4",
    },
  }[size];

  const targetHref = href || (slug ? `/products?brand=${slug}` : undefined);

  const content = (
    <div
      className={`group relative flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-0.5 text-center ${sizeConfig.card} ${className}`}
    >
      {/* Brand Avatar / Monogram */}
      <div
        className={`relative ${sizeConfig.avatar} overflow-hidden shadow-sm flex items-center justify-center font-black tracking-tight shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          logo && !imgError
            ? "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800"
            : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 shadow-inner"
        }`}
      >
        {logo && !imgError ? (
          <Image
            src={logo}
            alt={name}
            fill
            className="object-contain p-1.5"
            onError={() => setImgError(true)}
            sizes="80px"
          />
        ) : (
          <span className="select-none">{monogram}</span>
        )}
      </div>

      {/* Brand Name & Verified Shield */}
      <div className="flex items-center justify-center gap-1 w-full mt-1">
        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate max-w-[110px]">
          {name}
        </span>
        {isVerified && (
          <ShieldCheck
            className={`${sizeConfig.shield} text-emerald-500 shrink-0`}
            aria-label="Verified Brand"
          />
        )}
      </div>

      {/* Product Count Pill */}
      {productCount !== undefined && productCount > 0 && (
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
          {productCount} {productCount === 1 ? "Product" : "Products"}
        </span>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <Link href={targetHref} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}
