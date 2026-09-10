import Link from "next/link";
import connectDB from "@/config/database";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Subscription from "@/models/Subscription";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";
import PricingClient from "@/components/PricingClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing — PropertyPulse",
  description:
    "Choose a PropertyPulse plan that fits your portfolio. Start free and scale as you grow. Payments powered by Stripe — accepted worldwide.",
};

const FAQS = [
  {
    q: "Can I start without a credit card?",
    a: "Yes. The Free plan activates instantly — no payment details required. Upgrade at any time.",
  },
  {
    q: "Is there a free trial on paid plans?",
    a: "Yes — all paid plans include a 14-day free trial. You won't be charged until the trial ends.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex, UnionPay) in 135+ currencies worldwide via Stripe.",
  },
  {
    q: "What happens to my listings if I downgrade?",
    a: "Existing published listings stay live. If you exceed the new plan's limit, new submissions are paused until you upgrade.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel from your profile at any time. Access continues until the end of the billing period — no penalties.",
  },
  {
    q: "Is my payment information secure?",
    a: "Absolutely. Payments are processed by Stripe — a PCI DSS Level 1 certified provider. We never store your card details.",
  },
];

const FEATURE_COMPARISON = [
  { feature: "Listing slots", free: "1", landlord: "10", professional: "50", agency: "250", enterprise: "Unlimited" },
  { feature: "Team members", free: "—", landlord: "1", professional: "5", agency: "25", enterprise: "Unlimited" },
  { feature: "Branch offices", free: "—", landlord: "—", professional: "1", agency: "10", enterprise: "Unlimited" },
  { feature: "AI verification", free: "Basic", landlord: "Priority", professional: "Priority", agency: "Priority", enterprise: "Dedicated" },
  { feature: "Listing analytics", free: "—", landlord: "✓", professional: "✓", agency: "✓", enterprise: "✓" },
  { feature: "API access", free: "—", landlord: "—", professional: "—", agency: "✓", enterprise: "✓" },
  { feature: "Support", free: "Email", landlord: "Email", professional: "Priority", agency: "Priority", enterprise: "Dedicated AM" },
  { feature: "Custom SLA", free: "—", landlord: "—", professional: "—", agency: "—", enterprise: "✓" },
  { feature: "14-day free trial", free: "—", landlord: "✓", professional: "✓", agency: "✓", enterprise: "Contact us" },
];

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  await connectDB();

  const stored = await SubscriptionPlan.find({ active: true, public: true }).sort({ sortOrder: 1 }).lean();
  const plans = stored.length ? JSON.parse(JSON.stringify(stored)) : DEFAULT_SUBSCRIPTION_PLANS;

  // Get user's current active subscription if logged in
  let currentPlanCode = null;
  const isPlatformOwner = session?.user?.roles?.includes("PLATFORM_OWNER");

  if (session?.user?.id && !isPlatformOwner) {
    const sub = await Subscription.findOne({
      userId: session.user.id,
      status: { $in: ["TRIALING", "ACTIVE"] },
    }).lean();
    currentPlanCode = sub?.planCode || "FREE";
  }

  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-4 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-semibold text-blue-300 ring-1 ring-blue-400/30 mb-6">
            <span>🌍</span> Accepted in 135+ countries via Stripe
          </div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-blue-200">
            Start free. All paid plans include a{" "}
            <span className="font-semibold text-white">14-day free trial</span>. No credit card required for Free.
            Cancel anytime.
          </p>
          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-300">
            <span className="flex items-center gap-1.5">🔒 Secured by Stripe</span>
            <span className="flex items-center gap-1.5">💳 Visa · Mastercard · Amex</span>
            <span className="flex items-center gap-1.5">✅ PCI DSS Compliant</span>
            <span className="flex items-center gap-1.5">🔄 Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Platform owner banner */}
      {isPlatformOwner && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-center">
          <p className="font-semibold text-white">
            👑 Platform Owner — You have unlimited access to all features with no restrictions.
          </p>
        </div>
      )}

      {/* Plans (interactive client component) */}
      <PricingClient
        plans={plans}
        currentPlanCode={isPlatformOwner ? "PLATFORM_OWNER" : currentPlanCode}
        isAuthenticated={!!session?.user?.id}
        isPlatformOwner={isPlatformOwner}
      />

      {/* Feature comparison table */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-slate-950">Compare all features</h2>
          <p className="mb-10 text-center text-slate-500">See exactly what&apos;s included in every plan.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Feature</th>
                  {["Free", "Landlord", "Professional", "Agency", "Enterprise"].map((col) => (
                    <th key={col} className="px-4 py-4 text-center text-xs font-bold uppercase text-slate-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{row.feature}</td>
                    {[row.free, row.landlord, row.professional, row.agency, row.enterprise].map((val, i) => (
                      <td key={i} className="px-4 py-3 text-center text-slate-600">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-slate-950">Frequently asked questions</h2>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 marker:hidden">
                  {faq.q}
                  <span className="shrink-0 text-blue-600 transition-transform duration-200 group-open:rotate-45 text-xl">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-white">Ready to grow your portfolio?</h2>
          <p className="mt-3 text-blue-100">Start with Free — no credit card needed. Upgrade when you&apos;re ready.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/signin" className="rounded-xl bg-white px-8 py-3 font-bold text-blue-700 shadow-lg hover:bg-blue-50 transition">
              Get started free
            </Link>
            <Link href="/support" className="rounded-xl border border-white/40 px-8 py-3 font-bold text-white hover:bg-white/10 transition">
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
