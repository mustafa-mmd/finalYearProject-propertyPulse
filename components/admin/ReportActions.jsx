"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportActions({ reportId, currentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [resolution, setResolution] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reports/" + reportId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Report update failed.");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Report update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[220px_1fr_auto] sm:items-end">
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Decision state
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
          {["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "DISMISSED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Resolution or investigation note
        <input value={resolution} onChange={(event) => setResolution(event.target.value)} maxLength={3000} placeholder="Required for final decisions" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm normal-case tracking-normal text-slate-900" />
      </label>
      <button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving..." : "Save"}</button>
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
    </form>
  );
}
