"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FraudCaseActions({ caseId, currentAction = "NONE" }) {
  const router = useRouter();
  const [action, setAction] = useState(currentAction === "NONE" ? "ESCALATE" : currentAction);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function decide(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/fraud-cases/" + caseId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Decision failed.");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Decision failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={decide} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Human decision
        <select value={action} onChange={(event) => setAction(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
          {["CLEAR", "RESTRICT", "SUSPEND", "ESCALATE"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Evidence-based reason
        <input required minLength={10} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="At least 10 characters" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm normal-case tracking-normal text-slate-900" />
      </label>
      <button disabled={pending} className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving..." : "Record decision"}</button>
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
    </form>
  );
}
