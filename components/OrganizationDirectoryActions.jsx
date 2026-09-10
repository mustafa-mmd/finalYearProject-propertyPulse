"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function requestJson(path, method, body) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Request failed");
  return payload.data;
}

export function MemberManagementActions({
  organizationId,
  memberId,
  role,
  status,
  canUpdate,
  canRemove,
  protectedMember,
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (protectedMember || (!canUpdate && !canRemove)) return null;

  async function update(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      await requestJson(`/api/organizations/${organizationId}/members`, "PATCH", {
        memberId,
        roles: [data.role],
        status: data.status,
      });
      router.refresh();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this member from the organization?")) return;
    setPending(true);
    try {
      await requestJson(`/api/organizations/${organizationId}/members`, "DELETE", { memberId });
      router.refresh();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      {canUpdate && (
        <form onSubmit={update} className="flex flex-wrap gap-2">
          <select name="role" defaultValue={role} className="rounded-lg border px-2 py-1 text-xs">
            {["ADMIN", "AGENT", "PROPERTY_MANAGER", "ACCOUNTANT", "MAINTENANCE_COORDINATOR", "STAFF", "VIEWER"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="rounded-lg border px-2 py-1 text-xs">
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
          </select>
          <button disabled={pending} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            Save
          </button>
        </form>
      )}
      {canRemove && (
        <button type="button" disabled={pending} onClick={remove} className="mt-2 text-xs font-semibold text-red-700">
          Remove member
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function BranchManagementActions({ organizationId, branch, canManage }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  if (!canManage) return null;

  async function update(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      await requestJson(`/api/organizations/${organizationId}/branches`, "PATCH", {
        branchId: branch.id,
        ...data,
      });
      setEditing(false);
      router.refresh();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    if (!window.confirm("Archive this branch? Members will be unassigned from it.")) return;
    setPending(true);
    try {
      await requestJson(`/api/organizations/${organizationId}/branches`, "DELETE", {
        branchId: branch.id,
      });
      router.refresh();
    } catch (archiveError) {
      setError(archiveError.message);
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-2 flex gap-3 text-xs font-semibold">
        <button type="button" onClick={() => setEditing(true)} className="text-blue-700">Edit</button>
        <button type="button" disabled={pending} onClick={archive} className="text-red-700">Archive</button>
        {error && <span className="text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <form onSubmit={update} className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3">
      <input name="name" defaultValue={branch.name} required className="rounded-lg border px-2 py-1 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input name="code" defaultValue={branch.code} required className="rounded-lg border px-2 py-1 text-sm" />
        <select name="status" defaultValue={branch.status} className="rounded-lg border px-2 py-1 text-sm">
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
      </div>
      <input name="email" type="email" defaultValue={branch.email} placeholder="Branch email" className="rounded-lg border px-2 py-1 text-sm" />
      <div className="flex gap-2">
        <button disabled={pending} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs font-semibold">Cancel</button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </form>
  );
}

export function InvitationRevokeButton({ organizationId, invitationId }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function revoke() {
    setPending(true);
    try {
      await requestJson(`/api/organizations/${organizationId}/members`, "DELETE", { invitationId });
      router.refresh();
    } finally {
      setPending(false);
    }
  }
  return <button disabled={pending} onClick={revoke} className="text-xs font-semibold text-red-700">Revoke</button>;
}
