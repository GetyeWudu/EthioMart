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
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Store Manager</span>;
      case "INVENTORY_CLERK":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Inventory Clerk</span>;
      case "ORDER_FULFILLMENT":
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">Order Fulfillment</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Customer Support</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Staff RBAC & Branch Delegations</h1>
          <p className="text-xs text-gray-500">
            Invite operational clerks and restrict their access to specific warehouse packing and stock queues
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Employee</span>
        </button>
      </div>

      {/* Security Architecture Info Callout */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 space-y-1">
          <strong className="block font-bold">Two-Pillar Security &amp; Fraud Isolation Active</strong>
          <p>
            Operational staff assigned to a specific branch (e.g. <em>Merkato Depot</em>) can only view and adjust inventory at their assigned facility. Sensitive store finances, Chapa bank payouts, and store-level KYC remain strictly locked to the Store Owner.
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Operational Role</th>
                <th className="px-4 py-3">Assigned Facility (Lockdown)</th>
                <th className="px-4 py-3">Access Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">Loading team members...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No delegated staff members yet. Click &quot;Invite Employee&quot; to assign a warehouse clerk or manager.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
                          {member.user_name ? member.user_name[0].toUpperCase() : member.user_email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{member.user_name || "Operational Staff"}</div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{member.user_email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {member.assigned_facility ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-max">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>{member.facility_name || "Assigned Branch"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                          <span>All Locations (Global)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active Access</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={actionLoading === member.id || (!isOwner && member.role === "OWNER")}
                        onClick={() => handleRemoveStaff(member.id)}
                        className={(!isOwner && member.role === "OWNER") ? "text-gray-300 cursor-not-allowed p-1.5 rounded-md" : "text-gray-400 hover:text-red-600 p-1.5 rounded-md transition-colors"}
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
