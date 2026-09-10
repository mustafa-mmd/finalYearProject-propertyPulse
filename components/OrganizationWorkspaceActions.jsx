"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationWorkspaceActions({ organizationId, canInvite, canManageBranches }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function post(path, form) {
    setMessage("");
    setError("");
    const data = Object.fromEntries(new FormData(form));
    if (data.roles) data.roles = [data.roles];
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "Request failed");
    return payload.data;
  }

  async function invite(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    try {
      const data = await post(`/api/organizations/${organizationId}/members`, formElement);
      const link = `${window.location.origin}${data.invitationPath}`;
      await navigator.clipboard?.writeText(link);
      setMessage(`Invitation created and link copied: ${link}`);
      formElement.reset();
    } catch (err) { setError(err.message); }
  }

  async function branch(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    try {
      await post(`/api/organizations/${organizationId}/branches`, formElement);
      setMessage("Branch created successfully.");
      formElement.reset();
      router.refresh();
    } catch (err) { setError(err.message); }
  }

  if (!canInvite && !canManageBranches) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {canInvite && <form onSubmit={invite} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Invite team member</h2>
        <input name="email" type="email" required placeholder="team@example.com" className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3" />
        <select name="roles" className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3">
          <option value="AGENT">Agent</option><option value="PROPERTY_MANAGER">Property manager</option><option value="ACCOUNTANT">Accountant</option><option value="MAINTENANCE_COORDINATOR">Maintenance coordinator</option><option value="STAFF">Staff</option><option value="VIEWER">Viewer</option>
        </select>
        <button className="mt-3 rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white">Create invitation</button>
      </form>}
      {canManageBranches && <form onSubmit={branch} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Add branch</h2>
        <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
          <input name="name" required placeholder="Branch name" className="rounded-xl border border-slate-300 px-4 py-3" />
          <input name="code" required placeholder="Code" className="rounded-xl border border-slate-300 px-4 py-3 uppercase" />
        </div>
        <input name="email" type="email" placeholder="Branch email (optional)" className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3" />
        <button className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white">Add branch</button>
      </form>}
      {message && <p className="lg:col-span-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="lg:col-span-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}
