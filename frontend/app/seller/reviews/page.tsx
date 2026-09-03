"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { Star, MessageSquare, Reply, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function SellerReviewsPage() {
  const { data, mutate, isValidating } = useSWR('/seller/reviews/', fetcher);
  const reviews = data?.results || data || [];

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREPLIED" | "REPLIED">("ALL");

  const filteredReviews = reviews.filter((review: any) => {
    if (filter === "UNREPLIED") return !review.seller_reply;
    if (filter === "REPLIED") return !!review.seller_reply;
    return true;
  });

  const handleReply = async (reviewId: string) => {
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/seller/reviews/${reviewId}/reply/`, { body: replyBody });
      toast.success("Reply posted successfully!");
      setReplyingTo(null);
      setReplyBody("");
      mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Product Reviews</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Read and respond to customer reviews for your products.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: "ALL", label: "All Reviews" },
          { key: "UNREPLIED", label: "Awaiting Reply" },
          { key: "REPLIED", label: "Replied" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition-colors border-b-2",
              filter === tab.key 
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 dark:hover:border-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">No reviews found</p>
            <p className="text-slate-500 mt-1 text-sm">When customers review your products, they will appear here.</p>
          </div>
        ) : (
          filteredReviews.map((review: any) => (
            <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col gap-6">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-lg">
                     {review.customer_name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{review.customer_name}</span>
                        {review.is_verified_purchase && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex">
                           {[1,2,3,4,5].map(s => (
                             <Star key={s} className={cn("w-3.5 h-3.5", review.rating >= s ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700")} />
                           ))}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">on {new Date(review.created_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                </div>

                <div className="text-right">
                   <span className={cn(
                     "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                     review.seller_reply ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                   )}>
                     {review.seller_reply ? <><CheckCircle2 className="w-3.5 h-3.5"/> Replied</> : <><AlertCircle className="w-3.5 h-3.5"/> Needs Reply</>}
                   </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{review.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{review.body}</p>
              </div>

              {/* Seller Reply Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 -mx-6 -mb-6 p-6 border-t border-slate-100 dark:border-slate-800">
                {review.seller_reply ? (
                   <div>
                     <div className="flex items-center gap-2 mb-2">
                        <Reply className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Your Response</span>
                        <span className="text-xs text-slate-500 ml-auto">{new Date(review.seller_reply.created_at).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line ml-6">{review.seller_reply.body}</p>
                   </div>
                ) : replyingTo === review.id ? (
                   <div className="space-y-4">
                     <label className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Reply className="w-4 h-4 text-indigo-600" /> Draft Response
                     </label>
                     <textarea 
                        rows={3}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Thank the customer for their feedback..."
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                     />
                     <div className="flex gap-3 justify-end">
                       <Button variant="outline" onClick={() => { setReplyingTo(null); setReplyBody(""); }}>Cancel</Button>
                       <Button onClick={() => handleReply(review.id)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                         {isSubmitting ? "Posting..." : "Post Reply"}
                       </Button>
                     </div>
                   </div>
                ) : (
                   <Button onClick={() => setReplyingTo(review.id)} variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-900/50">
                     <Reply className="w-4 h-4 mr-2" /> Write a Reply
                   </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
