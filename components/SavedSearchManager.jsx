"use client";

import { useState } from "react";
import Link from "next/link";
import { buildSearchParams } from "@/utils/searchFilters";
import { toast } from "react-toastify";

export default function SavedSearchManager({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const update = async (item, changes) => {
    const response = await fetch("/api/saved-searches", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id, ...changes }) });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.error?.message || "Could not update search");
    setItems((current) => current.map((entry) => entry._id === item._id ? payload.data : entry));
    toast.success("Alert preferences updated");
  };
  const remove = async (item) => {
    const response = await fetch(`/api/saved-searches?id=${encodeURIComponent(item._id)}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Could not remove search");
    setItems((current) => current.filter((entry) => entry._id !== item._id));
  };
  if (!items.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-bold">No saved searches yet</h2><p className="mt-2 text-slate-600">Run a property search, then select “Save search” to receive matching alerts.</p><Link href="/properties" className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Search properties</Link></div>;
  return <div className="grid gap-4">{items.map((item) => {
    const href = `/properties/search-results?${buildSearchParams(item.filters).toString()}`;
    return <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{item.alerts?.frequency?.toLowerCase()} alerts · {item.alerts?.enabled ? "active" : "paused"}</p></div><div className="flex flex-wrap gap-2"><Link href={href} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">View results</Link><button type="button" onClick={() => update(item, { alerts: { ...item.alerts, enabled: !item.alerts?.enabled } })} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">{item.alerts?.enabled ? "Pause alerts" : "Enable alerts"}</button><button type="button" onClick={() => remove(item)} className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700">Delete</button></div></div></article>;
  })}</div>;
}
