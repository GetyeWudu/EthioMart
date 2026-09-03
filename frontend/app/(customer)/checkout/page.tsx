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
import api from "@/lib/api";

export default function CheckoutPage() {
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
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
        <ShoppingCart className="h-16 w-16 text-slate-300 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products">
          <Button>Return to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 border-b border-slate-200 pb-8 dark:border-slate-800">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Checkout
        </h1>
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
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Order Summary</h2>
            
            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 rounded bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <Image 
                      src={item.variant_details?.product?.images?.[0]?.image_url || "/placeholder.svg"} 
                      fill 
                      className="object-cover" 
                      alt={item.variant_details?.product?.title || "Product"} 
                    />
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-slate-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="text-sm font-medium line-clamp-2">{item.variant_details?.product?.title}</span>
                    {item.variant_details?.attribute_values && item.variant_details.attribute_values.length > 0 && (
                      <span className="text-xs text-slate-500 mt-0.5">
                        {item.variant_details.attribute_values.map(av => `${av.attribute_name || 'Option'}: ${av.value}`).join(' | ')}
                      </span>
                    )}
                    <span className="text-sm text-slate-500 mt-1">{parseFloat(item.variant_details?.price || '0').toFixed(2)} ETB</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4 dark:bg-slate-800" />
            
            <div className="space-y-4">
              <Label htmlFor="coupon" className="text-sm font-medium">Discount Code</Label>
              <div className="flex gap-2">
                <Input 
                  id="coupon" 
                  placeholder="Enter code" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={!!appliedCoupon || isApplying}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
                <Button 
                  variant="secondary" 
                  onClick={handleApplyCoupon}
                  disabled={!!appliedCoupon || !couponInput.trim() || isApplying}
                >
                  {isApplying ? "..." : appliedCoupon ? "Applied" : "Apply"}
                </Button>
              </div>
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
                  <span>Code <b>{appliedCoupon}</b> applied.</span>
                  <button 
                    onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponInput(""); }} 
                    className="underline hover:text-emerald-700"
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
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1 font-semibold">
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
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>📦 {pkg.vendor_name || `Package ${idx + 1}`}</span>
                        <span>{Number(pkg.sub_order_shipping_fee || 0).toFixed(2)} ETB</span>
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                        <span>{pkg.route_label || pkg.route_type}</span>
                        {pkg.fulfilling_warehouse && (
                          <span className="text-slate-500 font-medium">🏢 {pkg.fulfilling_warehouse.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="font-medium">-{discountAmount.toFixed(2)} ETB</span>
                </div>
              )}
            </div>
            
            <Separator className="my-4 dark:bg-slate-800" />
            
            <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white mb-6">
              <span>Total</span>
              <span>{Math.max(0, displaySubtotal - serverAutomaticDiscount + shippingFee - discountAmount).toFixed(2)} ETB</span>
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
