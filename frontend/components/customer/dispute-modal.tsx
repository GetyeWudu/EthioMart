"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { AlertCircle, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DisputeModalProps {
  subOrderId: string;
  vendorName: string;
  orderNumber?: string;
  onSuccess?: () => void;
  children?: React.ReactElement<any>;
}

export function DisputeModal({ subOrderId, vendorName, orderNumber, onSuccess, children }: DisputeModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !notes.trim()) {
      setError("Please select a valid dispute reason and provide clear details.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const payload = {
        reason,
        customer_notes: notes.trim(),
        evidence_images: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
      };

      await api.post(`/orders/${subOrderId}/dispute/`, payload);
      
      toast.success("Dispute claim submitted successfully. Escrow funds are frozen under review.");
      setOpen(false);
      setReason("");
      setNotes("");
      setEvidenceUrl("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || (typeof err.response?.data === 'object' ? Object.values(err.response?.data).flat().join(' ') : null);
      setError(serverMsg || "Failed to submit dispute claim. The 48-hour delivery inspection window may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger render={children} />
      ) : (
        <DialogTrigger>
          <Button variant="outline" size="sm" className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300">
            Open Return / Dispute Request
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">48-Hour Escrow Protection</span>
          </div>
          <DialogTitle className="text-xl font-bold">Open Return / Dispute Claim</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Package from <span className="font-semibold text-slate-900 dark:text-white">{vendorName}</span>{orderNumber ? ` (Order #${orderNumber})` : ""}.
            Submitting a claim freezes the seller&apos;s payout until mutual agreement or arbitration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Dispute Category / Reason <span className="text-rose-500">*</span>
            </Label>
            <Select value={reason} onValueChange={(val) => setReason(val || "")}>
              <SelectTrigger id="reason" className="rounded-xl">
                <SelectValue placeholder="Select specific reason..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="DEFECTIVE">Defective / Damaged Item</SelectItem>
                <SelectItem value="WRONG_ITEM">Wrong Item / Color / Size Delivered</SelectItem>
                <SelectItem value="COUNTERFEIT">Item Not as Described / Counterfeit</SelectItem>
                <SelectItem value="MISSING_PARTS">Missing Components / Accessories</SelectItem>
                <SelectItem value="DAMAGED_TRANSIT">Package Arrived Damaged in Transit</SelectItem>
                <SelectItem value="OTHER">Other Order Non-Conformity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detailed Explanation <span className="text-rose-500">*</span>
            </Label>
            <Textarea 
              id="notes" 
              placeholder="Describe what is wrong with the delivered item in detail..." 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evidence" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Photo / Video Proof Link (Optional)
            </Label>
            <div className="relative">
              <Input 
                id="evidence" 
                type="url" 
                placeholder="https://images.example.com/item-defect.jpg"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="rounded-xl text-xs pl-8"
              />
              <UploadCloud className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">Provide an image or unboxing photo showing the defect or packaging tag.</p>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Dispute Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
