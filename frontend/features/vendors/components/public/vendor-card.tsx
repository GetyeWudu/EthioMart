/**
 * frontend/features/vendors/components/public/vendor-card.tsx
 * ==========================================================
 * Card representing an approved merchant store on the public marketplace.
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Store, MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import { PublicStore } from "../../types";

interface VendorCardProps {
  store: PublicStore;
}

export function VendorCard({ store }: VendorCardProps) {
  return (
    <Link
      href={`/vendors/${store.slug}`}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-[#1261C9]/40 dark:hover:border-[#1261C9]/30 transition-all flex flex-col justify-between"
    >
      {/* Banner / Header */}
      <div className="relative h-28 w-full bg-gradient-to-r from-[#1261C9]/15 via-[#1261C9]/5 to-[#FF7900]/15 overflow-hidden">
        {store.store_banner ? (
          <Image
            src={store.store_banner}
            alt={`${store.store_name} Banner`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1261C9]/10 via-[#FF7900]/10 to-transparent" />
        )}

        {/* Logo Avatar */}
        <div className="absolute -bottom-6 left-5 h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-950 shadow-md flex items-center justify-center text-[#1261C9] dark:text-[#4D8FE0] overflow-hidden">
          {store.store_logo ? (
            <Image
              src={store.store_logo}
              alt={store.store_name}
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            <Store className="h-7 w-7" />
          )}
        </div>
      </div>

      {/* Body Info */}
      <div className="p-5 pt-8 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#1261C9] dark:group-hover:text-[#4D8FE0] transition-colors truncate">
              {store.store_name}
            </h3>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
            {store.store_description || "Verified merchant on EthioMart Marketplace."}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{store.city || "Ethiopia"}</span>
          </div>

          <span className="font-medium text-[#1261C9] dark:text-[#4D8FE0] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Visit Store <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
