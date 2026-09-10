"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Could not create organization");
      router.push(`/organizations/${payload.data.organization._id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-slate-700">Organization name
        <input name="name" required minLength={2} maxLength={150} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Business type
        <select name="type" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">
          <option value="LANDLORD_BUSINESS">Landlord business</option>
          <option value="AGENCY">Real-estate agency</option>
          <option value="PROPERTY_MANAGEMENT_COMPANY">Property management company</option>
          <option value="DEVELOPER">Property developer</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">Contact email
          <input name="email" type="email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Phone
          <input name="phone" maxLength={30} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-slate-700">Currency
          <input name="currency" defaultValue="ZAR" pattern="[A-Z]{3}" maxLength={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase" />
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Timezone
          <input name="timezone" defaultValue="UTC" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Creating…" : "Create organization"}</button>
    </form>
  );
}
