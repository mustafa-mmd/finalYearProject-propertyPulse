"use client";

import { useState } from "react";

export default function PayOfferButton({
  offerId,
  amount,
  currency = "ZAR",
  label = "Pay Earnest Deposit",
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || "Could not launch checkout");
      }
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err.message || "Payment error");
      setLoading(false);
    }
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        disabled={loading}
        onClick={handlePay}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
        }
      >
        <span>💳</span>
        {loading ? "Redirecting…" : `${label} (${currency} ${Number(amount).toLocaleString()})`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
