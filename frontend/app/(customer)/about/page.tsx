import Image from "next/image";
import { ShieldCheck, Truck, Headphones, Globe2 } from "lucide-react";

export const metadata = {
  title: "About Us | GechExpress",
  description: "Learn about the mission, vision, and team behind GechExpress, the premier global e-commerce marketplace.",
};

const features = [
  {
    icon: Globe2,
    title: "Global Reach",
    description: "We connect buyers and sellers from over 50 countries, bringing the world's best products directly to your doorstep."
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    description: "Your data and payments are protected with industry-leading encryption and robust fraud prevention systems."
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Partnering with top-tier logistics providers ensures that your orders arrive quickly and safely."
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated customer service team is available around the clock to assist you with any questions or issues."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-indigo-900 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2000&auto=format&fit=crop"
            alt="About GechExpress"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight font-serif mb-6 drop-shadow-md">
            Connecting You to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">World's Best</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            GechExpress was founded on a simple premise: everyone deserves access to high-quality products, regardless of where they live. We are building the future of global commerce.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl -mt-20 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-800 mb-16 md:mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                <p>
                  What started as a small local marketplace has rapidly grown into a premier destination for millions of shoppers and thousands of sellers worldwide.
                </p>
                <p>
                  At GechExpress, we believe that commerce should be borderless. We've spent years optimizing our logistics network, vetting top-tier sellers, and designing an intuitive platform that makes shopping an absolute joy.
                </p>
                <p>
                  Today, we are proud to offer an unmatched selection of electronics, fashion, and home goods, all backed by our comprehensive buyer protection guarantee.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
                alt="GechExpress Team"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-4">Why Shop With Us?</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            We don't just sell products; we deliver peace of mind. Here is what makes the GechExpress experience different.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 mb-6">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
