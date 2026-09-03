"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { format } from "date-fns";
import { 
  Loader2, 
  Filter, 
  AlertCircle, 
  ShieldAlert, 
  Gavel, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Store,
  User,
  Package,
  DollarSign,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data.results || res.data);

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("UNDER_REVIEW");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolvingAction, setResolvingAction] = useState<string | null>(null);

  const { data: disputes, error, isLoading } = useSWR('/admin/disputes/', fetcher);

  const filteredDisputes = disputes?.filter((d: any) => 
    statusFilter === "ALL" ? true : d.status === statusFilter
  ) || [];

  const handleResolve = async (action: "REFUND_BUYER" | "REJECT_CLAIM") => {
    if (!selectedDispute) return;
    setResolvingAction(action);
    try {
      await api.post(`/admin/disputes/${selectedDispute.id}/resolve/`, {
        action,
        admin_notes: adminNotes.trim() || `Admin issued resolution: ${action}`
      });
      
      const successText = action === 'REFUND_BUYER' 
        ? "Refund approved! Escrow reversed and Chapa refund initiated."
        : "Dispute dismissed! Escrow funds released to merchant wallet.";

      toast.success(successText);
      setSelectedDispute(null);
      setAdminNotes("");
      mutate('/admin/disputes/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to resolve dispute.";
      toast.error(msg);
    } finally {
      setResolvingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">Under Review</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300">Refunded</Badge>;
      case 'REJECTED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">Claim Dismissed</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Gavel className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            Dispute & Arbitration Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Platform governance & binding escrow arbitration under Ethiopian Proclamation No. 813/2013.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Arbitration</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {disputes?.filter((d: any) => d.status === 'UNDER_REVIEW').length || 0}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Refunds Authorized</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {disputes?.filter((d: any) => d.status === 'REFUNDED').length || 0}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Escrows Released</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {disputes?.filter((d: any) => d.status === 'REJECTED' || d.status === 'CLOSED').length || 0}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Platform Dispute Queue</CardTitle>
              <CardDescription>Review claims, customer evidence, and issue final binding verdicts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                <SelectTrigger className="w-[190px] rounded-xl">
                  <Filter className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review (Action Req.)</SelectItem>
                  <SelectItem value="REFUNDED">Refund Approved</SelectItem>
                  <SelectItem value="REJECTED">Claim Dismissed</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center p-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading platform dispute cases...</p>
            </div>
          ) : error ? (
            <div className="text-rose-500 text-center p-8 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 text-sm">
              Failed to load dispute arbitration list. Please ensure you are logged in as an administrator.
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center p-16 text-slate-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-25 text-emerald-600" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">No disputes pending in this view</p>
              <p className="text-xs text-slate-500 mt-1">All orders and returns are currently reconciled.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Case Ref</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Disputed Amt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Arbitration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute: any) => (
                    <TableRow key={dispute.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        #{dispute.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        #{dispute.order_number || String(dispute.sub_order).slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-900 dark:text-white">{dispute.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{dispute.customer_email}</div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {dispute.vendor_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {dispute.reason.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {Number(dispute.disputed_amount).toLocaleString()} ETB
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl text-xs font-semibold gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setAdminNotes(dispute.admin_notes || "");
                          }}
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          Arbitrate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arbitration Console Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-[680px] rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-amber-600" />
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      Arbitration Case #{selectedDispute.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  Order #{selectedDispute.order_number} Dispute Review
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Filed on {format(new Date(selectedDispute.created_at), 'MMMM dd, yyyy h:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                {/* Party summary grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <User className="h-3 w-3" /> Buyer Details
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">{selectedDispute.customer_name}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedDispute.customer_email}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Store className="h-3 w-3" /> Merchant Details
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">{selectedDispute.vendor_name}</p>
                    <p className="text-xs text-slate-400">Escrow Frozen in Pending Balance</p>
                  </div>
                </div>

                {/* Financial overview */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-amber-900 dark:text-amber-300">Frozen Escrow Amount:</span>
                    <p className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono">
                      {Number(selectedDispute.disputed_amount).toLocaleString()} ETB
                    </p>
                  </div>
                  <Badge className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-bold">
                    {selectedDispute.reason.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Buyer claim statement */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Customer Issue Description
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                    {selectedDispute.customer_notes || "No additional explanation provided."}
                  </div>
                </div>

                {/* Evidence Links */}
                {selectedDispute.evidence_images && selectedDispute.evidence_images.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Uploaded Photo / Video Attachments
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDispute.evidence_images.map((url: string, idx: number) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium truncate flex items-center gap-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Attachment Proof #{idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin notes input */}
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="adminNotes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Arbitration Reasoning / Settlement Notes
                  </Label>
                  <Textarea 
                    id="adminNotes" 
                    placeholder="Enter final arbitration verdict rationale (sent to both parties)..." 
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="rounded-xl text-xs resize-none"
                    disabled={selectedDispute.status !== 'UNDER_REVIEW'}
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button variant="outline" onClick={() => setSelectedDispute(null)} className="rounded-xl">
                  Close
                </Button>
                {selectedDispute.status === 'UNDER_REVIEW' && (
                  <div className="flex items-center gap-2">
                    <Button 
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold gap-1.5 text-xs shadow-sm"
                      disabled={resolvingAction !== null}
                      onClick={() => handleResolve('REFUND_BUYER')}
                    >
                      {resolvingAction === 'REFUND_BUYER' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" />}
                      Approve Refund (Reverse Escrow)
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-1.5 text-xs shadow-sm"
                      disabled={resolvingAction !== null}
                      onClick={() => handleResolve('REJECT_CLAIM')}
                    >
                      {resolvingAction === 'REJECT_CLAIM' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Reject Claim (Release to Seller)
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
