import Link from "next/link";
import { FaShieldAlt, FaLock, FaUserShield, FaGlobe } from "react-icons/fa";

export const metadata = {
  title: "Privacy Policy — PropertyPulse",
  description: "Global Privacy Policy and data protection compliance information for PropertyPulse users worldwide.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <FaShieldAlt className="text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Global Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">
            Last Updated: August 2026 · Compliant with GDPR, CCPA, POPIA &amp; International Standards
          </p>
        </div>

        {/* Content card */}
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80 space-y-8 leading-relaxed text-slate-700 text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaGlobe className="text-blue-600 text-lg" /> 1. Overview &amp; Scope
            </h2>
            <p className="mt-3">
              PropertyPulse Inc. (&quot;PropertyPulse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to respecting your privacy and safeguarding your personal data. This Privacy Policy applies globally to all users of our web application, mobile apps, and associated property listing and management services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaUserShield className="text-blue-600 text-lg" /> 2. Information We Collect
            </h2>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>Account &amp; Identity Data:</strong> Name, email address, phone number, and profile preferences upon registration.</li>
              <li><strong>Property &amp; Transaction Information:</strong> Listing photos, addresses, pricing details, lease agreements, booking schedules, and support ticket history.</li>
              <li><strong>Payment &amp; Billing Data:</strong> Encrypted payment records processed through PCI-DSS compliant payment gateways.</li>
              <li><strong>Technical &amp; Usage Data:</strong> IP address, device telemetry, browser type, location parameters, and cookie preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FaLock className="text-blue-600 text-lg" /> 3. How We Use Your Data
            </h2>
            <p className="mt-3">
              We process personal data strictly to deliver platform functionality, including:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Facilitating property searches, viewing requests, offers, and rental agreements.</li>
              <li>AI-powered fraud screening and listing verification to maintain market integrity.</li>
              <li>Processing secure rental payments, invoices, and subscription renewals.</li>
              <li>Providing support and platform notifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Global Data Protection Rights</h2>
            <p className="mt-3">
              Depending on your jurisdiction (e.g. EU/UK GDPR, California CCPA, South Africa POPIA), you hold rights to:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Access, request a copy of, or export your personal data.</li>
              <li>Request correction or deletion (&quot;Right to be Forgotten&quot;).</li>
              <li>Restrict or object to specific processing activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Contact Our Data Protection Office</h2>
            <p className="mt-3">
              If you have questions regarding data privacy or wish to submit a data request, contact us at:
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="font-semibold text-slate-900">PropertyPulse Data Privacy Office</p>
              <p className="text-slate-600">Email: <a href="mailto:privacy@propertypulse.com" className="text-blue-600 hover:underline">privacy@propertypulse.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
