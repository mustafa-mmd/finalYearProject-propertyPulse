"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupportTicketActions({ ticketId, currentStatus, currentPriority }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/support/" + ticketId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, message }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Ticket update failed.");
      setMessage("");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Ticket update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 rounded-xl bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
            {["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
            {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Internal note
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} rows={2} placeholder="Optional operational note..." className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900" />
      </label>
      <div className="mt-3 flex items-center justify-between gap-3">
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : <span />}
        <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving..." : "Save ticket"}</button>
      </div>
    </form>
  );
}
