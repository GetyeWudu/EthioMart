import Link from "next/link";
import { ReactNode } from "react";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 bg-white/50 backdrop-blur-md dark:bg-slate-950/50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tighter">GechExpress</span>
          </Link>
          <Link href="/help" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            Need help?
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} GechExpress. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
