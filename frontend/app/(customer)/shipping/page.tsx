import { Truck, RotateCcw, PackageCheck, Globe2 } from "lucide-react";

export const metadata = {
  title: "Shipping & Returns | GechExpress",
  description: "Learn about GechExpress shipping methods, delivery times, and our hassle-free return policy.",
};

const policies = [
  {
    icon: Truck,
    title: "Standard Shipping",
    description: "Our standard shipping takes 3-5 business days for domestic orders. Tracking is provided as soon as your order leaves our warehouse."
  },
  {
    icon: Globe2,
    title: "International Shipping",
    description: "We ship globally to over 50 countries. International delivery typically takes 7-14 business days depending on customs processing."
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    description: "Not completely satisfied? Return any unused item in its original packaging within 30 days of receipt for a full refund."
  },
  {
    icon: PackageCheck,
    title: "Return Processing",
    description: "Once we receive your return, refunds are processed within 5-7 business days back to your original payment method."
  }
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-16 md:pt-32 max-w-5xl">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 mb-6 shadow-sm">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4">
            Shipping & Returns
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            We strive to get your orders to you as quickly as possible. If things don't work out, our hassle-free return policy has you covered.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
          {policies.map((policy, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                <policy.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{policy.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {policy.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
            <h2>Detailed Shipping Information</h2>
            <p>
              All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
            </p>
            
            <h3>Shipping Rates</h3>
            <p>
              Shipping charges for your order will be calculated and displayed at checkout. We offer free standard shipping on all domestic orders over $50.
            </p>

            <h2>Detailed Return Process</h2>
            <p>
              To initiate a return, please follow these steps:
            </p>
            <ol>
              <li>Log into your GechExpress account and navigate to "My Orders".</li>
              <li>Select the order containing the item(s) you wish to return.</li>
              <li>Click "Initiate Return" and select the reason for the return.</li>
              <li>Print the generated return shipping label.</li>
              <li>Pack the items securely in their original packaging and attach the label.</li>
              <li>Drop off the package at any authorized shipping location.</li>
            </ol>
            <p>
              Please note that you are responsible for paying the shipping costs for returning your item unless the item is defective or we made an error in fulfillment. Original shipping costs are non-refundable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
