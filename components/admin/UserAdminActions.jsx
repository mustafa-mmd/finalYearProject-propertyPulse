"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AVAILABLE_ROLES = [
  "USER",
  "RENTER",
  "BUYER",
  "TENANT",
  "PROPERTY_OWNER",
  "LANDLORD",
  "AGENT",
  "AGENCY_OWNER",
  "AGENCY_ADMIN",
  "PROPERTY_MANAGER",
  "SUPPORT_ADMIN",
  "LISTING_MODERATOR",
  "VERIFICATION_ADMIN",
  "FRAUD_ANALYST",
  "FINANCE_ADMIN",
  "SUBSCRIPTION_ADMIN",
  "SUPER_ADMIN",
];

export default function UserAdminActions({ userId, status, canSuspend, canBan, canManageRoles = true, currentRoles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState(currentRoles);

  async function update(action, customBody = {}) {
    let reason = "Admin update";
    if (action !== "RESTORE" && action !== "SET_ROLES") {
      const input = window.prompt("Enter the account-action reason:");
      if (!input || input.trim().length < 10) return;
      reason = input.trim();
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, ...customBody }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Account action failed");

      toast.success(`User updated successfully (${action})`);
      setShowRoleModal(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const saveRoles = () => {
    if (!selectedRoles.length) {
      toast.error("Please select at least one role");
      return;
    }
    update("SET_ROLES", { roles: selectedRoles });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" ? (
          <>
            {canSuspend && (
              <button
                type="button"
                disabled={loading}
                onClick={() => update("SUSPEND")}
                className="rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                Suspend
              </button>
            )}
            {canBan && (
              <button
                type="button"
                disabled={loading}
                onClick={() => update("BAN")}
                className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Ban
              </button>
            )}
          </>
        ) : canSuspend ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => update("RESTORE")}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Restore
          </button>
        ) : null}

        {canManageRoles && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowRoleModal(true)}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Manage Roles
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Roles Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage User Roles</h3>
            <p className="text-xs text-slate-500 mb-4">Select the roles to assign to this account.</p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-3 mb-5">
              {AVAILABLE_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={saveRoles}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Roles"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
