import Link from "next/link";
import { XCircle, RefreshCcw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function CheckoutFailurePage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 min-h-[70vh] flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex justify-center">
          <div className="h-24 w-24 bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-full flex items-center justify-center mb-2 shadow-sm ring-8 ring-rose-50 dark:ring-rose-950">
            <XCircle className="h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payment Failed
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            We couldn't process your payment. Your card has <span className="font-semibold text-rose-600 dark:text-rose-400">not</span> been charged.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 text-left border border-slate-100 dark:border-slate-800">
          <p className="font-medium text-slate-900 dark:text-slate-200 mb-1">Common reasons for failure:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Incorrect card details entered</li>
            <li>Insufficient funds</li>
            <li>Bank declined the transaction</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 pt-4 relative z-10">
          <Link href="/checkout" className={buttonVariants({ size: "lg", className: "w-full shadow-lg" })}>
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
            <Home className="mr-2 h-5 w-5 text-slate-500" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
