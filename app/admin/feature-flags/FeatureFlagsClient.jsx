"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeatureFlagsClient({ initialFlags, ROLES }) {
  const router = useRouter();
  const [flags, setFlags] = useState(initialFlags);
  const [showModal, setShowModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    key: "",
    description: "",
    enabled: false,
    rolloutPercentage: 0,
    allowedRoles: [],
    allowedTenantIds: "",
  });

  function openCreate() {
    setEditingFlag(null);
    setFormData({
      key: "",
      description: "",
      enabled: false,
      rolloutPercentage: 0,
      allowedRoles: [],
      allowedTenantIds: "",
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEdit(flag) {
    setEditingFlag(flag);
    setFormData({
      key: flag.key,
      description: flag.description || "",
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage || 0,
      allowedRoles: flag.allowedRoles || [],
      allowedTenantIds: (flag.allowedTenantIds || []).join(", "),
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  async function toggleFlag(flag) {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...flag,
          enabled: !flag.enabled,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to update flag");

      setSuccess(`Flag ${flag.key} toggled successfully!`);
      // Update local state
      setFlags(flags.map((f) => (f.key === flag.key ? payload.data.flag : f)));
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ...formData,
      allowedTenantIds: formData.allowedTenantIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length === 24),
    };

    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to save feature flag");

      setSuccess(`Feature flag ${payload.key} saved successfully!`);
      if (editingFlag) {
        setFlags(flags.map((f) => (f.key === payload.key ? data.data.flag : f)));
      } else {
        setFlags([...flags, data.data.flag].sort((a, b) => a.key.localeCompare(b.key)));
      }

      setShowModal(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRoleToggle(role) {
    setFormData((prev) => {
      const allowedRoles = prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role];
      return { ...prev, allowedRoles };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Platform Settings</p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Feature Flags</h2>
          <p className="mt-2 text-slate-600">
            Control progressive rollouts, feature toggles, and tenant/role-specific permissions.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          + Create Feature Flag
        </button>
      </div>

      {success && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="pp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="pp-table">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs">
                <th>Key</th>
                <th>Description</th>
                <th>Rollout %</th>
                <th>Target Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No feature flags defined yet.
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag._id?.toString() || flag.key} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <p className="font-mono text-sm font-bold text-slate-900">{flag.key}</p>
                    </td>
                    <td>
                      <p className="text-slate-600 text-sm max-w-sm truncate">{flag.description || "No description"}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{flag.rolloutPercentage || 0}%</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${flag.rolloutPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(flag.allowedRoles || []).length === 0 ? (
                          <span className="text-xs text-slate-400">All Roles</span>
                        ) : (
                          flag.allowedRoles.map((role) => (
                            <span key={role} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleFlag(flag)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          flag.enabled ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            flag.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => openEdit(flag)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingFlag ? "Configure Feature Flag" : "New Feature Flag"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Flag Key</label>
                <input
                  name="key"
                  type="text"
                  required
                  disabled={!!editingFlag}
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g. listings.auto_approve"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this feature flag controls..."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows="3"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Status</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.enabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-slate-700">
                      {formData.enabled ? "Globally Enabled" : "Globally Disabled"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Rollout Percentage ({formData.rolloutPercentage}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.rolloutPercentage}
                    onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Restrict to Roles</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      {role}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-400">If no roles are selected, this flag applies to all users.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Restrict to Organization IDs</label>
                <input
                  name="allowedTenantIds"
                  type="text"
                  value={formData.allowedTenantIds}
                  onChange={(e) => setFormData({ ...formData, allowedTenantIds: e.target.value })}
                  placeholder="Comma-separated MongoDB ObjectIds (e.g. 64b8f...)"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">Restricts feature visibility to specific workspaces.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Saving..." : "Save Feature Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
