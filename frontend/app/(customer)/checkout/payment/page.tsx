"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Lock, CreditCard, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChapaGatewaySimulation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "mobile">("card");

  // Simulate payment processing
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // After showing success state briefly, redirect to the store's success receipt page
      setTimeout(() => {
        window.location.href = "/checkout/success";
      }, 1000);
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-emerald-100 flex flex-col items-center justify-center space-y-4">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
          <p className="text-slate-500">Redirecting you back to GechExpress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* Gateway Header */}
        <div className="flex justify-center items-center gap-2 mb-6 text-emerald-700">
          <ShieldCheck className="h-8 w-8" />
          <span className="text-2xl font-black tracking-tighter">CHAPA</span>
          <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full font-bold ml-1">TEST MODE</span>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          
          {/* Order Details */}
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex justify-between items-start opacity-80 text-sm font-medium mb-1">
              <span>Pay to Merchant</span>
              <span>Amount Due</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold">GechExpress</span>
              <span className="text-3xl font-black">ETB 323.99</span>
            </div>
          </div>

          {/* Payment Methods Tabs */}
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab("card")}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === "card" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <CreditCard className="h-4 w-4" />
              Pay with Card
            </button>
            <button 
              onClick={() => setActiveTab("mobile")}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === "mobile" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </button>
          </div>

          <form onSubmit={handlePayment} className="p-6 sm:p-8">
            
            {activeTab === "card" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="card" className="text-slate-700">Card Number</Label>
                  <div className="relative">
                    <Input id="card" placeholder="0000 0000 0000 0000" required className="pl-10 h-12 bg-slate-50" />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp" className="text-slate-700">Expiry Date</Label>
                    <Input id="exp" placeholder="MM/YY" required className="h-12 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-slate-700">CVV</Label>
                    <div className="relative">
                      <Input id="cvv" placeholder="123" required className="h-12 bg-slate-50 pr-10" />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700">Phone Number (Telebirr / CBE)</Label>
                  <div className="relative">
                    <Input id="phone" placeholder="+251 900 000 000" required className="pl-10 h-12 bg-slate-50" />
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl leading-relaxed">
                  <strong>Notice:</strong> We will send a prompt to your phone. Please check your device to authorize the deduction of 323.99 ETB.
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full h-14 mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                "Pay ETB 323.99"
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              <Lock className="h-3 w-3" />
              Secured by Chapa
            </div>
          </form>

        </div>
        
        <div className="text-center mt-6">
          <button type="button" onClick={() => window.location.href = '/checkout'} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Cancel Payment & Return to Store
          </button>
        </div>
      </div>
    </div>
  );
}
