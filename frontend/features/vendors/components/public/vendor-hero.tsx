/**
 * frontend/features/vendors/components/public/vendor-hero.tsx
 * ==========================================================
 * Modern storefront header card with brand colors, logo, verification tier, live stats, and active promotions.
 */

"use client";

import Image from "next/image";
import { Store, MapPin, Mail, Phone, CheckCircle2, ShieldCheck, Flame, Sparkles, Package, Award } from "lucide-react";
import { PublicStore } from "../../types";

interface VendorHeroProps {
  store: PublicStore;
}

export function VendorHero({ store }: VendorHeroProps) {
  const autoPromo = store.active_promotions?.find((p) => !p.is_coupon_required);
  const couponPromo = store.active_promotions?.find((p) => p.is_coupon_required);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-md p-6 sm:p-8">
      {/* Top signature brand accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1261C9] via-[#0D4FA8] to-[#FF7900]" />

      {/* Ambient Brand Glows */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#1261C9]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-[#FF7900]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Store Header Details */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Store Logo */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-700 shadow-md ring-2 ring-[#1261C9]/20 flex items-center justify-center shrink-0">
              {store.store_logo ? (
                <Image
                  src={store.store_logo}
                  alt={store.store_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1261C9]/10 flex items-center justify-center text-[#1261C9]">
                  <Store className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {store.store_name}
                </h1>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1261C9]/10 border border-[#1261C9]/20 text-xs font-semibold text-[#1261C9] dark:text-[#4D8FE0] shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Merchant
                </div>
                {store.tier && store.tier !== "PROBATION" && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF7900]/10 border border-[#FF7900]/25 text-xs font-semibold text-[#FF7900] shrink-0">
                    <Award className="h-3.5 w-3.5" />
                    {store.tier_display || store.tier}
                  </div>
                )}
              </div>

              {/* Badges & Meta */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                {store.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#1261C9]" />
                    {store.city}, Ethiopia
                  </span>
                )}
                {store.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-[#1261C9]" />
                    {store.contact_email}
                  </span>
                )}
                {store.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-[#FF7900]" />
                    {store.contact_phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Catalog</span>
              <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                <Package className="w-3.5 h-3.5 text-[#1261C9]" /> {store.product_count ?? 0}
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Escrow</span>
              <span className="text-base font-bold text-[#FF7900] flex items-center gap-1 justify-center">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe
              </span>
            </div>
          </div>
        </div>

        {/* Store Description */}
        {store.store_description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            {store.store_description}
          </p>
        )}

        {/* Store Active Promotion Highlight Banner */}
        {autoPromo && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#FF7900]/10 via-[#FF7900]/5 to-transparent border border-[#FF7900]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF7900] to-[#E66800] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    Active Storewide Deal
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FF7900]/15 text-[#FF7900] text-[10px] font-extrabold">
                    {autoPromo.discount_value}% OFF
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {autoPromo.name} — Automatic discount applied to all items from {store.store_name}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF7900] to-[#E66800] text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Instant Price Deduction
            </div>
          </div>
        )}

        {couponPromo && !autoPromo && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#1261C9]/10 via-[#1261C9]/5 to-transparent border border-[#1261C9]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#1261C9] dark:text-[#4D8FE0] uppercase tracking-wider">
                  Store Coupon Code Available
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Use coupon code <span className="underline decoration-[#1261C9] font-mono text-[#1261C9] dark:text-[#4D8FE0]">{couponPromo.coupon_code}</span> for {couponPromo.discount_value}% off at checkout!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
