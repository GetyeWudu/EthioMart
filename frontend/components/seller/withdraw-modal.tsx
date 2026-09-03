"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Building2,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { vendorService } from "@/features/vendors/services/vendor-service";
import { VendorWallet, VendorBankDetails } from "@/features/vendors/types";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: VendorWallet | null;
  onSuccess: () => void;
}

export function WithdrawModal({ isOpen, onClose, wallet, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [bankDetails, setBankDetails] = useState<VendorBankDetails | null>(null);
  const [supportedBanks, setSupportedBanks] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [useCustomAccount, setUseCustomAccount] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const availableBal = parseFloat(wallet?.available_balance || "0");
  const requestedNum = parseFloat(amount) || 0;
  const transferFee = 15.0;
  const netReceived = Math.max(0, requestedNum - transferFee);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessData(null);
      setAmount("");
      loadBankInfo();
    }
  }, [isOpen]);

  const loadBankInfo = async () => {
    setIsFetchingInfo(true);
    try {
      const [bankRes, banksDirectory] = await Promise.allSettled([
        vendorService.getSellerBankDetails(),
        vendorService.getSupportedBanks(),
      ]);

      if (bankRes.status === "fulfilled" && bankRes.value) {
        setBankDetails(bankRes.value);
        setSelectedBankCode(bankRes.value.bank_code || "");
        setAccountNumber(bankRes.value.account_number || "");
        setAccountName(bankRes.value.account_name || "");
      }

      if (banksDirectory.status === "fulfilled" && banksDirectory.value?.banks) {
        setSupportedBanks(banksDirectory.value.banks);
      }
    } catch {
      // Best effort load
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requestedNum < 500) {
      setError("Minimum withdrawal threshold is 500.00 ETB.");
      return;
    }

    if (requestedNum > availableBal) {
      setError(`Insufficient available balance (${availableBal.toFixed(2)} ETB).`);
      return;
    }

    if (!selectedBankCode || !accountNumber || !accountName) {
      setError("Please provide complete recipient bank / Telebirr payout details.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await vendorService.requestWithdrawal({
        amount: requestedNum,
        bank_code: selectedBankCode,
        account_number: accountNumber,
        account_name: accountName,
        bank_name: supportedBanks.find((b) => b.code === selectedBankCode)?.name || selectedBankCode,
      });

      setSuccessData(result);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to process withdrawal request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (availableBal >= 500) {
      setAmount(availableBal.toFixed(2));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Request Chapa Payout
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated multi-party disbursement via Telebirr, CBE, or Ethiopian Bank Rails.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successData ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Payout Initiated Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Reference: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{successData.transfer_reference}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Requested Gross:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{parseFloat(successData.requested_amount).toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Chapa Bank Transfer Fee:</span>
                <span className="font-mono font-semibold text-rose-500">-{parseFloat(successData.transfer_fee).toFixed(2)} ETB</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400">
                <span>Net Disbursed:</span>
                <span className="font-mono">{parseFloat(successData.disbursed_amount).toFixed(2)} ETB</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold h-11"
            >
              Done & Return to Ledger
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Available Balance Helper */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/40 dark:border-indigo-800/40">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Available for Withdrawal:
              </div>
              <div className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {availableBal.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
              </div>
            </div>

            {/* Withdrawal Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Withdrawal Amount (ETB)
                </Label>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Withdraw All Available
                </button>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="500"
                  max={availableBal}
                  placeholder="Min: 500.00 ETB"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 pl-4 pr-16 text-base font-mono rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ETB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Minimum request: 500.00 ETB • Limit: 75k (Telebirr) / 1M (Bank)
              </p>
            </div>

            {/* Recipient Account Details */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Recipient Payout Rail
                </Label>
                {bankDetails && (
                  <button
                    type="button"
                    onClick={() => setUseCustomAccount(!useCustomAccount)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                  >
                    {useCustomAccount ? "Use Saved Bank" : "Change Bank"}
                  </button>
                )}
              </div>

              {!useCustomAccount && bankDetails?.account_number ? (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {bankDetails.bank_name} ({bankDetails.account_number})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{bankDetails.account_name}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Saved Primary
                  </Badge>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-500">Select Bank / Mobile Wallet</Label>
                    <select
                      value={selectedBankCode}
                      onChange={(e) => setSelectedBankCode(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Ethiopian Rail --</option>
                      {supportedBanks.map((b, i) => (
                        <option key={b.id || `bank-${i}`} value={b.code}>
                          {b.name} ({b.code || b.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Account / Phone No.</Label>
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 100012345678 or 0911000000"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Account Legal Name</Label>
                      <Input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="TIN / Registered Name"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Financial Breakdown Card */}
            {requestedNum > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Requested Payout:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {requestedNum.toFixed(2)} ETB
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Chapa Bank Transfer Processing Fee:</span>
                  <span className="font-mono font-semibold text-rose-500">
                    -{transferFee.toFixed(2)} ETB
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Estimated Net Received in Bank / Telebirr:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {netReceived.toFixed(2)} ETB
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || requestedNum < 500 || requestedNum > availableBal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold gap-2 shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing via Chapa...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Confirm & Disburse Payout
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
