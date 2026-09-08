import { ReactNode } from "react";
import { CustomerHeader } from "@/components/customer/customer-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <CustomerHeader />

      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-12 sm:pt-28 sm:pb-16 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} EthioMart. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
