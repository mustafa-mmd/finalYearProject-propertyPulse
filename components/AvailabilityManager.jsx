"use client";

import { useCallback, useEffect, useState } from "react";

export default function AvailabilityManager({ properties }) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [data, setData] = useState({ blocks: [], bookedDates: [] });
  const [error, setError] = useState("");

  const load = useCallback(async (selected = propertyId) => {
    if (!selected) return;
    const response = await fetch(`/api/availability?propertyId=${encodeURIComponent(selected)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "Could not load availability");
    setData(payload.data);
  }, [propertyId]);

  useEffect(() => {
    void load(propertyId).catch((loadError) => setError(loadError.message));
  }, [load, propertyId]);

  async function create(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    const body = { ...Object.fromEntries(new FormData(formElement)), propertyId };
    const response = await fetch("/api/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error?.message || "Could not block dates");
    formElement.reset();
    await load();
  }

  async function remove(blockId) {
    const response = await fetch("/api/availability", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockId }) });
    if (response.ok) await load();
  }

  if (!properties.length) return <p className="rounded-2xl border border-dashed p-8 text-slate-500">Create a short-term rental listing before managing availability.</p>;

  return (
    <div>
      <label className="block font-semibold">Property
        <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3">
          {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
        </select>
      </label>
      <form onSubmit={create} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">Start date<input name="startDate" type="date" required className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        <label className="text-sm font-semibold">End date<input name="endDate" type="date" required className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        <select name="type" className="rounded-lg border px-3 py-2"><option>OWNER_BLOCK</option><option>MAINTENANCE</option><option>EXTERNAL_BOOKING</option></select>
        <input name="reason" placeholder="Reason" className="rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white md:col-span-2">Block date range</button>
      </form>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-3">
        {data.blocks.map((block) => (
          <div key={block.id} className="flex items-center justify-between rounded-xl border p-4">
            <div><p className="font-semibold">{block.type.replaceAll("_", " ")}</p><p className="text-sm text-slate-500">{new Date(block.startDate).toLocaleDateString()} - {new Date(block.endDate).toLocaleDateString()}</p><p className="text-xs text-slate-500">{block.reason}</p></div>
            <button onClick={() => remove(block.id)} className="text-sm font-semibold text-red-700">Remove</button>
          </div>
        ))}
        <p className="text-sm text-slate-500">{data.bookedDates.length} booked or temporarily held nights in the visible inventory window.</p>
      </div>
    </div>
  );
}
