"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FaBell, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

export default function SaveSearchButton({ filters }) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(filters.q || "My property search");
  const [frequency, setFrequency] = useState("DAILY");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (status !== "authenticated") {
      toast.info("Sign in to save searches and receive alerts.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters, alerts: { enabled: true, newListings: true, priceDrops: true, channels: ["IN_APP", "EMAIL"], frequency } }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Search could not be saved");
      toast.success("Search saved. Alerts are now enabled.");
      setOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
        <FaBell aria-hidden="true" /> Save search
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-950">Create a property alert</h3>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><FaTimes /></button>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Search name
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Alert frequency
            <select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="IMMEDIATE">As soon as possible</option><option value="DAILY">Daily digest</option><option value="WEEKLY">Weekly digest</option>
            </select>
          </label>
          <p className="mt-3 text-xs text-slate-500">New listings and price reductions matching these filters will create an in-app alert. Email delivery follows your notification preferences.</p>
          <button type="button" disabled={saving || !name.trim()} onClick={save} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save and enable alerts"}</button>
        </div>
      )}
    </div>
  );
}
