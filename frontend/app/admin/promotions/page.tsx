"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Tag, 
  Loader2, 
  Calendar, 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  TrendingUp, 
  RefreshCw,
  Store,
  Percent,
  Filter,
} from "lucide-react";
import useSWR from "swr";
import api from "@/lib/api";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminPromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [statusOpen, setStatusOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR("/admin/promotions/", fetcher);

  const promotions: any[] = data?.results || data || [];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied coupon code ${code} to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const togglePromotionStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/promotions/${id}/`, { is_active: !currentStatus });
      toast.success(`Promotion ${!currentStatus ? "activated" : "deactivated"} successfully.`);
      mutate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update promotion status.");
    }
  };

  const filteredPromotions = promotions.filter((promo) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      promo.name?.toLowerCase().includes(q) ||
      promo.coupon_code?.toLowerCase().includes(q) ||
      (promo.vendor_name || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? promo.is_active
        : !promo.is_active;

    return matchesQuery && matchesStatus;
  });

  const totalActive = promotions.filter((p) => p.is_active).length;
  const totalUses = promotions.reduce((sum, p) => sum + (p.current_uses || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
              Marketplace Promotions &amp; Campaigns
            </h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px]">
              Campaigns Hub
            </Badge>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Feed
        </Button>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Campaigns</span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {promotions.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Created across vendors</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Active Live Promos</span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {totalActive}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Eligible at checkout</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Redemptions</span>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {totalUses.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Applied on customer orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Discount Types</span>
          <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-2 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-purple-600" /> Percentage & Fixed ETB
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Automated validation</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search promotion name or coupon code..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              {statusFilter === "ALL" ? "All Statuses" : statusFilter === "ACTIVE" ? "Active" : "Disabled"}
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-[200] w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg py-1 text-xs">
                {(["ALL", "ACTIVE", "DISABLED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-medium ${
                      statusFilter === status
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {status === "ALL" ? "All Statuses" : status === "ACTIVE" ? "Active" : "Disabled"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Campaign Name & Code</th>
                <th className="px-5 py-3.5">Merchant Store</th>
                <th className="px-5 py-3.5">Discount Value</th>
                <th className="px-5 py-3.5">Redemption Usage</th>
                <th className="px-5 py-3.5 text-right">Active Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading marketplace promotions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-rose-500">
                    Failed to load promotions feed.
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No promotions found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo: any) => (
                  <tr key={promo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{promo.name}</div>
                      {promo.coupon_code && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-indigo-500" />
                            {promo.coupon_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(promo.coupon_code)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copy coupon code"
                          >
                            {copiedCode === promo.coupon_code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{promo.vendor_name || (promo.vendor ? `Vendor #${String(promo.vendor).slice(0, 8)}` : "Platform Global")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {promo.discount_type === "PERCENTAGE" ? `${promo.discount_value}% OFF` : `ETB ${Number(promo.discount_value).toLocaleString()} OFF`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {promo.current_uses || 0} uses
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {promo.max_uses ? `Max limit: ${promo.max_uses}` : "Unlimited redemptions"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Badge
                          variant="outline"
                          className={
                            promo.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                              : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"
                          }
                        >
                          {promo.is_active ? "Active" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => togglePromotionStatus(promo.id, promo.is_active)}
                          aria-label="Toggle promotion status"
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
