import { CustomerHeader } from "@/components/customer/customer-header";
import { Footer } from "@/components/shared/footer";
import { ReactNode } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomerHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
