"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const PLAN_ICONS = {
  FREE: "🆓",
  LANDLORD: "🏠",
  PROFESSIONAL: "⭐",
  AGENCY: "🏢",
  PROPERTY_MANAGEMENT: "🔧",
  ENTERPRISE: "🚀",
};

const POPULAR_PLAN = "PROFESSIONAL";

export default function PricingClient({ plans, currentPlanCode, isAuthenticated, isPlatformOwner }) {
  const router = useRouter();
  const [billing, setBilling] = useState("MONTHLY");
  const [loading, setLoading] = useState(null);

  const annualSaving = (plan) => {
    const m = plan.prices?.monthly;
    const a = plan.prices?.annual;
    if (!m || !a || m === 0) return null;
    const saving = Math.round(((m * 12 - a) / (m * 12)) * 100);
    return saving > 0 ? saving : null;
  };

  const displayPrice = (plan) => {
    const m = plan.prices?.monthly ?? null;
    const a = plan.prices?.annual ?? null;
    if (m === null) return null; // Enterprise — custom
    if (m === 0) return 0;
    if (billing === "ANNUAL" && a) return Math.round(a / 12); // Monthly equivalent
    return m;
  };

  const handleChoosePlan = async (plan) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }

    const monthly = plan.prices?.monthly ?? null;

    // Free plan — instant activate via subscriptions API
    if (monthly === 0) {
      setLoading(plan.code);
      try {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planCode: plan.code, billingInterval: "MONTHLY" }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error?.message || "Could not activate free plan.");
          return;
        }
        toast.success("Free plan activated!");
        router.push("/profile");
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setLoading(null);
      }
      return;
    }

    // Enterprise — contact sales
    if (monthly === null) {
      router.push("/support");
      return;
    }

    // Direct checkout page
    setLoading(plan.code);
    try {
      const res = await fetch("/api/payment/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: plan.code, billingInterval: billing }),
      });
      const data = await res.json();

      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }

      // Default to internal checkout page
      router.push(`/subscribe/checkout?plan=${plan.code}&billing=${billing}`);
    } catch {
      router.push(`/subscribe/checkout?plan=${plan.code}&billing=${billing}`);
    } finally {
      setLoading(null);
    }
  };

  const planCtaLabel = (plan) => {
    if (isPlatformOwner) return "✓ Unlimited Access";
    if (currentPlanCode === plan.code) return "✓ Current Plan";
    const monthly = plan.prices?.monthly ?? null;
    if (monthly === null) return "Contact Sales";
    if (monthly === 0) return "Get Started Free";
    return `Start 14-Day Free Trial`;
  };

  const planCtaDisabled = (plan) => {
    if (isPlatformOwner) return true;
    if (currentPlanCode === plan.code) return true;
    if (loading !== null) return true;
    return false;
  };

  return (
    <section className="px-4 py-16 bg-slate-50">
      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
          <button
            onClick={() => setBilling("MONTHLY")}
            className={`rounded-lg px-6 py-2 text-sm font-semibold transition ${
              billing === "MONTHLY"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("ANNUAL")}
            className={`rounded-lg px-6 py-2 text-sm font-semibold transition flex items-center gap-2 ${
              billing === "ANNUAL"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Save up to 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const isPopular = plan.code === POPULAR_PLAN;
            const price = displayPrice(plan);
            const isCurrent = currentPlanCode === plan.code;
            const isDisabled = planCtaDisabled(plan);
            const isLoading = loading === plan.code;
            const saving = billing === "ANNUAL" ? annualSaving(plan) : null;

            return (
              <article
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:shadow-xl ${
                  isPopular
                    ? "border-blue-500 bg-gradient-to-b from-blue-600 to-indigo-700 text-white scale-[1.02] shadow-blue-300"
                    : isCurrent
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                {/* Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900 shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrent && !isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{PLAN_ICONS[plan.code] || "📋"}</span>
                  <h2 className={`text-lg font-bold ${isPopular ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h2>
                </div>
                <p className={`text-xs min-h-[2.5rem] ${isPopular ? "text-blue-100" : "text-slate-500"}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mt-5 mb-1">
                  {price === null ? (
                    <p className={`text-3xl font-extrabold ${isPopular ? "text-white" : "text-blue-700"}`}>
                      Custom
                    </p>
                  ) : price === 0 ? (
                    <p className={`text-3xl font-extrabold ${isPopular ? "text-white" : "text-blue-700"}`}>
                      Free
                    </p>
                  ) : (
                    <div>
                      <p className={`text-3xl font-extrabold ${isPopular ? "text-white" : "text-blue-700"}`}>
                        ${price.toLocaleString()}
                        <span className={`text-sm font-normal ml-1 ${isPopular ? "text-blue-200" : "text-slate-400"}`}>
                          /mo
                        </span>
                      </p>
                      {billing === "ANNUAL" && plan.prices?.annual && (
                        <p className={`text-xs mt-0.5 ${isPopular ? "text-blue-200" : "text-slate-500"}`}>
                          Billed ${plan.prices.annual.toLocaleString()} annually
                        </p>
                      )}
                      {saving && (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Save {saving}% vs monthly
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2">
                  {(plan.features || []).map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-xs ${isPopular ? "text-blue-100" : "text-slate-600"}`}
                    >
                      <span className={`mt-0.5 font-bold flex-shrink-0 ${isPopular ? "text-emerald-300" : "text-emerald-600"}`}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => !isDisabled && handleChoosePlan(plan)}
                  disabled={isDisabled}
                  className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    isPlatformOwner || isCurrent
                      ? "cursor-default opacity-60 bg-slate-200 text-slate-500"
                      : isPopular
                      ? "bg-white text-blue-700 hover:bg-blue-50 shadow-lg"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Redirecting…
                    </span>
                  ) : (
                    planCtaLabel(plan)
                  )}
                </button>

                {/* Trial note */}
                {price > 0 && !isCurrent && !isPlatformOwner && (
                  <p className={`mt-2 text-center text-xs ${isPopular ? "text-blue-200" : "text-slate-400"}`}>
                    14-day free trial · No credit card upfront
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {/* Stripe trust bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">🔒 Secured by Stripe</span>
          <span className="flex items-center gap-1.5">
            <img src="/images/cards/visa.svg" alt="Visa" className="h-5" onError={(e) => { e.target.style.display = "none"; }} />
            Visa
          </span>
          <span className="flex items-center gap-1.5">
            <img src="/images/cards/mastercard.svg" alt="Mastercard" className="h-5" onError={(e) => { e.target.style.display = "none"; }} />
            Mastercard
          </span>
          <span className="flex items-center gap-1.5">
            <img src="/images/cards/amex.svg" alt="Amex" className="h-5" onError={(e) => { e.target.style.display = "none"; }} />
            American Express
          </span>
          <span>🌍 135+ countries · 30+ currencies</span>
        </div>
      </div>
    </section>
  );
}
