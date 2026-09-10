"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTag, FaCalendarAlt, FaShieldAlt, FaPaperPlane } from "react-icons/fa";

export default function OfferForm({ propertyId, currency = "ZAR", askingPrice = 0 }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [depositValue, setDepositValue] = useState(0);

  async function submit(event, isInstantPay = false) {
    if (event && event.preventDefault) event.preventDefault();
    setBusy(false);
    setError("");

    const formEl = event?.target?.form || event?.currentTarget || document.querySelector("form");
    if (!formEl) return;
    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData);

    const offerAmt = Number(data.amount || 0);
    const depAmt = Number(data.depositAmount || 0);

    if (offerAmt <= 0) {
      setError("Please enter a valid offer amount.");
      return;
    }

    const body = {
      ...data,
      propertyId,
      amount: offerAmt,
      depositAmount: depAmt,
      financingContingency: data.financingContingency === "on",
      inspectionContingency: data.inspectionContingency === "on",
    };

    try {
      setBusy(true);
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || "Could not submit offer");
      }

      const offerId = payload.data?.id || payload.id || payload.data?._id;

      if (isInstantPay && offerId) {
        const payRes = await fetch("/api/payment/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId }),
        });
        const payData = await payRes.json();
        if (payRes.ok && payData.redirectUrl) {
          window.location.href = payData.redirectUrl;
          return;
        }
      }

      router.push("/offers");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const formattedAskingPrice = Number(askingPrice || 0).toLocaleString();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const defaultClosingStr = new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
  const defaultExpiryStr = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  return (
    <form
      onSubmit={(e) => submit(e, true)}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Submit a Purchase Offer
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Make a formal, legally-backed binding purchase offer directly to the seller.
        </p>

        {askingPrice > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <FaTag className="text-blue-600" />
            <span>
              Asking Price: <strong>{currency} {formattedAskingPrice}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Offer Amount & Deposit */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Offer Amount ({currency}) <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-3.5 text-sm font-medium text-slate-400">
              {currency}
            </span>
            <input
              name="amount"
              type="number"
              min="1"
              required
              placeholder="e.g. 2500000"
              className="w-full rounded-xl border border-slate-300 py-3 pl-14 pr-4 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Earnest Money Deposit ({currency})
          </label>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-3.5 text-sm font-medium text-slate-400">
              {currency}
            </span>
            <input
              name="depositAmount"
              type="number"
              min="0"
              defaultValue="0"
              onChange={(e) => setDepositValue(Number(e.target.value || 0))}
              placeholder="e.g. 50000"
              className="w-full rounded-xl border border-slate-300 py-3 pl-14 pr-4 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>
      </div>

      {/* Financing Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-800">
          Financing Type
        </label>
        <select
          name="financingType"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="MORTGAGE">Mortgage / Bank Loan</option>
          <option value="CASH">All Cash</option>
          <option value="OTHER">Other / Mixed Financing</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Proposed Closing Date <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <input
              name="proposedClosingDate"
              type="date"
              required
              min={todayStr}
              defaultValue={defaultClosingStr}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Offer Expiration Date <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <input
              name="expiresAt"
              type="date"
              required
              min={todayStr}
              defaultValue={defaultExpiryStr}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>
      </div>

      {/* Contingencies */}
      <div className="rounded-xl bg-slate-50 p-4 space-y-3 border border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Contingencies & Terms
        </p>

        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
          <input
            name="financingContingency"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">Financing Contingency</span>
          <span className="text-xs text-slate-400">(Subject to loan approval)</span>
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
          <input
            name="inspectionContingency"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">Home Inspection Contingency</span>
          <span className="text-xs text-slate-400">(Subject to property inspection)</span>
        </label>
      </div>

      {/* Message to seller */}
      <div>
        <label className="block text-sm font-semibold text-slate-800">
          Message or Conditions for Seller
        </label>
        <textarea
          name="message"
          maxLength={3000}
          rows={4}
          placeholder="Include any personal message, specific requests, or contract conditions..."
          className="mt-2 w-full rounded-xl border border-slate-300 p-4 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Submit buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(e, true)}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 text-base"
        >
          <span>💳</span>
          {busy
            ? "Redirecting to Stripe Checkout…"
            : depositValue > 0
              ? `Pay Earnest Deposit & Submit Offer (${currency} ${depositValue.toLocaleString()})`
              : `Pay Earnest Deposit & Submit Offer`}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(e, false)}
          className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 text-sm"
        >
          📩 Submit Offer to Seller (Without Deposit)
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <FaShieldAlt className="text-green-600" />
        Your offer is transmitted securely directly to the property listing owner.
      </p>
    </form>
  );
}
