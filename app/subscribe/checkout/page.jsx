"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
  FaCreditCard,
  FaArrowLeft,
  FaGlobe,
} from "react-icons/fa";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES, formatPrice } from "@/config/international";

export default function CheckoutPage({ searchParams: searchParamsPromise }) {
  const searchParams = use(searchParamsPromise);
  const router = useRouter();

  const planCode = (searchParams?.plan || "LANDLORD").toUpperCase();
  const billingInterval = (searchParams?.billing || "MONTHLY").toUpperCase();

  const plan =
    DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.code === planCode) ||
    DEFAULT_SUBSCRIPTION_PLANS[1];

  const [currency, setCurrency] = useState("ZAR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card form state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // Price calculations
  const baseMonthlyPrice = plan.prices?.monthly || 0;
  const baseAnnualPrice = plan.prices?.annual || baseMonthlyPrice * 10;
  const isAnnual = billingInterval === "ANNUAL";
  const displayAmount = isAnnual ? baseAnnualPrice : baseMonthlyPrice;

  async function handleCheckout(e) {
    e.preventDefault();
    setError("");

    if (plan.prices?.monthly !== 0) {
      if (cardNumber.replace(/\s/g, "").length < 15) {
        setError("Please enter a valid card number.");
        return;
      }
      if (!expiry || !cvc) {
        setError("Please complete card expiry date and CVV security code.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: plan.code,
          billingInterval,
          currency,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || "Subscription payment failed.");
      }

      toast.success(`🎉 Subscribed to ${plan.name} plan successfully!`);
      router.push("/profile?subscription=success");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl px-4">
        {/* Back Link */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition mb-6"
        >
          <FaArrowLeft /> Back to Pricing
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* ── Left: Plan Summary Card ── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 border border-blue-500/30">
                  {plan.code} PLAN
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  14-Day Free Trial
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold text-white">
                {plan.name}
              </h1>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>

              {/* Price display */}
              <div className="mt-6 rounded-2xl bg-slate-900/80 p-5 border border-slate-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-400">
                    Billed {billingInterval.toLowerCase()}
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white">
                      {formatPrice(displayAmount, currency)}
                    </span>
                    <span className="text-sm text-slate-400">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-emerald-400 border-t border-slate-800 pt-3">
                  <span>Due Today:</span>
                  <span className="font-bold text-white">
                    {CURRENCY_SYMBOLS[currency] || currency} 0.00 (Free 14-Day Trial)
                  </span>
                </div>
              </div>

              {/* Included Limits & Features */}
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included Plan Limits
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block">Listing Slots</span>
                    <span className="text-lg font-bold text-white">
                      {plan.limits?.activeListings === -1
                        ? "Unlimited"
                        : plan.limits?.activeListings}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block">Team Seats</span>
                    <span className="text-lg font-bold text-white">
                      {plan.limits?.teamMembers === -1
                        ? "Unlimited"
                        : plan.limits?.teamMembers}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  {plan.features?.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Security Guarantee Footer */}
            <div className="mt-8 border-t border-slate-800 pt-5 text-xs text-slate-400 flex items-center gap-3">
              <FaShieldAlt className="text-emerald-400 text-xl shrink-0" />
              <span>
                Encrypted 256-bit SSL transaction. Cancel anytime before your 14-day trial ends to avoid charges.
              </span>
            </div>
          </div>

          {/* ── Right: Checkout Form ── */}
          <form
            onSubmit={handleCheckout}
            className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaLock className="text-blue-500 text-base" /> Payment Information
              </h2>

              {/* Currency Picker */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FaGlobe />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-white font-semibold outline-none focus:border-blue-500"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c} ({CURRENCY_SYMBOLS[c] || c})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name on Card */}
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Cardholder Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g. John Doe"
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Card Number <span className="text-red-400">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  placeholder="4532 •••• •••• 8901"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-4 pr-12 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <FaCreditCard className="absolute right-4 top-3.5 text-slate-400 text-lg" />
              </div>
            </div>

            {/* Expiry & CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Expiration (MM/YY) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                    setExpiry(v);
                  }}
                  placeholder="12/28"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Security Code (CVC) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              {loading ? "Activating Subscription…" : `Start 14-Day Free Trial & Subscribe`}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              By clicking Subscribe, you agree to PropertyPulse terms and consent to automatic billing after trial.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
