import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircleQuestion } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions | GechExpress",
  description: "Find answers to the most commonly asked questions about ordering, shipping, and returns on GechExpress.",
};

const faqs = [
  {
    category: "Ordering & Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. We also support local bank transfers depending on your region.",
      },
      {
        question: "Can I modify or cancel my order after placing it?",
        answer: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing and cannot be changed. You can still return the items once received according to our return policy.",
      },
      {
        question: "How do I use a promo code?",
        answer: "During checkout, you will see a 'Promo Code' field. Enter your code there and click 'Apply'. The discount will be reflected in your order total immediately.",
      },
    ]
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        question: "How long does shipping take?",
        answer: "Standard shipping typically takes 3-5 business days. Express shipping takes 1-2 business days. International delivery times vary depending on the destination and customs processing.",
      },
      {
        question: "How can I track my order?",
        answer: "Once your order ships, you will receive a tracking number via email. You can also view your order status and tracking details in the 'My Orders' section of your account profile.",
      },
      {
        question: "Do you ship internationally?",
        answer: "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times are calculated at checkout based on your delivery address.",
      },
    ]
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for unused, unopened items in their original packaging. Clothing must have tags still attached. Some exclusions apply (like perishables and intimates).",
      },
      {
        question: "How do I start a return?",
        answer: "Log into your account, go to 'My Orders', select the order you wish to return, and click 'Initiate Return'. You will be provided with a printable return shipping label.",
      },
      {
        question: "When will I receive my refund?",
        answer: "Refunds are processed within 5-7 business days after we receive and inspect your returned items. The funds will be credited back to your original payment method.",
      },
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-16 md:pt-32 max-w-4xl">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 mb-6 shadow-sm">
            <MessageCircleQuestion className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            Everything you need to know about shopping, shipping, and returns. Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 font-serif">
                {section.category}
              </h2>
              <Accordion className="w-full">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`item-${idx}-${i}`} className="border-slate-200 dark:border-slate-800">
                    <AccordionTrigger className="text-left font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-4 sm:py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-500 dark:text-slate-400 leading-relaxed pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
