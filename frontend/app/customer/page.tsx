"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { Package, Heart, Star, ShoppingBag, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function CustomerDashboardOverview() {
  const user = useAuthStore((s) => s.user);

  const { data: ordersData } = useSWR("/orders/", fetcher);
  const { data: wishlistData } = useSWR("/wishlists/", fetcher);
  const { data: reviewsData } = useSWR("/customer/reviews/", fetcher);

  const orders: any[] = Array.isArray(ordersData) ? ordersData : (ordersData?.results || []);
  const wishlistItems: any[] = Array.isArray(wishlistData) ? wishlistData : (wishlistData?.results || []);
  const reviews: any[] = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.results || []);

  const recentOrders = orders.slice(0, 5);
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (user?.email?.split("@")[0] || "Customer");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{displayName}</span>!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Manage your personal orders, saved wishlist items, and verified product reviews.
          </p>
        </div>

        <Link href="/products">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5" /> Explore Products
          </Button>
        </Link>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Orders</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{orders.length}</p>
            <Link href="/customer/orders" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 mt-2">
              View all orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saved Wishlist Items</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{wishlistItems.length}</p>
            <Link href="/customer/wishlist" className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline inline-flex items-center gap-1 mt-2">
              View wishlist <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Reviews</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Star className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{reviews.length}</p>
            <Link href="/customer/reviews" className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 mt-2">
              Manage reviews <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/customer/orders" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Orders
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No orders placed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore thousands of verified products from Ethiopian sellers with secure Chapa / Telebirr escrow protection.
              </p>
            </div>
            <Link href="/products" className="inline-block pt-2">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                Start Shopping Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-800 shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total (ETB)</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{ord.order_number}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      {new Date(ord.created_at).toLocaleDateString("en-ET", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-[10px] font-bold ${ord.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {ord.payment_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {ord.status || "CONFIRMED"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ETB {Number(ord.total_amount).toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/customer/orders/${ord.id}`} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
