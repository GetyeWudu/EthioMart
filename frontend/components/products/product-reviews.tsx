"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Star, MessageSquare, ThumbsUp, X, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function ProductReviews({ productId, productSlug, avgRating, reviewCount }: { productId: string, productSlug: string, avgRating: number, reviewCount: number }) {
  const { data: reviewsData, mutate } = useSWR(`/products/${productSlug}/reviews/`, fetcher);
  const { data: eligibilityData } = useSWR(`/reviews/eligibility/?product_slug=${productSlug}`, fetcher);
  
  const reviews = reviewsData?.results || reviewsData || [];
  const distribution = reviewsData?.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  const totalReviews = reviewCount;
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a rating.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/reviews/', {
        product: productId,
        rating,
        title,
        body
      });
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      mutate();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.non_field_errors?.[0] || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-5xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {avgRating} <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Based on {totalReviews} reviews</p>
        </div>

        <div className="md:col-span-2 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-12 text-right">{stars} Star</div>
                  <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="w-8 text-right text-slate-400">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review CTA */}
      <div className="flex items-center justify-between py-6 border-y border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share your thoughts</h3>
          <p className="text-slate-500 text-sm mt-1">If you've bought this item, we'd love to hear about your experience.</p>
        </div>
        {eligibilityData?.eligible && !eligibilityData?.has_reviewed ? (
          <Button onClick={() => setShowReviewForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Write a Review
          </Button>
        ) : eligibilityData?.has_reviewed ? (
          <span className="text-emerald-600 font-medium text-sm flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full"><CheckCircle2 className="w-4 h-4"/> You've reviewed this</span>
        ) : (
           <span className="text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">Purchase required to review</span>
        )}
      </div>

      {showReviewForm && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Write your Review</h3>
            <button onClick={() => setShowReviewForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold">Overall Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button type="button" key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none">
                      <Star className={cn("w-8 h-8 transition-colors", (hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700")} />
                    </button>
                  ))}
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold">Review Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarize your experience" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold">Review Body</label>
                <textarea required rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="What did you like or dislike? What should other shoppers know?" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
             </div>
             <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold">
               {isSubmitting ? "Submitting..." : "Submit Review"}
             </Button>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-8">
        {reviews.length === 0 ? (
           <div className="text-center py-12 text-slate-500">
             <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
             <p className="text-lg font-medium text-slate-900 dark:text-white">No reviews yet</p>
             <p>Be the first to share your thoughts!</p>
           </div>
        ) : (
          reviews.map((review: any) => (
            <div key={review.id} className="pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
               <div className="flex items-start justify-between">
                 <div className="flex gap-4">
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
                        <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="mt-4">
                 <h4 className="font-bold text-slate-900 dark:text-white mb-2">{review.title}</h4>
                 <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{review.body}</p>
               </div>

               {review.seller_reply && (
                 <div className="mt-6 ml-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                    <div className="absolute -left-3 top-6 w-3 h-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="absolute -left-3 top-2 w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2 mb-2">
                       <Store className="w-4 h-4 text-indigo-600" />
                       <span className="font-bold text-sm text-slate-900 dark:text-white">Response from {review.seller_reply.seller_name}</span>
                       <span className="text-xs text-slate-500 ml-auto">{new Date(review.seller_reply.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{review.seller_reply.body}</p>
                 </div>
               )}

               <div className="mt-4 flex items-center gap-4 ml-12">
                 <button onClick={() => {
                   api.post(`/reviews/${review.id}/helpful/`).then(() => mutate());
                 }} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                   <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpful_count})
                 </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
