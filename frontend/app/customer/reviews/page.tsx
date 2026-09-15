"use client";

import React from "react";
import useSWR from "swr";
import { Star, ThumbsUp, MessageSquare, ShoppingBag, Loader2, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { OrderItemReviewModal } from "@/components/reviews/order-item-review-modal";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ReviewsPage() {
  const { data: reviewsData, isLoading, mutate } = useSWR("/customer/reviews/", fetcher);

  const reviews: any[] = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.results || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">My Reviews & Ratings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {reviews.length} verified product review{reviews.length === 1 ? "" : "s"} submitted
          </p>
        </div>

        <Link href="/customer/orders">
          <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            Review From Delivered Orders
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
          Loading your reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No reviews submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once your orders are delivered, you can rate and review your purchased items directly from your order details page.
            </p>
          </div>
          <Link href="/customer/orders" className="inline-block pt-2">
            <Button size="sm" className="bg-[#1261C9] hover:bg-[#0D4FA8] text-white text-xs font-bold gap-1.5 shadow-sm rounded-xl">
              <ShoppingBag className="w-3.5 h-3.5" /> View Past Orders
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const product = review.product_details || (typeof review.product === 'object' ? review.product : {}) || {};
            const imageUrl = product.image_url || product.primary_image || product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200";

            return (
              <div 
                key={review.id} 
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Product Info */}
                  <div className="flex sm:flex-col gap-3 sm:w-44 shrink-0">
                    <Link 
                      href={product.slug ? `/products/${product.slug}` : "#"} 
                      className="relative h-20 w-20 sm:h-28 sm:w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 block shrink-0 border border-slate-100 dark:border-slate-800 group"
                    >
                      <Image 
                        src={imageUrl} 
                        alt={product.title || product.name || "Product"} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 640px) 5rem, 7rem"
                      />
                    </Link>
                    <div>
                      <Link 
                        href={product.slug ? `/products/${product.slug}` : "#"} 
                        className="hover:underline font-bold text-xs text-slate-900 dark:text-white line-clamp-2"
                      >
                        {product.title || product.name || "Product Item"}
                      </Link>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700"}`} 
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5 font-mono">
                            {review.rating}.0
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{review.title || "Product Review"}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold shrink-0">
                          {review.is_approved ? "Verified & Published" : "Published"}
                        </Badge>

                        <OrderItemReviewModal
                          product={{
                            id: product.id || review.product,
                            title: product.title || "Product Item",
                            slug: product.slug,
                            imageUrl: imageUrl,
                          }}
                          existingReview={{
                            id: review.id,
                            rating: review.rating,
                            title: review.title,
                            body: review.body || review.content || review.comment || "",
                          }}
                          onSuccess={() => mutate()}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg gap-1">
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {review.body || review.content || review.comment}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Reviewed on {new Date(review.created_at || Date.now()).toLocaleDateString("en-ET", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                        <ThumbsUp className="h-3 w-3 text-indigo-500" />
                        {review.helpful_count || 0} helpful votes
                      </span>
                    </div>

                    {/* Merchant Reply if exists */}
                    {review.seller_reply && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-xs space-y-1">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-[11px]">
                          Store Response from {review.seller_reply.seller_name || "Merchant"}:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 text-xs whitespace-pre-line">
                          {review.seller_reply.body}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
