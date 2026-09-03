export const metadata = {
  title: "Terms & Conditions | GechExpress",
  description: "Read the terms and conditions for using the GechExpress platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-16 md:pt-32 max-w-4xl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="mb-10 border-b border-slate-200 dark:border-slate-800 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4">
              Terms & Conditions
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Last updated: August 19, 2026
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
            <h2>1. Introduction</h2>
            <p>
              Welcome to GechExpress. These Terms & Conditions govern your use of our website and services. By accessing or using GechExpress, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access our services.
            </p>

            <h2>2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
            </p>

            <h2>3. Products and Pricing</h2>
            <p>
              We reserve the right to modify or discontinue any product at any time without notice. Prices for our products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the service.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are and will remain the exclusive property of GechExpress and its licensors. The service is protected by copyright, trademark, and other laws of both the local and foreign jurisdictions.
            </p>

            <h2>5. Limitation of Liability</h2>
            <p>
              In no event shall GechExpress, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>

            <h2>6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:legal@gechexpress.com">legal@gechexpress.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
