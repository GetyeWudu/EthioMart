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
  CheckCircle2, 
  XCircle, 
  Eye, 
  Receipt,
  PackageCheck,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

const fetcher = (url: string) => api.get(url).then(res => res.data.results || res.data);

export default function SellerDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: disputes, error, isLoading } = useSWR('/seller/disputes/', fetcher);

  const filteredDisputes = disputes?.filter((d: any) => {
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      d.id.toLowerCase().includes(searchLower) ||
      (d.order_number && String(d.order_number).toLowerCase().includes(searchLower)) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(searchLower)) ||
      (d.customer_email && d.customer_email.toLowerCase().includes(searchLower));
      
    return matchesStatus && matchesSearch;
  }) || [];

  const handleAcceptReturn = async (disputeId: string) => {
    setIsAccepting(true);
    try {
      await api.post(`/seller/disputes/${disputeId}/accept/`, {
        notes: "Merchant accepted customer return claim."
      });
      toast.success("Return claim accepted. Escrow refunded to customer.");
      setSelectedDispute(null);
      mutate('/seller/disputes/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to accept return claim.";
      toast.error(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">Under Review</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300">Refund Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">Claim Dismissed</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Dispute & Return Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review customer claims, inspect photo evidence, and manage 48-hour return requests.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending Action</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600">
              {disputes?.filter((d: any) => d.status === 'UNDER_REVIEW').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Refunded Claims</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-600">
              {disputes?.filter((d: any) => d.status === 'REFUNDED').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Resolved / Released</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600">
              {disputes?.filter((d: any) => d.status === 'REJECTED' || d.status === 'CLOSED').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Out of box Title */}
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            Customer Claims & Tickets
          </h3>
          <p className="text-xs text-slate-500">All claims submitted within the 48-hour inspection window</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Left */}
          <div className="relative w-full sm:w-96 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search claims, customers, or orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Filters Right */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-indigo-500">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="UNDER_REVIEW" className="text-xs">Under Review (Action Req.)</SelectItem>
                <SelectItem value="REFUNDED" className="text-xs">Refund Approved</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Claim Dismissed</SelectItem>
                <SelectItem value="CLOSED" className="text-xs">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center p-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading dispute ledger...</p>
            </div>
          ) : error ? (
            <div className="text-rose-500 text-center p-8 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 text-sm">
              Failed to load disputes. Please ensure you are logged into an active seller account.
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center p-16 text-slate-500">
              <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-25 text-emerald-600" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">No active dispute claims found</p>
              <p className="text-xs text-slate-500 mt-1">Your store maintains 100% dispute-free performance in this view.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Case Ref</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          className="rounded-xl text-xs font-semibold gap-1.5"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect Case
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Case Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      Case #{selectedDispute.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  Dispute on Order #{selectedDispute.order_number}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Filed by {selectedDispute.customer_name} ({selectedDispute.customer_email}) on {format(new Date(selectedDispute.created_at), 'MMMM dd, yyyy h:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                {/* Financial overview */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Disputed Escrow Amount:</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {Number(selectedDispute.disputed_amount).toLocaleString()} ETB
                    </p>
                  </div>
                  <Badge variant="outline" className="font-bold border-amber-300 text-amber-800 dark:text-amber-300">
                    Reason: {selectedDispute.reason.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Customer Explanation */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Customer Claim Statement
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                    {selectedDispute.customer_notes || "No additional explanation provided by customer."}
                  </div>
                </div>

                {/* Evidence Images */}
                {selectedDispute.evidence_images && selectedDispute.evidence_images.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Customer Photo / Video Proof
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDispute.evidence_images.map((url: string, idx: number) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="block group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 p-2"
                        >
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate flex items-center gap-1">
                            <ExternalLink className="h-3 w-3 shrink-0" /> View Evidence Attachment {idx + 1}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-order items list */}
                {selectedDispute.items && selectedDispute.items.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Included Package Items
                    </h4>
                    <div className="space-y-2">
                      {selectedDispute.items.map((it: any) => (
                        <div key={it.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{it.product_title}</p>
                            <p className="text-[11px] text-slate-400">SKU: {it.sku} &bull; Qty: {it.quantity}</p>
                          </div>
                          <span className="font-mono font-bold">{Number(it.unit_price).toLocaleString()} ETB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin notes if resolved */}
                {selectedDispute.admin_notes && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-300">Resolution Notes: </span>
                    <span className="text-blue-800 dark:text-blue-200">{selectedDispute.admin_notes}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button variant="outline" onClick={() => setSelectedDispute(null)} className="rounded-xl">
                  Close
                </Button>
                {selectedDispute.status === 'UNDER_REVIEW' && (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-1.5 shadow-sm"
                    disabled={isAccepting}
                    onClick={() => handleAcceptReturn(selectedDispute.id)}
                  >
                    {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Accept Return & Authorize Refund
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
