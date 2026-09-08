"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, CheckCircle2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { CheckoutForm } from "@/components/customer/checkout-form";
import { useCartStore } from "@/stores/cart-store";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { items, getTotalPrice, cartId, serverSubtotal, serverAutomaticDiscount } = useCartStore();
  
  // Use the server subtotal if available (it has accurate sync), fallback to client calculation
  const baseSubtotal = serverSubtotal || getTotalPrice();
  // Display subtotal is the gross subtotal (without automatic discount applied)
  const displaySubtotal = baseSubtotal;
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingPackagesCount, setShippingPackagesCount] = useState(0);
  const [shippingBreakdown, setShippingBreakdown] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const calculateShipping = async (zoneId: string) => {
    try {
      const res = await api.post('/shipping/calculate-fee/', {
        zone_id: zoneId,
        cart_items: items
      });
      setShippingFee(Number(res.data.total_shipping_fee || 0));
      setShippingPackagesCount(Number(res.data.n_packages || res.data.sub_orders?.length || 0));
      setShippingBreakdown(res.data.sub_orders || []);
      setSelectedZoneId(zoneId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponError("");
    try {
      const res = await api.post('/promotions/validate-coupon/', {
        coupon_code: couponInput.trim(),
        cart_id: cartId
      });
      if (res.data.valid) {
        setAppliedCoupon(couponInput.trim());
        setDiscountAmount(res.data.discount_amount);
      } else {
        setCouponError(res.data.detail || "Invalid coupon.");
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.detail || "Failed to validate coupon.");
    } finally {
      setIsApplying(false);
    }
  };
  
  useEffect(() => {
    setMounted(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!isAuthenticated && !token) {
      router.replace("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  if (!mounted) return null;

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!isAuthenticated && !token) {
    return (
      <div className="container mx-auto px-4 pt-36 pb-20 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-36 pb-20 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1261C9]/10 dark:bg-[#1261C9]/20 mb-6 text-[#1261C9] shadow-inner">
          <ShoppingCart className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/products">
          <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white font-bold shadow-md shadow-[#1261C9]/25">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-28 pb-16 sm:pt-32 max-w-[1200px]">
      <div className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1">EthioMart National Escrow & Multi-Vendor Fulfillment</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1261C9]/10 text-[#1261C9] text-xs font-bold border border-[#1261C9]/20">
          <span>Safe & Secure Escrow</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Checkout Form */}
        <div className="flex-1">
          <CheckoutForm 
            appliedCoupon={appliedCoupon} 
            selectedZoneId={selectedZoneId}
            onZoneSelect={calculateShipping}
          />
        </div>

        {/* Order Summary Sidebar */}
        <aside className="w-full lg:w-[400px] shrink-0">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Summary</h2>
            
            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
                    <Image 
                      src={item.variant_details?.product?.images?.[0]?.image_url || "/placeholder.svg"} 
                      fill 
                      className="object-cover" 
                      alt={item.variant_details?.product?.title || "Product"} 
                    />
                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#FF7900] text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="text-sm font-semibold line-clamp-2">{item.variant_details?.product?.title}</span>
                    {item.variant_details?.attribute_values && item.variant_details.attribute_values.length > 0 && (
                      <span className="text-xs text-slate-500 mt-0.5">
                        {item.variant_details.attribute_values.map(av => `${av.attribute_name || 'Option'}: ${av.value}`).join(' | ')}
                      </span>
                    )}
                    <span className="text-sm font-bold text-[#1261C9] dark:text-blue-400 mt-1">{parseFloat(item.variant_details?.price || '0').toFixed(2)} ETB</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4 dark:bg-slate-800" />
            
            <div className="space-y-4">
              <Label htmlFor="coupon" className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Code</Label>
              <div className="flex gap-2">
                <Input 
                  id="coupon" 
                  placeholder="Enter coupon code" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={!!appliedCoupon || isApplying}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs h-10 focus-visible:ring-2 focus-visible:ring-[#1261C9]/30 focus-visible:border-[#1261C9]"
                />
                <Button 
                  onClick={handleApplyCoupon}
                  disabled={!!appliedCoupon || !couponInput.trim() || isApplying}
                  className="h-10 px-4 rounded-xl bg-[#1261C9] hover:bg-[#0D4FA8] text-white font-bold text-xs shadow-xs"
                >
                  {isApplying ? "..." : appliedCoupon ? "Applied" : "Apply"}
                </Button>
              </div>
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                  <span>Code <b>{appliedCoupon}</b> applied.</span>
                  <button 
                    onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponInput(""); }} 
                    className="underline hover:text-emerald-700 font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <Separator className="my-4 dark:bg-slate-800" />
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-900 dark:text-white font-medium">{displaySubtotal.toFixed(2)} ETB</span>
              </div>
              
              {serverAutomaticDiscount > 0 && (
                <div className="flex justify-between text-[#FF7900] font-semibold">
                  <span className="flex items-center gap-1 font-bold">
                    🔥 Automatic Promo Savings
                  </span>
                  <span className="font-bold">-{serverAutomaticDiscount.toFixed(2)} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping {shippingPackagesCount > 0 ? `(${shippingPackagesCount} package${shippingPackagesCount > 1 ? 's' : ''})` : ''}</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {shippingFee > 0 ? `${shippingFee.toFixed(2)} ETB` : 'Free'}
                </span>
              </div>

              {shippingBreakdown.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {shippingBreakdown.map((pkg: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>📦 {pkg.vendor_name || `Package ${idx + 1}`}</span>
                        <span className="text-[#1261C9] dark:text-blue-400">{Number(pkg.sub_order_shipping_fee || 0).toFixed(2)} ETB</span>
                      </div>
                      <div className="text-[10px] text-[#1261C9] dark:text-blue-400 flex items-center justify-between">
                        <span className="font-medium">{pkg.route_label || pkg.route_type}</span>
                        {pkg.fulfilling_warehouse && (
                          <span className="text-slate-500 font-medium">🏢 {pkg.fulfilling_warehouse.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount</span>
                  <span>-{discountAmount.toFixed(2)} ETB</span>
                </div>
              )}
            </div>
            
            <Separator className="my-4 dark:bg-slate-800" />
            
            <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white mb-6">
              <span>Total</span>
              <span className="text-[#1261C9] dark:text-blue-400 font-serif">
                {Math.max(0, displaySubtotal - serverAutomaticDiscount + shippingFee - discountAmount).toFixed(2)} ETB
              </span>
            </div>
            
            <p className="text-xs text-center text-slate-500 mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
