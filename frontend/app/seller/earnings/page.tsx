/**
 * frontend/app/seller/earnings/page.tsx
 * =====================================
 * Seller earnings and wallet projection dashboard with live VendorWallet readouts.
 */

"use client";

import { useState } from "react";
import { mutate } from "swr";
import { useVendorWallet, WalletCard } from "@/features/vendors";
import { EarningsTable } from "@/components/seller/earnings-table";
import { WithdrawModal } from "@/components/seller/withdraw-modal";
import { Button } from "@/components/ui/button";
import { Download, Wallet, RefreshCw, Loader2 } from "lucide-react";

export default function EarningsPage() {
  const { wallet, isLoading, refetch } = useVendorWallet();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleRefreshAll = async () => {
    await Promise.all([
      refetch(),
      mutate("/vendors/me/ledger/"),
    ]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Earnings & Wallet Projections
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance projections, 5-minute escrow holds (Test Mode), and settlement history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="gap-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh Balances
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Export Statement
          </Button>
          <Button
            onClick={() => setIsWithdrawOpen(true)}
            disabled={!wallet || wallet.is_payout_locked || parseFloat(wallet.available_balance || "0") <= 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white gap-2 rounded-xl text-xs sm:text-sm shadow-md"
          >
            <Wallet className="h-4 w-4" />
            Request Chapa Payout
          </Button>
        </div>
      </div>

      {/* Live Financial Wallet Projection Readouts */}
      <WalletCard wallet={wallet} isLoading={isLoading} />

      {/* Historical Ledger & Orders Breakdown */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Order Escrow & Payout Ledger
        </h2>
        <EarningsTable />
      </div>

      {/* Chapa Payout Withdrawal Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        wallet={wallet}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
