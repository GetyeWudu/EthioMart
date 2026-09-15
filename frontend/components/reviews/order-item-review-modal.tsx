"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export interface ReviewItemProduct {
  id: string;
  title: string;
  slug?: string;
  images?: Array<{ image_url: string }> | any[];
  imageUrl?: string;
}

export interface ExistingReview {
  id: string;
  rating: number;
  title: string;
  body: string;
}

interface OrderItemReviewModalProps {
  product: ReviewItemProduct;
  existingReview?: ExistingReview | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; text: string; color: string }> = {
  1: { label: "Poor", text: "Disappointed with this product", color: "text-rose-600 dark:text-rose-400" },
  2: { label: "Fair", text: "Could be better, had several issues", color: "text-orange-600 dark:text-orange-400" },
  3: { label: "Average", text: "Acceptable, met standard expectations", color: "text-amber-600 dark:text-amber-400" },
  4: { label: "Good", text: "Satisfied, worked well as expected", color: "text-emerald-600 dark:text-emerald-400" },
  5: { label: "Excellent!", text: "Outstanding quality, highly recommended!", color: "text-emerald-600 dark:text-emerald-400" },
};

export function OrderItemReviewModal({
  product,
  existingReview,
  onSuccess,
  trigger,
}: OrderItemReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(existingReview?.id || null);
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>(existingReview?.title || "");
  const [body, setBody] = useState<string>(existingReview?.body || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state when modal opens or existingReview changes
  useEffect(() => {
    if (open) {
      setErrorMessage("");
      if (existingReview) {
        setReviewId(existingReview.id);
        setRating(existingReview.rating || 5);
        setTitle(existingReview.title || "");
        setBody(existingReview.body || "");
      } else if (product.id) {
        // Query eligibility check directly from server to verify if already reviewed
        api.get(`/reviews/eligibility/?product_id=${product.id}`)
          .then((res) => {
            const data = res.data;
            if (data?.has_reviewed && data?.existing_review_id) {
              setReviewId(data.existing_review_id);
              if (data.rating) setRating(data.rating);
              if (data.title) setTitle(data.title);
              if (data.body) setBody(data.body);
            }
          })
          .catch(() => {
            // Ignore eligibility check errors
          });
      }
    }
  }, [open, existingReview, product.id]);

  const activeRating = hoverRating || rating;
  const ratingInfo = RATING_DESCRIPTIONS[activeRating] || RATING_DESCRIPTIONS[5];
  const isEditMode = Boolean(reviewId || existingReview?.id);

  const productImage = 
    product.imageUrl || 
    product.images?.[0]?.image_url || 
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage("Please select a star rating between 1 and 5.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Please enter a short headline for your review.");
      return;
    }
    if (!body.trim() || body.trim().length < 5) {
      setErrorMessage("Please share at least a short sentence explaining your experience (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const targetReviewId = reviewId || existingReview?.id;
      if (targetReviewId) {
        // Update existing review
        await api.patch(`/reviews/${targetReviewId}/`, {
          rating,
          title: title.trim(),
          body: body.trim(),
        });
        toast.success("Your review has been updated successfully!");
      } else {
        // Create brand new review
        await api.post("/reviews/", {
          product: product.id,
          rating,
          title: title.trim(),
          body: body.trim(),
        });
        toast.success("Thank you! Your verified purchase review has been submitted.");
      }

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const resp = err.data || err.response?.data;
      const errorText =
        err.message ||
        resp?.non_field_errors?.[0] ||
        resp?.detail ||
        resp?.message ||
        (typeof resp === "object" ? Object.values(resp).flat().join(" ") : null) ||
        "Failed to submit your review. Please verify your connection.";
      setErrorMessage(errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const targetReviewId = reviewId || existingReview?.id;
    if (!targetReviewId) return;
    if (!confirm("Are you sure you want to delete this review?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/reviews/${targetReviewId}/`);
      toast.success("Your review was deleted.");
      setReviewId(null);
      setRating(5);
      setTitle("");
      setBody("");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button
              size="sm"
              className={cn(
                "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all shadow-xs",
                existingReview
                  ? "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", existingReview ? "fill-amber-400 text-amber-400" : "fill-white text-white")} />
              {existingReview ? `Reviewed (${existingReview.rating}★)` : "Write Review"}
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[540px] rounded-3xl p-6 md:p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isEditMode ? "Edit Your Review" : "Rate & Review Product"}
            </span>
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
            {isEditMode ? "Update Your Feedback" : "How was your purchase?"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Your authentic review helps fellow Ethiopian buyers make informed shopping choices.
          </DialogDescription>
        </DialogHeader>

        {/* Product preview mini-card */}
        <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 relative">
            <Image
              src={productImage}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
              {product.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Verified Delivered Purchase</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Star Rating Selector */}
          <div className="space-y-2 text-center py-2 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Overall Rating
            </Label>
            <div className="flex items-center justify-center gap-2 pt-1 pb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-115 active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 transition-colors duration-150",
                      activeRating >= star
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-slate-200 dark:text-slate-700 hover:text-amber-200"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn("text-xs font-bold transition-all", ratingInfo.color)}>
              {ratingInfo.label} — <span className="font-medium opacity-90">{ratingInfo.text}</span>
            </p>
          </div>

          {/* Review Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="review-title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Headline / Summary <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Outstanding quality, fits perfectly!"
              className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              maxLength={120}
              required
            />
          </div>

          {/* Review Body Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="review-body" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Review <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[11px] text-slate-400">
                {body.length} characters
              </span>
            </div>
            <Textarea
              id="review-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you like or dislike? How was the material, packaging, delivery speed, or condition upon arrival?"
              className="text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isEditMode ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Review
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-bold bg-[#1261C9] hover:bg-[#0D4FA8] text-white rounded-xl px-5 h-9 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : isEditMode ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
