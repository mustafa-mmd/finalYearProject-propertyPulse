"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Media request failed");
  return payload.data;
}

export default function PropertyMediaManager({ propertyId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/prop/${propertyId}/media`, { cache: "no-store" });
      const data = await parseResponse(response);
      setItems(data.items);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function upload(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/prop/${propertyId}/media`, {
        method: "POST",
        body: new FormData(formElement),
      });
      await parseResponse(response);
      formElement.reset();
      setMessage("Media uploaded. Save the final order and captions when ready.");
      await load();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setPending(false);
    }
  }

  async function addLink(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(formElement));
      const response = await fetch(`/api/prop/${propertyId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await parseResponse(response);
      formElement.reset();
      setMessage("Media link added.");
      await load();
    } catch (linkError) {
      setError(linkError.message);
    } finally {
      setPending(false);
    }
  }

  async function save() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/prop/${propertyId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      await parseResponse(response);
      setMessage("Media order, cover and captions saved.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setPending(false);
    }
  }

  async function remove(mediaId) {
    if (!window.confirm("Delete this media item?")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/prop/${propertyId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      await parseResponse(response);
      await load();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="mt-6 text-sm text-slate-500">Loading listing media...</p>;

  return (
    <section className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold">Professional media</h2>
      <p className="mt-1 text-sm text-slate-600">Upload images, video or a brochure; choose the cover, captions and display order.</p>
      <form onSubmit={upload} className="mt-5 rounded-2xl bg-slate-50 p-4">
        <input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,application/pdf" required />
        <input name="caption" placeholder="Optional caption" className="mt-3 w-full rounded-lg border px-3 py-2" />
        <button disabled={pending} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Upload files</button>
      </form>
      <form onSubmit={addLink} className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[160px_1fr_1fr_auto]">
        <select name="type" className="rounded-lg border px-3 py-2"><option>VIDEO</option><option>VIRTUAL_TOUR</option><option>FLOOR_PLAN</option><option>BROCHURE</option></select>
        <input name="url" type="url" required placeholder="https://..." className="rounded-lg border px-3 py-2" />
        <input name="caption" placeholder="Caption" className="rounded-lg border px-3 py-2" />
        <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Add link</button>
      </form>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <article key={item.id} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
            {item.type === "IMAGE" ? (
              <Image src={item.url} alt={item.caption || "Property media"} width={120} height={80} className="h-20 w-30 rounded-lg object-cover" />
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 p-3 text-center text-xs font-bold text-blue-700">{item.type.replaceAll("_", " ")}</a>
            )}
            <div>
              <input
                value={item.caption}
                onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, caption: event.target.value } : entry))}
                placeholder="Caption"
                className="w-full rounded-lg border px-3 py-2"
              />
              {item.type === "IMAGE" && (
                <label className="mt-2 flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="radio"
                    name="cover"
                    checked={item.isCover}
                    onChange={() => setItems((current) => current.map((entry) => ({ ...entry, isCover: entry.id === item.id })))}
                  />
                  Cover image
                </label>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || pending} className="rounded-lg border px-2 py-1">Up</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1 || pending} className="rounded-lg border px-2 py-1">Down</button>
              <button type="button" onClick={() => remove(item.id)} disabled={pending} className="rounded-lg border border-red-200 px-2 py-1 text-red-700">Delete</button>
            </div>
          </article>
        ))}
        {!items.length && <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">No media uploaded.</p>}
      </div>
      {items.length > 0 && <button type="button" onClick={save} disabled={pending} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">Save media arrangement</button>}
      {message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
