import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            How can we assist you today? Choose an option below to get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Email Support */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Send us an email anytime. We typically respond within 24 hours.
            </p>
            <a href="mailto:support@gechexpress.com" className="text-primary font-semibold hover:underline">
              support@gechexpress.com
            </a>
          </div>

          {/* Live Chat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Chat with our support agents in real-time during business hours.
            </p>
            <button className="text-blue-500 font-semibold hover:underline">
              Start a chat session
            </button>
          </div>

          {/* Phone Support */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Call Us</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Need immediate assistance? Call our toll-free customer support line. Available Mon-Fri, 9am - 5pm.
            </p>
            <a href="tel:+18005550000" className="text-orange-500 font-semibold hover:underline">
              +1 (800) 555-0000
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
