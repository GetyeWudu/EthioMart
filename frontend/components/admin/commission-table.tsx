"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, CheckCircle2, Clock, DollarSign, Loader2, Store, Wallet, Building2, TrendingUp, Search } from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function CommissionTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: response, error, isLoading } = useSWR('/admin/commissions/', fetcher);

  const kpis = response?.kpis || {
    total_gross_commissions: 0,
    total_net_commissions: 0,
    total_vat_liability: 0,
    total_seller_payouts: 0,
    total_records: 0,
  };

  const records: any[] = response?.records || [];

  const filteredRecords = records.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.sub_order_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gross Platform Fees</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.total_gross_commissions.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">10% Average Fee Deducted</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Net Retained</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.total_net_commissions.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">GechExpress Operating Margin</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Seller Disbursed</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ETB {kpis.total_seller_payouts.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Net Cleared & In-Escrow to Vendors</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Platform Commission & Tax Splitting</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track order GMV, platform fee cuts, and merchant payout disbursements.</p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, order #, or COM ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Record ID</th>
                <th className="px-5 py-3.5">Merchant Store</th>
                <th className="px-5 py-3.5">Order / Sub-Order</th>
                <th className="px-5 py-3.5 text-right">Gross GMV</th>
                <th className="px-5 py-3.5 text-right">Platform Fee Split</th>
                <th className="px-5 py-3.5 text-right">Merchant Payout</th>
                <th className="px-5 py-3.5">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading platform commission splits...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No commission ledger records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((com) => (
                  <tr key={com.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {com.id}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">{com.date}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link 
                        href={`/admin/sellers/${com.seller_id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5" />
                        {com.seller}
                      </Link>
                      <span className="block text-[10px] text-slate-400">TIN: {com.seller_tin}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white block">#{com.order_id}</span>
                      <span className="font-mono text-[10px] text-slate-400">#{com.sub_order_id}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ETB {com.amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        ETB {com.fee.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ({com.commission_rate}%)
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      ETB {com.netPayout.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      {com.status === "Paid" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] font-bold gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] font-bold gap-1">
                          <Clock className="h-3 w-3" /> Held (72h)
                        </Badge>
                      )}
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
