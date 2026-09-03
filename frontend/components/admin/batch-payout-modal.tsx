"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Loader2, Send, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface PayoutItem {
  id: string;
  uuid: string;
  vendor_name: string;
  vendor_id: string;
  amount: number;
  transfer_fee: number;
  net_disbursement: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
}

interface BatchPayoutModalProps {
  pendingPayouts: PayoutItem[];
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function BatchPayoutModal({ pendingPayouts = [], onSuccess, trigger }: BatchPayoutModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize all selected when opened
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedIds(pendingPayouts.map(p => p.uuid));
    }
  };

  const toggleSelect = (uuid: string) => {
    setSelectedIds(prev => 
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === pendingPayouts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingPayouts.map(p => p.uuid));
    }
  };

  const selectedItems = pendingPayouts.filter(p => selectedIds.includes(p.uuid));
  const totalGross = selectedItems.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = selectedItems.length * 15.00; // 15 ETB fee per Chapa transfer
  const totalNetDisbursement = Math.max(0, totalGross - totalFees);

  const handleExecuteBatch = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one payout request to disburse.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post("/admin/payments/payouts/batch-disburse/", {
        payout_ids: selectedIds,
      });

      toast.success(res.data?.message || `Disbursed ${selectedIds.length} payouts successfully!`);
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to execute batch payout transfers.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-bold shadow-sm">
            <Send className="w-3.5 h-3.5" />
            Batch Payout ({pendingPayouts.length})
          </Button>
        } />
      )}

      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Wallet className="w-5 h-5" />
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Two-Click Batch Payout Execution
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Directly disburse cleared merchant earnings to Ethiopian bank accounts and Telebirr via Chapa Transfer API.
          </DialogDescription>
        </DialogHeader>

        {/* Payout Summary Cards */}
        <div className="grid grid-cols-3 gap-3 my-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Selected Requests</span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {selectedItems.length} of {pendingPayouts.length}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Transfer Fees (15 ETB/rail)</span>
            <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
              -ETB {totalFees.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium block">Net Chapa Disbursement</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ETB {totalNetDisbursement.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payout List */}
        <div className="flex-1 overflow-y-auto max-h-64 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button type="button" onClick={selectAll} className="text-indigo-600 hover:underline">
              {selectedIds.length === pendingPayouts.length ? "Deselect All" : "Select All"}
            </button>
            <span>{selectedIds.length} selected</span>
          </div>

          {pendingPayouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No pending seller payout withdrawal requests in queue.
            </div>
          ) : (
            pendingPayouts.map((p) => {
              const isSelected = selectedIds.includes(p.uuid);
              return (
                <div 
                  key={p.uuid} 
                  onClick={() => toggleSelect(p.uuid)}
                  className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => {}} 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.vendor_name}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {p.bank_name} • {p.account_number} ({p.account_name})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">
                      ETB {p.amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">{p.created_at}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleExecuteBatch} 
            disabled={isProcessing || selectedIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Dispatching via Chapa...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Disburse ETB {totalNetDisbursement.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ({selectedIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
