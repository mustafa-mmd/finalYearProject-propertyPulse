"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DocumentManager from "@/components/DocumentManager";
export default function OfferActions({ offer, canRespond, canWithdraw, propertyId }) {
  const router = useRouter();
  const [countering, setCountering] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function action(body, key) {
    setBusy(key);
    setError("");
    const response = await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error?.message || "Offer action failed");
      setBusy("");
      return false;
    }
    router.refresh();
    setBusy("");
    return true;
  }

  async function counter(event) {
    event.preventDefault();
    if (await action({ action: "counter", ...Object.fromEntries(new FormData(event.currentTarget)) }, "counter")) {
      setCountering(false);
    }
  }

  const isInactive = ["WITHDRAWN", "REJECTED", "EXPIRED"].includes(offer.status);

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {canRespond && (
          <>
            <button disabled={Boolean(busy)} onClick={() => action({ action: "accept" }, "accept")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Accept</button>
            <button disabled={Boolean(busy)} onClick={() => setCountering((value) => !value)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">Counter</button>
            <button disabled={Boolean(busy)} onClick={() => action({ action: "reject", reason: "Declined by recipient" }, "reject")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
          </>
        )}
        {canWithdraw && (
          <button disabled={Boolean(busy)} onClick={() => action({ action: "withdraw" }, "withdraw")} className="rounded-lg border px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50">Withdraw</button>
        )}
        {isInactive && (
          <button disabled={Boolean(busy)} onClick={() => action({ action: "delete" }, "delete")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {busy === "delete" ? "Removing..." : "Remove"}
          </button>
        )}
        <Link href={`/properties/${propertyId}`} className="rounded-lg border px-3 py-2 text-xs font-bold hover:bg-slate-50">View property</Link>
      </div>
      {countering && (
        <form onSubmit={counter} className="mt-3 grid gap-2 rounded-xl bg-blue-50 p-3 sm:grid-cols-3">
          <input name="amount" required type="number" min="1" step="0.01" defaultValue={offer.amount} placeholder="Counter amount" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="depositAmount" type="number" min="0" step="0.01" defaultValue={offer.depositAmount} placeholder="Deposit" className="rounded-lg border px-3 py-2 text-sm" />
          <button disabled={Boolean(busy)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Submit counteroffer</button>
          <textarea name="message" placeholder="Counteroffer note (optional)" className="rounded-lg border px-3 py-2 text-sm sm:col-span-3" />
        </form>
      )}
      <DocumentManager entityType="OFFER" entityId={offer.id} />
    </div>
  );
}
