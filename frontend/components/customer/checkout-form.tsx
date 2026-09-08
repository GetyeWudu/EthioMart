"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Truck, ShieldCheck, Smartphone, Landmark, Banknote, Wallet, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export function CheckoutForm({ 
  appliedCoupon,
  selectedZoneId,
  onZoneSelect
}: { 
  appliedCoupon: string | null;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isSuspended } = useCurrentUser();
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbebirr" | "chapa" | "cod">("chapa");
  const [isProcessing, setIsProcessing] = useState(false);
  const { cartId, clearCart } = useCartStore();
  const [shippingAddress, setShippingAddress] = useState<any>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [selectedSubCity, setSelectedSubCity] = useState("");

  const { data: zones } = useSWR("/shipping/zones/", async (url) => {
    const res = await api.get(url);
    return res.data?.results || res.data || [];
  });

  const selectedZone = zones?.find((z: any) => z.id === selectedZoneId);
  const currentSubCities = selectedZone?.sub_cities || [];

  const { data: addresses, mutate: mutateAddresses } = useSWR(
    isAuthenticated ? "/auth/addresses/" : null, 
    async (url) => {
      const res = await api.get(url);
      return res.data?.results || res.data || [];
    }
  );

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      toast.error("Your purchasing privileges are suspended. Checkout is disabled.");
      return;
    }
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    let finalAddress = {};
    if (selectedAddressId !== "new") {
      const addr = addresses?.find((a: any) => a.id === selectedAddressId);
      if (addr) {
        finalAddress = {
          firstName: addr.full_name.split(' ')[0],
          lastName: addr.full_name.split(' ').slice(1).join(' '),
          phone: addr.phone_number,
          region: addr.city, // Wait, city is mapped to region/zone?
          subcity: addr.subcity,
          kebele: addr.woreda + ' ' + addr.house_no + ' ' + addr.landmark
        };
      }
    } else {
      finalAddress = data;
      // Optionally save it
    }
    
    setShippingAddress(finalAddress);
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      toast.error("Your purchasing privileges are suspended. Checkout is disabled.");
      return;
    }
    if (!cartId) {
      alert("Your cart is empty!");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const res = await api.post('/orders/checkout/', {
        cart_id: cartId,
        delivery_method: 'DOORSTEP',
        shipping_address: shippingAddress,
        coupon_code: appliedCoupon,
        zone_id: selectedZoneId
      });
      
      const paymentUrl = res.data?.payment?.data?.checkout_url;
      if (paymentUrl) {
        if (paymentUrl.includes('mock-chapa-checkout')) {
          await api.post(paymentUrl);
          clearCart();
          toast.success("Payment completed successfully!");
          router.push(`/checkout/success?order=${res.data.order.id}`);
        } else {
          // Real Chapa hosted checkout gateway redirect
          clearCart();
          window.location.href = paymentUrl;
        }
      } else {
        toast.error("Order placed successfully, but payment initialization failed.");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const serverMsg = error.data?.detail || error.data?.message || error.response?.data?.detail || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);
      const displayMsg = serverMsg || error.message || "Checkout failed. Please check stock and try again.";
      toast.error(displayMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {isSuspended && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-900 dark:text-rose-200">
          <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Account Notice:</span> Your purchasing privileges are currently suspended. You cannot place new orders or complete checkout at this time.
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {step === "shipping" ? (
          <div>
            <div className="bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] text-white px-6 py-4 flex items-center gap-3 shadow-xs">
              <MapPin className="h-5 w-5 text-[#FF7900]" />
              <h2 className="text-base font-bold tracking-tight">Shipping Information</h2>
            </div>
            
            <form onSubmit={handleShippingSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Saved Addresses (if authenticated) */}
                {isAuthenticated && addresses && addresses.length > 0 && (
                  <div className="space-y-4 sm:col-span-2">
                    <Label>Saved Addresses</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr: any) => (
                        <label 
                          key={addr.id}
                          className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                            selectedAddressId === addr.id 
                              ? "border-[#1261C9] bg-[#1261C9]/5 ring-1 ring-[#1261C9]" 
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{addr.full_name}</span>
                            <input 
                              type="radio" 
                              name="addressId" 
                              value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="sr-only"
                            />
                            {selectedAddressId === addr.id && <CheckCircle2 className="h-4 w-4 text-[#1261C9]" />}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            <p>{addr.phone_number}</p>
                            <p>{addr.city}, {addr.subcity}</p>
                            <p>{addr.woreda} {addr.house_no} {addr.landmark}</p>
                          </div>
                        </label>
                      ))}
                      
                      <label 
                        className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-center items-center gap-2 transition-all min-h-[100px] ${
                          selectedAddressId === "new" 
                            ? "border-[#1261C9] bg-[#1261C9]/5 ring-1 ring-[#1261C9]" 
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-[#1261C9]/40"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="addressId" 
                          value="new"
                          checked={selectedAddressId === "new"}
                          onChange={() => setSelectedAddressId("new")}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold text-[#1261C9]">+ Add New Address</span>
                      </label>
                    </div>
                  </div>
                )}

                {selectedAddressId === "new" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" required placeholder="e.g. Abebe" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" required placeholder="e.g. Bikila" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phone">Phone Number (Required for Delivery)</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <Input id="phone" name="phone" type="tel" placeholder="+251 900 000 000" required className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                      </div>
                    </div>

                    {/* Level 1: Region / Destination City */}
                    <div className="space-y-2 sm:col-span-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Label htmlFor="region">Region / Destination City *</Label>
                      <div className="relative">
                        <select 
                          id="region"
                          name="region"
                          required
                          value={selectedZoneId || ""}
                          onChange={(e) => {
                            onZoneSelect(e.target.value);
                            setSelectedSubCity("");
                          }}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer font-medium"
                        >
                          <option value="" disabled>Select Region / City</option>
                          {zones?.map((zone: any) => {
                            const standardRate = zone.rates?.find((r: any) => r.shipping_class === "STANDARD") || zone.rates?.[0];
                            const estText = standardRate ? ` (Est. ${standardRate.estimated_days_min}-${standardRate.estimated_days_max} days)` : "";
                            return (
                              <option key={zone.id} value={zone.id}>
                                {zone.name}{estText}
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Level 2: Sub-City / Kifle Ketema */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="subcity">Sub-City / Kifle Ketema *</Label>
                      <div className="relative">
                        <select 
                          id="subcity"
                          name="subcity"
                          required
                          value={selectedSubCity}
                          onChange={(e) => setSelectedSubCity(e.target.value)}
                          disabled={!selectedZoneId || currentSubCities.length === 0}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          <option value="" disabled>
                            {!selectedZoneId 
                              ? "Select a Region / City first" 
                              : currentSubCities.length === 0 
                              ? "No sub-cities found" 
                              : "Select Sub-city / Kifle Ketema"}
                          </option>
                          {currentSubCities.map((sc: any) => (
                            <option key={sc.id || sc.name} value={sc.name}>
                              {sc.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Level 3: Kebele / Street / Landmark */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="kebele">Kebele / Street / Specific Landmark *</Label>
                      <Input id="kebele" name="kebele" placeholder="e.g. Kebele 03, Behind Edna Mall, House #402" required className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>
                  </>
                )}

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" size="lg" disabled={isSuspended || isProcessing} className={`w-full sm:w-auto px-8 rounded-xl ${isSuspended ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white font-bold shadow-md shadow-[#1261C9]/25"}`}>
                  Continue to Payment
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] text-white px-6 py-4 flex items-center gap-3 shadow-xs">
              <CreditCard className="h-5 w-5 text-[#FF7900]" />
              <h2 className="text-base font-bold tracking-tight">Payment Method</h2>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 sm:p-8 space-y-6">
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Chapa Payment Gateway (All Ethiopian Rails) */}
                <label className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all col-span-1 sm:col-span-2 ${paymentMethod === "chapa" ? "border-[#1261C9] bg-[#1261C9]/5 dark:bg-[#1261C9]/10 shadow-md ring-1 ring-[#1261C9]" : "border-slate-200 dark:border-slate-800 hover:border-[#1261C9]/50 bg-white dark:bg-slate-900"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="chapa"
                        checked={paymentMethod === "chapa"}
                        onChange={() => setPaymentMethod("chapa")}
                        className="h-4 w-4 text-[#1261C9] focus:ring-[#1261C9]" 
                      />
                      <CreditCard className="h-5 w-5 text-[#1261C9] dark:text-blue-400" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">Chapa Payment Gateway</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Telebirr • CBEBirr • Debit/Credit Cards • Awash • Dashen</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      <span className="text-[10px] bg-[#FF7900]/15 text-[#FF7900] dark:bg-[#FF7900]/25 dark:text-orange-300 px-2.5 py-0.5 rounded-full font-bold uppercase">Telebirr</span>
                      <span className="text-[10px] bg-[#1261C9]/15 text-[#1261C9] dark:bg-[#1261C9]/25 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold uppercase">CBEBirr</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase">Cards</span>
                    </div>
                  </div>
                  <div className="pl-7 mt-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      You will be securely redirected to Chapa to complete payment via Telebirr mobile wallet, CBEBirr, or domestic/international debit cards.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label className="cursor-not-allowed rounded-xl border-2 p-4 flex flex-col gap-3 transition-all col-span-1 sm:col-span-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod"
                      disabled
                      className="h-4 w-4 text-slate-400" 
                    />
                    <Wallet className="h-5 w-5 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Cash on Delivery (Addis Ababa only)</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-semibold uppercase">Coming Soon</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setStep("shipping")} className="text-slate-500 hover:text-[#1261C9] font-bold" disabled={isProcessing}>
                  &larr; Back to Shipping
                </Button>
                <Button type="submit" size="lg" disabled={isSuspended || isProcessing} className={`gap-2 min-w-[160px] rounded-xl font-bold ${isSuspended ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white shadow-lg shadow-[#1261C9]/25"}`}>
                  {isProcessing ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-[#FF7900]" />
                  )}
                  {isProcessing ? "Redirecting..." : "Place Order"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
