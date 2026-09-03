"use client";

import React, { useState } from "react";
import { StaffRole, WarehouseLocation } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { UserPlus, Shield, Check, X, AlertCircle, Lock } from "lucide-react";

interface StaffInvitationModalProps {
  warehouses: WarehouseLocation[];
  onSuccess: () => void;
  onClose: () => void;
  isOwner?: boolean;
}

interface RoleCapability {
  title: string;
  allowed: boolean;
}

const ROLE_PERMISSIONS: Record<StaffRole, { description: string; capabilities: RoleCapability[] }> = {
  OWNER: {
    description: "Store Owner with full administrative and financial access.",
    capabilities: [
      { title: "Full access to all operations", allowed: true },
      { title: "Manage store finances and KYC", allowed: true },
    ],
  },
  MANAGER: {
    description: "Full operational manager with broad access across catalog, inventory, and staff.",
    capabilities: [
      { title: "Manage product catalog & listings", allowed: true },
      { title: "Adjust inventory across all facilities", allowed: true },
      { title: "Invite and assign operational staff", allowed: true },
      { title: "View financial balance & payouts", allowed: false },
      { title: "Edit bank details & store KYC", allowed: false },
    ],
  },
  INVENTORY_CLERK: {
    description: "Scoped solely to recording physical receipts and counting at their assigned branch.",
    capabilities: [
      { title: "Record receipts & adjustments (Assigned Hub)", allowed: true },
      { title: "View stock levels at assigned branch", allowed: true },
      { title: "View orders or customer personal info", allowed: false },
      { title: "Access financial earnings & wallets", allowed: false },
      { title: "View other warehouse facilities", allowed: false },
    ],
  },
  ORDER_FULFILLMENT: {
    description: "Scoped to packing and dispatching sub-orders originating from their facility.",
    capabilities: [
      { title: "View dispatch queue for assigned facility", allowed: true },
      { title: "Mark sub-orders as packed / ready for pickup", allowed: true },
      { title: "Adjust catalog pricing or listings", allowed: false },
      { title: "Access financial earnings & payouts", allowed: false },
    ],
  },
  CUSTOMER_SUPPORT: {
    description: "Read-only access to customer queries, tracking, and product specifications.",
    capabilities: [
      { title: "Look up order statuses for customers", allowed: true },
      { title: "View product specifications & catalog", allowed: true },
      { title: "Modify stock or record ledger movements", allowed: false },
      { title: "Access financial wallets or payouts", allowed: false },
    ],
  },
};

export function StaffInvitationModal({ warehouses, onSuccess, onClose, isOwner = false }: StaffInvitationModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("INVENTORY_CLERK");
  const [assignedWarehouseId, setAssignedWarehouseId] = useState<string>(warehouses[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentRoleConfig = ROLE_PERMISSIONS[role];
  const requiresWarehouse = role === "INVENTORY_CLERK" || role === "ORDER_FULFILLMENT";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid employee work email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await inventoryService.inviteStaffMember({
        email: email.trim().toLowerCase(),
        role,
        assigned_warehouse_id: requiresWarehouse ? assignedWarehouseId : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to invite staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delegate Operational Staff</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Invite employees with scoped branch permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Email Address*</label>
            <input
              type="email"
              required
              placeholder="e.g. clerk.merkato@yourstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Operational Role*</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="INVENTORY_CLERK">Inventory Clerk</option>
                <option value="ORDER_FULFILLMENT">Order Fulfillment / Packing</option>
                <option value="CUSTOMER_SUPPORT">Customer Support Agent</option>
                {isOwner && <option value="MANAGER">Store Operations Manager</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Branch {requiresWarehouse && <span className="text-rose-500">*</span>}
              </label>
              <select
                value={assignedWarehouseId}
                disabled={!requiresWarehouse}
                onChange={(e) => setAssignedWarehouseId(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 ${
                  !requiresWarehouse ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700" : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} [{w.code}] ({w.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Permission Matrix Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Capability Matrix for {role.replace("_", " ")}</span>
              </span>
              {requiresWarehouse && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked to Branch</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">{currentRoleConfig.description}</p>

            <ul className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700">
              {currentRoleConfig.capabilities.map((cap, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className={cap.allowed ? "text-slate-900 dark:text-white" : "text-slate-400 line-through"}>{cap.title}</span>
                  {cap.allowed ? (
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Allowed
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-medium text-[10px] flex items-center gap-1">
                      <X className="w-3 h-3" /> Restricted
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? "Sending Invitation..." : "Send Staff Invitation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
