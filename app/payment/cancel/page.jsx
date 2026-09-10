"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CancelContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("tid");
  const propertyId = searchParams.get("propertyId");

  return (
    <main className="flex min-h-screen items-center justify-center bg-red-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl text-red-700" aria-hidden="true">
          ×
        </div>
        <h1 className="mt-5 text-3xl font-bold text-gray-900">Checkout cancelled</h1>
        <p className="mt-3 text-gray-600">
          No payment is assumed from this browser return. The final status is controlled only by PayFast&apos;s secure notification.
        </p>

        {transactionId && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment reference</p>
            <p className="mt-1 break-all font-mono text-sm text-gray-800">{transactionId}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {propertyId && (
            <Link href={`/payment?propertyId=${encodeURIComponent(propertyId)}`} className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700">
              Try again
            </Link>
          )}
          <Link href="/properties" className="rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-800 hover:bg-gray-200">
            Browse properties
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<main className="p-12 text-center">Loading…</main>}>
      <CancelContent />
    </Suspense>
  );
}
