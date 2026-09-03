import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact Us | GechExpress",
  description: "Get in touch with the GechExpress support team for help with your orders or general inquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-16 md:pt-32 max-w-6xl">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 mb-6 shadow-sm">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            Have a question about an order, our products, or want to partner with us? Fill out the form below and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-4 transition-all hover:border-indigo-500/50">
              <div className="bg-indigo-50 dark:bg-slate-800 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Office Location</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bole Sub-city, Woreda 03<br />
                  Addis Ababa, Ethiopia<br />
                  1000
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-4 transition-all hover:border-indigo-500/50">
              <div className="bg-indigo-50 dark:bg-slate-800 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email Us</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Support: support@gechexpress.com</p>
                <p className="text-slate-500 dark:text-slate-400">Sales: sales@gechexpress.com</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-4 transition-all hover:border-indigo-500/50">
              <div className="bg-indigo-50 dark:bg-slate-800 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Call Us</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Direct: +251 911 23 45 67</p>
                <p className="text-slate-500 dark:text-slate-400">Mon-Sat from 8:00 AM to 5:00 PM</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 font-serif">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="first-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                  <Input id="first-name" placeholder="John" className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                  <Input id="last-name" placeholder="Doe" className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <Input id="email" type="email" placeholder="john@example.com" className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <Input id="subject" placeholder="How can we help?" className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Message</label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us everything..." 
                  className="min-h-[150px] resize-y bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" 
                />
              </div>

              <Button type="button" className="w-full sm:w-auto h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
