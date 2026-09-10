"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ErrorStatusActions({ errorId, currentStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function update(status) {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/errors/${errorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "OPEN" && (
        <button disabled={pending} onClick={() => update("ACKNOWLEDGED")} className="rounded-lg border px-3 py-1 text-xs font-semibold">
          Acknowledge
        </button>
      )}
      {currentStatus !== "RESOLVED" && (
        <button disabled={pending} onClick={() => update("RESOLVED")} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          Resolve
        </button>
      )}
      {currentStatus !== "IGNORED" && (
        <button disabled={pending} onClick={() => update("IGNORED")} className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold text-white">
          Ignore
        </button>
      )}
    </div>
  );
}
