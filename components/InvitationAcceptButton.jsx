"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitationAcceptButton({ token }) {
  const router = useRouter();
  const [state, setState] = useState({ loading: false, error: "" });
  async function accept() {
    setState({ loading: true, error: "" });
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Could not accept invitation");
      router.push(`/organizations/${payload.data.organizationId}`);
      router.refresh();
    } catch (error) { setState({ loading: false, error: error.message }); }
  }
  return <div><button onClick={accept} disabled={state.loading} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{state.loading ? "Accepting…" : "Accept invitation"}</button>{state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}</div>;
}
