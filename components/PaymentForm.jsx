"use client";

import { useMemo, useState } from "react";

const PAYMENT_LABELS = {
  nightly: "Nightly",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function PaymentForm({ propertyId, rates, currency = "ZAR" }) {
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    userPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableRates = useMemo(
    () =>
      Object.entries(PAYMENT_LABELS)
        .map(([type, label]) => ({ type, label, amount: Number(rates?.[type]) }))
        .filter(({ amount }) => Number.isFinite(amount) && amount > 0),
    [rates]
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }),
    [currency]
  );

  const selectedRate = availableRates.find(({ type }) => type === selectedType);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handlePayment(event) {
    event.preventDefault();
    if (!selectedType || loading) return;

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch("/api/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, type: selectedType, ...formData }),
        signal: controller.signal,
      });
      const data = await response.json();

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || "Payment could not be started");
      }

      window.location.assign(data.redirectUrl);
    } catch (requestError) {
      setError(
        requestError?.name === "AbortError"
          ? "The payment service took too long to respond. Please try again."
          : requestError?.message || "Payment could not be started. Please try again."
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
      {!selectedRate ? (
        <>
          <h2 className="text-center text-xl font-bold text-gray-900">
            Choose a rent period
          </h2>
          <div className="mt-6 space-y-3">
            {availableRates.map(({ type, label, amount }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-5 py-4 text-left transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="font-semibold text-gray-800">{label} rent</span>
                <span className="font-bold text-blue-700">{money.format(amount)}</span>
              </button>
            ))}
          </div>

          {!availableRates.length && (
            <p className="mt-5 rounded-lg bg-amber-50 p-4 text-center text-sm font-medium text-amber-800">
              No payment options are currently available for this property.
            </p>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setSelectedType(null);
              setError("");
            }}
            disabled={loading}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            ← Change rent period
          </button>

          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-gray-600">{selectedRate.label} rent</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">
              {money.format(selectedRate.amount)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              The final amount is verified from the property record on the server.
            </p>
          </div>

          <form onSubmit={handlePayment} className="mt-5 space-y-4">
            <Field
              label="Full name"
              name="userName"
              value={formData.userName}
              onChange={updateField}
              autoComplete="name"
              maxLength={100}
              required
            />
            <Field
              label="Email address"
              name="userEmail"
              type="email"
              value={formData.userEmail}
              onChange={updateField}
              autoComplete="email"
              maxLength={254}
              required
            />
            <Field
              label="Phone number (optional)"
              name="userPhone"
              type="tel"
              value={formData.userPhone}
              onChange={updateField}
              autoComplete="tel"
              maxLength={30}
            />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connecting to PayFast…" : "Continue to secure payment"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Payment is processed securely by PayFast in South African rand (ZAR).
          </p>
        </>
      )}
    </section>
  );
}

function Field({ label, ...inputProps }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        {...inputProps}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}
