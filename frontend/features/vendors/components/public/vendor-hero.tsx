/**
 * frontend/features/vendors/components/public/vendor-hero.tsx
 * ==========================================================
 * Premium storefront header with banner, logo, verification tier, live stats, and active promotion banners.
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
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xl shadow-md">
      {/* Decorative Brand Banner */}
      <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-indigo-700 via-purple-700 to-rose-600 overflow-hidden isolate">
        {store.store_banner ? (
          <Image
            src={store.store_banner}
            alt={`${store.store_name} Banner`}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0">
            {/* Mesh gradient & ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900/90 to-rose-900/80" />
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-indigo-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-rose-400/20 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
          </div>
        )}
      </div>

      {/* Store Header Details */}
      <div className="p-6 sm:p-8 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
          <div className="flex items-end gap-4">
            {/* Store Logo */}
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-primary overflow-hidden shrink-0">
              {store.store_logo ? (
                <Image
                  src={store.store_logo}
                  alt={store.store_name}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                  <Store className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {store.store_name}
                </h1>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Merchant
                </div>
                {store.tier && store.tier !== "PROBATION" && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Award className="h-3.5 w-3.5" />
                    {store.tier_display || store.tier}
                  </div>
                )}
              </div>

              {/* Badges & Meta */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                {store.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {store.city}, Ethiopia
                  </span>
                )}
                {store.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {store.contact_email}
                  </span>
                )}
                {store.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {store.contact_phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start sm:self-end">
            <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Catalog</span>
              <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                <Package className="w-3.5 h-3.5 text-primary" /> {store.product_count ?? 0}
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Escrow</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center">
                <ShieldCheck className="w-3.5 h-3.5" /> 100%
              </span>
            </div>
          </div>
        </div>

        {/* Store Description */}
        {store.store_description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mb-4">
            {store.store_description}
          </p>
        )}

        {/* Store Active Promotion Highlight Banner */}
        {autoPromo && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Active Storewide Deal
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">
                    {autoPromo.discount_value}% OFF
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {autoPromo.name} — Automatic discount applied to all items from {store.store_name}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              Instant Price Deduction
            </div>
          </div>
        )}

        {couponPromo && !autoPromo && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Store Coupon Code Available
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Use coupon code <span className="underline decoration-indigo-500 font-mono text-indigo-600 dark:text-indigo-400">{couponPromo.coupon_code}</span> for {couponPromo.discount_value}% off at checkout!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
