"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  
  useEffect(() => {
    // In a real application, you would:
    // 1. Extract the 'code' or 'token' from the URL (useSearchParams)
    // 2. Send it to your backend API to verify with Google
    // 3. Receive the JWT/Session cookie from your backend
    
    // For this mock implementation, we simulate the network delay
    // and then set the local authentication state.
    const authenticate = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set the mock auth token
      localStorage.setItem("userAuth", "true");
      
      // Redirect to the customer dashboard or wherever they came from
      router.push("/customer/settings");
    };

    authenticate();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800">
        <svg className="h-10 w-10 animate-pulse" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Authenticating...
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Please wait while we securely sign you in with Google.
        </p>
      </div>
    </div>
  );
}
