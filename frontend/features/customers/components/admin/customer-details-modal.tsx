/**
 * frontend/features/customers/components/admin/customer-details-modal.tsx
 * ======================================================================
 * Comprehensive Customer Profile Inspector, Order History, Addresses & Status Actions.
 */

"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Unlock,
  Building,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { customerService } from "../../services/customer-service";
import { AdminCustomerDetail } from "../../types";

interface CustomerDetailsModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export function CustomerDetailsModal({
  customerId,
  isOpen,
  onClose,
  onStatusChanged,
}: CustomerDetailsModalProps) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "disputes">("orders");

  useEffect(() => {
    if (isOpen && customerId) {
      setIsLoading(true);
      customerService
        .getCustomerDetail(customerId)
        .then((res) => {
          if (res.success && res.customer) {
            setCustomer(res.customer);
          }
        })
        .catch((err) => console.error("Failed to load customer detail:", err))
        .finally(() => setIsLoading(false));
    } else {
      setCustomer(null);
    }
  }, [isOpen, customerId]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    try {
      setIsUpdatingStatus(true);
      const res = await customerService.toggleCustomerStatus(customer.id, !customer.is_active);
      if (res.success) {
        setCustomer((prev) => (prev ? { ...prev, is_active: res.is_active } : null));
        onStatusChanged?.();
      }
    } catch (err) {
      console.error("Failed to toggle customer status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!customer) return;
    try {
      setIsUpdatingStatus(true);
      const res = await customerService.verifyCustomerEmail(customer.id);
      if (res.success) {
        setCustomer((prev) => (prev ? { ...prev, is_email_verified: true } : null));
        onStatusChanged?.();
      }
    } catch (err) {
      console.error("Failed to verify customer email:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
      });
    } catch {
      return iso;
    }
  };

  if (!isOpen) return null;

  const totalSpentNum = parseFloat(customer?.total_spent || "0");
  const totalOrdersNum = customer?.total_orders || 0;
  const avgOrderVal = totalOrdersNum > 0 ? (totalSpentNum / totalOrdersNum).toFixed(2) : "0.00";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Customer Profile & History
            </DialogTitle>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Loading customer data...</p>
          </div>
        ) : !customer ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Customer details could not be found.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Customer Info Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20 shrink-0 uppercase">
                  {customer.first_name?.[0] || customer.email?.[0] || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {customer.full_name || "Anonymous Buyer"}
                    </h3>
                    {customer.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[11px] font-semibold">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Suspended
                      </Badge>
                    )}
                    {customer.is_email_verified ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px]">
                        <ShieldCheck className="h-3 w-3 mr-1 text-blue-500" /> Verified Email
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 text-[10px]">
                        Unverified
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {customer.email}
                    </span>
                    {customer.phone_number && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {customer.phone_number}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Joined {formatDate(customer.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                {!customer.is_email_verified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleVerifyEmail}
                    disabled={isUpdatingStatus}
                    className="text-xs rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                  >
                    Verify Email
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={customer.is_active ? "destructive" : "default"}
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={`text-xs rounded-xl gap-1.5 shadow-sm ${
                    !customer.is_active ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : customer.is_active ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Suspend Account
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> Activate Account
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Financial Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Lifetime Spend
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {formatETB(customer.total_spent)} ETB
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                  {customer.total_orders}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Average Order
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                  {formatETB(avgOrderVal)} ETB
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Disputes Filed
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  {customer.disputes_count}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "orders"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders History ({customer.orders?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "addresses"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Saved Addresses ({customer.addresses?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("disputes")}
                  className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "disputes"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Disputes & Claims ({customer.disputes?.length || 0})
                </button>
              </div>

              {/* Tab 1: Orders */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {!customer.orders || customer.orders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No orders placed by this customer yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {customer.orders.map((ord) => (
                        <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                #{ord.order_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  ord.payment_status === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                }`}
                              >
                                {ord.payment_status}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Placed on {formatDate(ord.created_at)} • {ord.delivery_method}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                              {formatETB(ord.total_amount)} ETB
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {ord.items_count} item{ord.items_count === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Addresses */}
              {activeTab === "addresses" && (
                <div className="space-y-3">
                  {!customer.addresses || customer.addresses.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No saved delivery addresses on file.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customer.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building className="h-4 w-4 text-slate-400" />
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 text-[10px]">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {addr.city}, {addr.subcity}
                            {addr.woreda && ` • Woreda ${addr.woreda}`}
                            {addr.house_no && ` • House #${addr.house_no}`}
                          </p>
                          {addr.landmark && (
                            <p className="text-[11px] text-slate-400 italic">
                              Landmark: {addr.landmark}
                            </p>
                          )}
                          <p className="text-xs font-mono text-slate-500 pt-1">
                            📞 {addr.phone_number}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Disputes */}
              {activeTab === "disputes" && (
                <div className="space-y-3">
                  {!customer.disputes || customer.disputes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No disputes or chargeback claims filed by this customer.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {customer.disputes.map((disp) => (
                        <div key={disp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                {disp.reason_display || disp.reason}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  disp.status === "REFUNDED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : disp.status === "UNDER_REVIEW"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {disp.status_display || disp.status}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Filed on {formatDate(disp.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                              {formatETB(disp.disputed_amount)} ETB
                            </span>
                            {parseFloat(disp.refund_amount) > 0 && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                Refunded: {formatETB(disp.refund_amount)} ETB
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
