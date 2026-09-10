"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
const buttonClass = "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

function FormMessage({ error }) {
  return error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null;
}

function Badge({ children }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{String(children || "").replaceAll("_", " ")}</span>;
}

export default function PropertyManagementConsole({ organizationId, data, canManage, canManageFinance }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function request(resource, method, body, key) {
    setBusy(key);
    setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/${resource}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "The operation could not be completed");
      router.refresh();
      return true;
    } catch (exception) {
      setError(exception.message);
      return false;
    } finally {
      setBusy("");
    }
  }

  function submit(resource, key, transform = (values) => values) {
    return async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const succeeded = await request(resource, "POST", transform(Object.fromEntries(new FormData(form))), key);
      if (succeeded) form.reset();
    };
  }

  const nextWorkOrderStatus = { DRAFT: "ISSUED", ISSUED: "ACCEPTED", ACCEPTED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };
  const nextInspectionStatus = { SCHEDULED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };

  return (
    <div className="space-y-8">
      <FormMessage error={error} />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Buildings</h2>
          {canManage && <form onSubmit={submit("buildings", "building")} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Building name" className={fieldClass} />
            <input name="reference" required placeholder="Reference (for example HQ-01)" className={fieldClass} />
            <input name="formattedAddress" placeholder="Formatted address" className={`${fieldClass} sm:col-span-2`} />
            <input name="city" placeholder="City" className={fieldClass} />
            <input name="country" placeholder="Country" className={fieldClass} />
            <button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "building" ? "Adding..." : "Add building"}</button>
          </form>}
          <div className="mt-4 space-y-2">
            {data.buildings.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-slate-500">{item.reference} · {item.address || "No address"}</p></div><div className="flex items-center gap-2"><Badge>{item.status}</Badge>{canManage && item.status === "ACTIVE" && <button onClick={() => request("buildings", "PATCH", { buildingId: item.id, status: "INACTIVE" }, `building-${item.id}`)} className="text-xs font-semibold text-amber-700">Deactivate</button>}</div></div>)}
            {!data.buildings.length && <p className="text-sm text-slate-500">No buildings yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Units</h2>
          {canManage && <form onSubmit={submit("units", "unit")} className="mt-4 grid gap-3 sm:grid-cols-2">
            <select name="buildingId" required className={fieldClass}><option value="">Choose building</option>{data.buildings.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <input name="unitNumber" required placeholder="Unit number" className={fieldClass} />
            <select name="propertyId" className={fieldClass}><option value="">No linked listing</option>{data.properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <input name="floor" placeholder="Floor" className={fieldClass} />
            <input name="bedrooms" type="number" min="0" placeholder="Bedrooms" className={fieldClass} />
            <input name="bathrooms" type="number" min="0" step="0.5" placeholder="Bathrooms" className={fieldClass} />
            <button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "unit" ? "Adding..." : "Add unit"}</button>
          </form>}
          <div className="mt-4 space-y-2">{data.units.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{item.building} / {item.unitNumber}</p><p className="text-xs text-slate-500">{item.property || "Not linked to a listing"}</p></div><select aria-label={`Status for unit ${item.unitNumber}`} disabled={!canManage || Boolean(busy)} value={item.status} onChange={(event) => request("units", "PATCH", { unitId: item.id, status: event.target.value }, `unit-${item.id}`)} className="rounded-lg border px-2 py-1 text-xs"><option>VACANT</option><option>OCCUPIED</option><option>MAINTENANCE</option><option>INACTIVE</option></select></div>)}</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Vendors</h2>
          {canManage && <form onSubmit={submit("vendors", "vendor")} className="mt-4 grid gap-3 sm:grid-cols-2"><input name="name" required placeholder="Vendor name" className={fieldClass} /><input name="email" type="email" placeholder="Email" className={fieldClass} /><input name="phone" placeholder="Phone" className={fieldClass} /><input name="categories" placeholder="Categories, comma separated" className={fieldClass} /><button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "vendor" ? "Adding..." : "Add vendor"}</button></form>}
          <div className="mt-4 space-y-2">{data.vendors.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-slate-500">{item.categories.join(", ") || "General"}</p></div><div className="flex gap-2"><Badge>{item.verificationStatus}</Badge>{canManage && <select aria-label={`Status for vendor ${item.name}`} value={item.status} onChange={(event) => request("vendors", "PATCH", { vendorId: item.id, status: event.target.value }, `vendor-${item.id}`)} className="rounded-lg border px-2 py-1 text-xs"><option>ACTIVE</option><option>INACTIVE</option><option>BLOCKED</option></select>}</div></div>)}</div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Work orders</h2>
          {canManage && <form onSubmit={submit("work-orders", "work-order")} className="mt-4 grid gap-3 sm:grid-cols-2"><select name="maintenanceRequestId" required className={`${fieldClass} sm:col-span-2`}><option value="">Choose maintenance request</option>{data.maintenance.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.priority})</option>)}</select><select name="vendorId" className={fieldClass}><option value="">No vendor</option>{data.vendors.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="assigneeId" className={fieldClass}><option value="">No team assignee</option>{data.members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><textarea name="scope" required minLength="10" placeholder="Work scope" className={`${fieldClass} sm:col-span-2`} /><input name="scheduledFor" type="datetime-local" className={fieldClass} /><input name="estimate" type="number" min="0" step="0.01" placeholder="Estimate" className={fieldClass} /><button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "work-order" ? "Creating..." : "Create work order"}</button></form>}
          <div className="mt-4 space-y-2">{data.workOrders.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><div><p className="font-semibold">{item.request}</p><p className="text-xs text-slate-500">{item.vendor || item.assignee || "Unassigned"} · {item.currency} {item.estimate.toLocaleString()}</p></div><Badge>{item.status}</Badge></div>{canManage && nextWorkOrderStatus[item.status] && <button disabled={Boolean(busy)} onClick={() => request("work-orders", "PATCH", { workOrderId: item.id, status: nextWorkOrderStatus[item.status] }, `wo-${item.id}`)} className="mt-2 text-xs font-bold text-blue-700">Move to {nextWorkOrderStatus[item.status].replaceAll("_", " ")}</button>}</div>)}</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Inspections</h2>
          {canManage && <form onSubmit={submit("inspections", "inspection")} className="mt-4 grid gap-3 sm:grid-cols-2"><select name="propertyId" required className={fieldClass}><option value="">Choose property</option>{data.properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="inspectorId" required className={fieldClass}><option value="">Choose inspector</option>{data.members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="type" className={fieldClass}><option>ROUTINE</option><option>MOVE_IN</option><option>MOVE_OUT</option><option>SAFETY</option><option>SALE</option></select><input name="scheduledAt" required type="datetime-local" className={fieldClass} /><button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "inspection" ? "Scheduling..." : "Schedule inspection"}</button></form>}
          <div className="mt-4 space-y-2">{data.inspections.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{item.property} · {item.type.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{item.inspector} · {new Date(item.scheduledAt).toLocaleString()}</p></div><div className="text-right"><Badge>{item.status}</Badge>{canManage && nextInspectionStatus[item.status] && <button onClick={() => request("inspections", "PATCH", { inspectionId: item.id, status: nextInspectionStatus[item.status] }, `inspection-${item.id}`)} className="mt-2 block text-xs font-bold text-blue-700">Start / complete</button>}</div></div>)}</div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Expenses</h2>
          {!canManageFinance && <p className="mt-3 text-sm text-slate-500">Finance permission is required to view and manage expenses.</p>}
          {canManageFinance && <><form onSubmit={submit("expenses", "expense")} className="mt-4 grid gap-3 sm:grid-cols-2"><select name="propertyId" required className={fieldClass}><option value="">Choose property</option>{data.properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="category" required placeholder="Category" className={fieldClass} /><input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" className={fieldClass} /><input name="currency" defaultValue="ZAR" maxLength="3" className={fieldClass} /><textarea name="description" required placeholder="Description" className={`${fieldClass} sm:col-span-2`} /><button disabled={Boolean(busy)} className={`${buttonClass} sm:col-span-2`}>{busy === "expense" ? "Submitting..." : "Submit expense"}</button></form><div className="mt-4 space-y-2">{data.expenses.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{item.category} · {item.currency} {item.amount.toLocaleString()}</p><p className="text-xs text-slate-500">{item.property}</p></div><div className="text-right"><Badge>{item.status}</Badge>{item.status === "PENDING_APPROVAL" && <button onClick={() => request("expenses", "PATCH", { expenseId: item.id, status: "APPROVED" }, `expense-${item.id}`)} className="mt-2 block text-xs font-bold text-emerald-700">Approve</button>}{item.status === "APPROVED" && <button onClick={() => request("expenses", "PATCH", { expenseId: item.id, status: "PAID" }, `expense-${item.id}`)} className="mt-2 block text-xs font-bold text-blue-700">Mark paid</button>}</div></div>)}</div></>}
        </div>
      </section>
    </div>
  );
}
