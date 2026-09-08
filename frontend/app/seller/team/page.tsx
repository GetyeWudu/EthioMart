"use client";

import React, { useState, useEffect } from "react";
import { VendorStaffMember, WarehouseLocation } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { StaffInvitationModal } from "@/components/inventory/staff-invitation-modal";
import { useAuthStore } from "@/stores/auth-store";
import {
  Users,
  UserPlus,
  Shield,
  Lock,
  Warehouse,
  Mail,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Info,
} from "lucide-react";

export default function SellerTeamPage() {
  const [staff, setStaff] = useState<VendorStaffMember[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { user } = useAuthStore();
  const isOwner = user?.vendor_staff_role === "OWNER" || !user?.vendor_staff_role;

  const loadData = () => {
    setLoading(true);
    Promise.all([inventoryService.getStaffMembers(), inventoryService.getWarehouses()])
      .then(([staffData, whData]) => {
        setStaff(staffData);
        setWarehouses(whData);
      })
      .catch((err) => console.error("Failed to load staff data", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveStaff = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this staff member's store access?")) return;
    setActionLoading(id);
    try {
      await inventoryService.removeStaffMember(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to remove staff member.");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MANAGER":
        return (
          <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center">
            Store Manager
          </span>
        );
      case "INVENTORY_CLERK":
        return (
          <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center">
            Inventory Clerk
          </span>
        );
      case "ORDER_FULFILLMENT":
        return (
          <span className="bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center">
            Order Fulfillment
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center">
            Customer Support
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff RBAC &amp; Branch Delegations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Invite operational clerks and restrict their access to specific warehouse packing and stock queues
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Employee</span>
        </button>
      </div>

      {/* Security Architecture Info Callout */}
      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <strong className="block font-bold">Two-Pillar Security &amp; Fraud Isolation Active</strong>
          <p className="text-emerald-800 dark:text-emerald-300">
            Operational staff assigned to a specific branch (e.g. <em>Merkato Depot</em>) can only view and adjust inventory at their assigned facility. Sensitive store finances, Chapa bank payouts, and store-level KYC remain strictly locked to the Store Owner.
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Operational Role</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Assigned Facility</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Access Status</th>
                <th className="px-4 py-3.5 text-right sm:text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">Loading team members...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    No delegated staff members yet. Click &quot;Invite Employee&quot; to assign a warehouse clerk or manager.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-bold text-xs border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
                          {member.user_name ? member.user_name[0].toUpperCase() : member.user_email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">{member.user_name || "Operational Staff"}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{member.user_email}</span>
                          </div>
                          {/* Mobile inline facility */}
                          <div className="sm:hidden mt-1 flex items-center gap-1.5 text-[10px]">
                            {member.assigned_facility ? (
                              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium">
                                <Lock className="w-2.5 h-2.5" /> {member.facility_name || "Assigned Branch"}
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Warehouse className="w-2.5 h-2.5" /> All Locations
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getRoleBadge(member.role)}</td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 hidden sm:table-cell whitespace-nowrap">
                      {member.assigned_facility ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50 w-max">
                          <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                          <span>{member.facility_name || "Assigned Branch"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>All Locations (Global)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell whitespace-nowrap">
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Active Access</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={actionLoading === member.id || (!isOwner && member.role === "OWNER")}
                        onClick={() => handleRemoveStaff(member.id)}
                        className={(!isOwner && member.role === "OWNER") ? "text-slate-300 dark:text-slate-700 cursor-not-allowed p-1.5 rounded-md" : "text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-md transition-colors cursor-pointer"}
                        title={(!isOwner && member.role === "OWNER") ? "Only Store Owners can revoke Owner access" : "Revoke access"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Invitation Modal */}
      {inviteModalOpen && (
        <StaffInvitationModal
          warehouses={warehouses}
          onSuccess={loadData}
          onClose={() => setInviteModalOpen(false)}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
