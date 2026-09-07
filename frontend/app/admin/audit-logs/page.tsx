"use client";

import useSWR from "swr";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  AlertTriangle 
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminAuditLogsPage() {
  const { data: response } = useSWR("/audit-logs/", fetcher);
  const logs: any[] = Array.isArray(response) ? response : response?.results || [];

  const totalLogs = logs.length;
  const criticalActions = logs.filter(l => {
    const act = (l.action || "").toLowerCase();
    return act.includes("suspend") || act.includes("reject") || act.includes("delete") || act.includes("freeze");
  }).length;

  const verifiedActions = logs.filter(l => {
    const act = (l.action || "").toLowerCase();
    return act.includes("approve") || act.includes("reactivate") || act.includes("verify") || act.includes("release");
  }).length;

  const uniqueActors = new Set(logs.map(l => l.actor_username || l.actor || l.user || "system")).size;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-slate-900 dark:text-white">
              System Audit Trail & Security Ledger
            </h1>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-mono text-[10px]">
              Immutable Audit
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete cryptographic activity ledger across staff moderation, dispute rulings, system events, and IP addresses.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Audit Events</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalLogs.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Append-only security log</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Critical Interventions</span>
            <div className="p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {criticalActions}
            </span>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Suspensions & rejections</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Approvals</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {verifiedActions}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Staff verifications</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Operators</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {uniqueActors}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Unique staff actors</p>
          </div>
        </div>
      </div>

      <AuditLogTable />
    </div>
  );
}
