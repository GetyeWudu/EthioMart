import { SellerForm } from "@/components/admin/seller-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewSellerPage() {
  return (
    
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <Link href="/admin/sellers" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sellers
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Onboard New Seller</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manually register a new store and configure platform fees.
              </p>
            </div>
            
            <SellerForm />
          </div>
        );
}
