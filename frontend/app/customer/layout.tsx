import { ReactNode } from "react";
import { CustomerHeader } from "@/components/customer/customer-header";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { SuspendedCustomerBanner } from "@/components/customer/suspended-customer-banner";
import { Footer } from "@/components/shared/footer";

export default function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 print:bg-white print:min-h-0">
      <div className="print:hidden">
        <CustomerHeader />
        <SuspendedCustomerBanner />
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-12 flex-1 print:p-0 print:m-0 print:max-w-none print:w-full">
        <div className="flex flex-col lg:flex-row gap-8 print:block">
          <div className="print:hidden">
            <CustomerSidebar />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 print:p-0 print:m-0 print:w-full">
            <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 min-h-[500px] print:p-0 print:border-none print:shadow-none print:bg-white print:rounded-none">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
