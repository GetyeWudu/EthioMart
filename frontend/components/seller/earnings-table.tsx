"use client";

import useSWR from "swr";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, Info, Loader2, Receipt, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { vendorService } from "@/features/vendors/services/vendor-service";
import { VendorLedgerEntry } from "@/features/vendors/types";

export function EarningsTable() {
  const {
    data: entries = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<VendorLedgerEntry[]>("/vendors/me/ledger/", () => vendorService.getSellerLedger(), {
    revalidateOnFocus: true,
    refreshInterval: 10000,
  });

  const formatETB = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getEntryBadge = (type: string) => {
    switch (type) {
      case "ESCROW_CREDIT":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 gap-1 text-[11px] font-semibold">
            <Clock className="h-3 w-3" /> Escrow Credited (5m Hold)
          </Badge>
        );
      case "ESCROW_RELEASE":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Cleared (Available)
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60 gap-1 text-[11px] font-semibold">
            <ArrowUpRight className="h-3 w-3" /> Chapa Payout
          </Badge>
        );
      case "ESCROW_REFUND":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 gap-1 text-[11px] font-semibold">
            <ArrowDownRight className="h-3 w-3" /> Escrow Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Financial Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable Transaction Records & Multi-Party Chapa Escrow Audit Trail
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isValidating ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading financial ledger...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          No financial ledger entries recorded yet. Dispatched sub-orders will appear here with complete tax breakdowns.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5 whitespace-nowrap">Event / Date</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Order Ref</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Status / Type</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Gross Order</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Platform Fee</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Product Tax</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Net Credited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {entries.map((row) => {
                const isPositive = parseFloat(row.net_amount) >= 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">
                        {formatDate(row.created_at)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {row.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.sub_order_id ? (
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                          #{row.sub_order_id.substring(0, 8).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEntryBadge(row.entry_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                      {row.entry_type === "ESCROW_CREDIT" ? (
                        `${formatETB(row.amount)} ETB`
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {/* Platform Fee Column */}
                    <td className="px-6 py-4">
                      {row.entry_type === "ESCROW_CREDIT" && parseFloat(row.commission_deducted) > 0 ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            -{formatETB(row.commission_deducted)} ETB{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({parseFloat(row.commission_rate || "0").toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ) : row.entry_type === "WITHDRAWAL" && parseFloat(row.commission_deducted) > 0 ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            -{formatETB(row.commission_deducted)} ETB
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Transfer Fee
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Product Tax Column: Only for ESCROW_CREDIT rows */}
                    <td className="px-6 py-4">
                      {row.entry_type === "ESCROW_CREDIT" ? (
                        row.is_vat_registered_vendor && parseFloat(row.seller_vat_advisory || "0") > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50">
                              15% VAT Included
                            </span>
                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              {formatETB(row.seller_vat_advisory)} ETB
                              <span title="Estimated seller Output VAT on gross retail price for your MoR monthly declaration (Proc. 1341/2024).">
                                <Info className="h-3 w-3 text-slate-400 cursor-help" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Non-VAT / TOT</span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Net Credited Column */}
                    <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                      {row.entry_type === "ESCROW_CREDIT" && (
                        <div className="flex flex-col items-end gap-1 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          <span>+{formatETB(row.net_amount)} ETB</span>
                        </div>
                      )}
                      {row.entry_type === "ESCROW_RELEASE" && (
                        <div className="flex flex-col items-end gap-1 font-bold text-sm text-slate-900 dark:text-white">
                          <span>{formatETB(row.net_amount)} ETB</span>
                          <span className="text-[10px] text-slate-500 font-sans font-normal border border-slate-200 dark:border-slate-800 px-1.5 rounded-sm">
                            Moved to Available
                          </span>
                        </div>
                      )}
                      {(row.entry_type === "ESCROW_REFUND" || row.entry_type === "WITHDRAWAL") && (
                        <div className="flex flex-col items-end gap-1 font-bold text-sm text-rose-600 dark:text-rose-400">
                          <span>-{formatETB(Math.abs(Number(row.net_amount)))} ETB</span>
                          <span className="text-[10px] text-slate-500 font-sans font-normal border border-slate-200 dark:border-slate-800 px-1.5 rounded-sm">
                            {row.entry_type === "ESCROW_REFUND" ? "Reversed from Pending" : "Disbursed to Bank"}
                          </span>
                        </div>
                      )}
                      {!["ESCROW_CREDIT", "ESCROW_RELEASE", "ESCROW_REFUND", "WITHDRAWAL"].includes(row.entry_type) && (
                        <div className={`flex items-center justify-end gap-1 font-bold text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isPositive ? '+' : ''}{formatETB(row.net_amount)} ETB
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

