export const metadata = {
  title: "Privacy Policy | GechExpress",
  description: "Learn how GechExpress collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:py-16 md:pt-32 max-w-4xl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="mb-10 border-b border-slate-200 dark:border-slate-800 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Last updated: August 19, 2026
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information to provide better services to all our users. The types of personal information we obtain include:
            </p>
            <ul>
              <li><strong>Contact Information:</strong> such as name, email address, phone number, and physical address.</li>
              <li><strong>Payment Information:</strong> such as credit card details, securely processed through our payment partners.</li>
              <li><strong>Usage Data:</strong> information on how you interact with our website, including IP addresses, browser types, and device identifiers.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              GechExpress uses the collected data for various purposes:
            </p>
            <ul>
              <li>To process and fulfill your orders, including sending emails to confirm your order status and shipment.</li>
              <li>To maintain and improve our services and your overall shopping experience.</li>
              <li>To communicate with you regarding customer support, updates, and promotional offers.</li>
              <li>To detect, prevent, and address technical issues or fraudulent activities.</li>
            </ul>

            <h2>3. Information Sharing and Disclosure</h2>
            <p>
              We do not sell your personal data to third parties. We may share your information with trusted third-party service providers (like shipping companies and payment processors) strictly for the purpose of fulfilling your orders.
            </p>

            <h2>4. Data Security</h2>
            <p>
              The security of your data is important to us. We use industry-standard encryption protocols to protect your personal information during transmission and storage. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>5. Your Data Rights</h2>
            <p>
              Depending on your location, you may have the right to access, update, or delete your personal information. You can manage most of this directly from your account settings. For further assistance, please contact our support team.
            </p>

            <h2>6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and hold certain information to enhance your browsing experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@gechexpress.com">privacy@gechexpress.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
