"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  ExclamationTriangleIcon, 
  EnterIcon, 
  LockClosedIcon, 
  GearIcon, 
  MagnifyingGlassIcon, 
  UpdateIcon, 
  EyeOpenIcon, 
  CheckCircledIcon,
  Cross2Icon
} from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

interface AuditLogTableProps {
  limit?: number;
}

export function AuditLogTable({ limit }: AuditLogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const endpoint = limit ? `/audit-logs/?limit=${limit}` : `/audit-logs/`;
  const { data: response, isLoading } = useSWR(endpoint, fetcher);

  const logs: any[] = Array.isArray(response) ? response : response?.results || [];

  const getActionBadge = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("suspend") || act.includes("reject") || act.includes("delete")) {
      return {
        icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" />,
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
      };
    }
    if (act.includes("approve") || act.includes("reactivate") || act.includes("verify")) {
      return {
        icon: <CheckCircledIcon className="h-3.5 w-3.5" />,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
      };
    }
    if (act.includes("login") || act.includes("auth")) {
      return {
        icon: <EnterIcon className="h-3.5 w-3.5" />,
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
      };
    }
    return {
      icon: <GearIcon className="h-3.5 w-3.5" />,
      color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    };
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const act = (log.action || "").toLowerCase();
    const actor = (log.actor_email || log.actor || "").toLowerCase();
    const target = (log.target_repr || log.target_type || "").toLowerCase();
    const ip = (log.ip_address || "").toLowerCase();

    return act.includes(q) || actor.includes(q) || target.includes(q) || ip.includes(q);
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
      {!limit && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, actor email, IP..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Cross2Icon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:block">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm text-right">System Audit Trail &amp; Security Logs</h2>
          </div>
        </div>
      )}

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold text-[11px] whitespace-nowrap">
            <tr>
              <th className="px-4 py-3.5">Action Executed</th>
              <th className="px-4 py-3.5">Target Entity</th>
              <th className="px-4 py-3.5 hidden sm:table-cell">Actor &amp; Role</th>
              <th className="px-4 py-3.5 hidden md:table-cell">IP Address</th>
              <th className="px-4 py-3.5 hidden lg:table-cell">Timestamp</th>
              <th className="px-4 py-3.5 text-right">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                  <UpdateIcon className="w-5 h-5 animate-spin mx-auto text-[#1261C9] mb-2" />
                  Loading security audit trail...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No audit logs recorded for this criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const formattedDate = new Date(log.created_at).toLocaleString('en-ET', { 
                  day: '2-digit', 
                  month: 'short', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    {/* Action Executed */}
                    <td className="px-4 py-3.5 min-w-[140px] sm:min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${badge.color}`}>
                          {badge.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate block" title={log.action || "System Event"}>
                            {log.action || "System Event"}
                          </span>
                          {/* Mobile supplementary details */}
                          <div className="sm:hidden text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                            <span className="block truncate">{log.actor_email || "System"}</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Entity */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 truncate">
                      <span className="font-semibold block truncate" title={log.target_repr || log.target_type || "Global"}>{log.target_repr || log.target_type || "Global"}</span>
                      {log.target_id && <span className="font-mono text-[10px] text-slate-400 block truncate">ID: {String(log.target_id).slice(0, 8)}</span>}
                    </td>

                    {/* Actor & Role (Desktop) */}
                    <td className="px-4 py-3.5 truncate hidden sm:table-cell whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white block truncate" title={log.actor_email || "System"}>{log.actor_email || "System"}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{log.actor_role || "ADMIN"}</span>
                    </td>

                    {/* IP Address (Desktop) */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 truncate hidden md:table-cell whitespace-nowrap" title={log.ip_address || "127.0.0.1"}>
                      {log.ip_address || "127.0.0.1"}
                    </td>

                    {/* Timestamp (Desktop) */}
                    <td className="px-4 py-3.5 text-slate-400 text-[11px] truncate hidden lg:table-cell whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Payload */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-[11px] font-bold text-[#1261C9] hover:text-[#0D4FA8] gap-1"
                      >
                        <EyeOpenIcon className="w-3.5 h-3.5" /> Diff
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Diff Viewer Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto text-xs">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#1261C9]">
              <LockClosedIcon className="w-5 h-5" />
              <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
                Audit Event: {selectedLog?.action}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Detailed payload diff, actor identity, request path, and client metadata.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actor Email</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.actor_email || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedLog.actor_role || 'ADMIN'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Request Path</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.http_method || 'POST'} {selectedLog.request_path || '/api/v1/'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">IP Address</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Change Payload & Parameters:
                </span>
                <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.payload || { message: "No custom payload parameters logged." }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
