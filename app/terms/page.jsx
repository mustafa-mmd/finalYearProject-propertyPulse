import Link from "next/link";
import { FaFileContract, FaGavel, FaCheckCircle } from "react-icons/fa";

export const metadata = {
  title: "Terms of Service — PropertyPulse",
  description: "Global Terms of Service and User Agreement for PropertyPulse real estate platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <FaFileContract className="text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective Date: August 2026 · Global Real Estate &amp; SaaS Platform Agreement
          </p>
        </div>

        {/* Content card */}
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80 space-y-8 leading-relaxed text-slate-700 text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaGavel className="text-blue-600 text-lg" /> 1. Acceptance of Terms
            </h2>
            <p className="mt-3">
              By accessing or using PropertyPulse (&quot;Platform&quot;), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or organization, you represent that you have authority to bind such entity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. User Roles &amp; Responsibilities</h2>
            <div className="mt-3 space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900">Property Owners &amp; Landlords:</h3>
                <p className="text-sm text-slate-600">
                  You warrant that all property details, pricing, availability, and media provided are accurate, lawful, and compliant with local real estate regulations and fair housing laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Tenants &amp; Buyers:</h3>
                <p className="text-sm text-slate-600">
                  You agree to provide truthful identity information when submitting applications, viewing requests, offers, or lease agreements.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. Verification &amp; Anti-Fraud</h2>
            <p className="mt-3">
              PropertyPulse reserves the right to review, verify, pause, or remove any listing or user account that fails AI verification, contains fraudulent signals, or violates platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Payments &amp; Subscriptions</h2>
            <p className="mt-3">
              Subscription plans, listing fees, and rental transaction processing fees are billed according to specified plan terms. Refunds and cancellations are governed by our billing policy available in your <Link href="/pricing" className="text-blue-600 underline">Pricing</Link> dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Contact Information</h2>
            <p className="mt-3">
              For questions regarding these Terms of Service, email <a href="mailto:legal@propertypulse.com" className="text-blue-600 hover:underline">legal@propertypulse.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
