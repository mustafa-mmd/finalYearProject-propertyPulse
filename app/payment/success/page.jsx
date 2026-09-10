"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "refunded"]);

function SuccessContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("tid") || "";
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transactionId) {
      setError("The payment reference is missing.");
      setLoading(false);
      return;
    }

    let active = true;
    let timeoutId;
    let attempts = 0;

    async function loadStatus() {
      try {
        const response = await fetch(
          `/api/payment/details?tid=${encodeURIComponent(transactionId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Payment status is unavailable");
        }
        if (!active) return;

        setPayment(data.payment);
        setError("");
        attempts += 1;

        if (!TERMINAL_STATUSES.has(data.payment.paymentStatus) && attempts < 8) {
          timeoutId = setTimeout(loadStatus, 2000);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [transactionId]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: payment?.currency || "ZAR",
      }),
    [payment?.currency]
  );

  const completed = payment?.paymentStatus === "completed";
  const pending = payment?.paymentStatus === "pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
            completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
          aria-hidden="true"
        >
          {completed ? "✓" : "…"}
        </div>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          {completed
            ? "Payment confirmed"
            : pending
              ? "Payment confirmation pending"
              : "Checking your payment"}
        </h1>
        <p className="mt-3 text-slate-600">
          {completed
            ? "Your transaction has been securely processed and confirmed."
            : "We are processing secure payment confirmation. Your booking/offer status will update shortly."}
        </p>

        {loading && <p className="mt-6 text-sm text-blue-700">Checking status…</p>}
        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {error} You can safely return later using this payment reference.
          </p>
        )}

        {payment && (
          <dl className="mt-7 space-y-3 rounded-xl bg-slate-50 p-5 text-left text-sm border border-slate-100">
            <Detail label="Property" value={payment.propertyName} />
            <Detail label="Payment type" value={payment.paymentType} capitalize />
            <Detail label="Amount" value={money.format(payment.amount)} />
            <Detail label="Status" value={payment.paymentStatus} capitalize />
            <Detail label="Reference" value={payment.transactionId} mono />
          </dl>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/bookings" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            View Bookings
          </Link>
          <Link href="/offers" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            View Offers
          </Link>
          <Link href="/properties" className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-200">
            Browse Properties
          </Link>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value, capitalize = false, mono = false }) {
  return (
    <div className="flex flex-col justify-between gap-1 sm:flex-row">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className={`${capitalize ? "capitalize" : ""} ${mono ? "break-all font-mono text-xs" : "font-semibold"} text-gray-900`}>
        {value}
      </dd>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="p-12 text-center">Checking payment…</main>}>
      <SuccessContent />
    </Suspense>
  );
}
