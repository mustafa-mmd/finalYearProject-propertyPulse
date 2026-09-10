"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = {
  PENDING: ["ACTIVATE", "CANCEL"],
  TRIALING: ["ACTIVATE", "PAUSE", "CANCEL"],
  ACTIVE: ["PAUSE", "CANCEL"],
  PAST_DUE: ["ACTIVATE", "PAUSE", "CANCEL"],
  PAUSED: ["RESUME", "CANCEL"],
};

export default function SubscriptionAdminActions({ subscriptionId, status, provider, canManage }) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const actions = ACTIONS[status] || [];

  async function update(action) {
    const reason = window.prompt("Enter the reason for this subscription action:");
    if (!reason || reason.trim().length < 10) return;
    setPending(action);
    setError("");
    try {
      const response = await fetch("/api/admin/subscriptions/" + subscriptionId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Subscription update failed.");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Subscription update failed.");
    } finally {
      setPending("");
    }
  }

  if (!canManage) return <span className="text-xs text-slate-400">View only</span>;
  if (!actions.length) return <span className="text-xs text-slate-400">No actions</span>;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button key={action} type="button" disabled={Boolean(pending)} onClick={() => update(action)} className={action === "CANCEL" ? "rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50" : "rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 disabled:opacity-50"}>
            {pending === action ? "Saving..." : action}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
