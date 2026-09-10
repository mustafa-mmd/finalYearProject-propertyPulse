import Link from "next/link";
import { FaCookieBite, FaShieldAlt } from "react-icons/fa";

export const metadata = {
  title: "Cookie Policy — PropertyPulse",
  description: "Learn how PropertyPulse uses cookies and tracking technologies to enhance user experience.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <FaCookieBite className="text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Cookie Policy</h1>
          <p className="mt-2 text-sm text-slate-500">
            Information on Cookies &amp; Local Storage Usage across PropertyPulse
          </p>
        </div>

        {/* Content card */}
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80 space-y-8 leading-relaxed text-slate-700 text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. What Are Cookies?</h2>
            <p className="mt-3">
              Cookies and web storage are small files stored on your browser or device when you visit websites. They help us remember your preferences, authentication tokens, language settings, and active session state.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Categories of Cookies We Use</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Essential &amp; Security Cookies (Strictly Necessary)</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Required for user authentication, security CSRF protection, active session state, and saved preferences.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Internationalization &amp; Preferences</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Stores your selected language locale, preferred currency, and search filter defaults.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Performance &amp; Analytics</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Helps us understand platform usage trends and optimize page performance.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. Managing Your Cookie Preferences</h2>
            <p className="mt-3">
              You can control or clear cookies at any time via your browser settings. You can also update your platform preferences directly in your <Link href="/settings" className="text-blue-600 underline">Account Settings</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
