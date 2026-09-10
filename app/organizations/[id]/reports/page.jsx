import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import Expense from "@/models/Expense";
import Invoice from "@/models/Invoice";
import Lease from "@/models/Lease";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import Property from "@/models/Property";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export default async function OrganizationReportsPage({ params }) {
  const actor = await getActor();
  const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}/reports`);
  const access = await getOrganizationAccess(id, actor);
  if (!access) notFound();
  if (!access.permissions.includes("*") && !access.permissions.includes("reports.read")) redirect(`/organizations/${id}`);
  const tenantId = new mongoose.Types.ObjectId(id);
  const [propertyCount, publishedCount, activeLeases, occupied, income, expenses, maintenance] = await Promise.all([
    Property.countDocuments({ tenantId, deletedAt: { $exists: false } }),
    Property.countDocuments({ tenantId, listingStatus: "PUBLISHED", deletedAt: { $exists: false } }),
    Lease.countDocuments({ tenantId, status: "ACTIVE" }),
    Lease.distinct("propertyId", { tenantId, status: "ACTIVE" }),
    Invoice.aggregate([{ $match: { tenantId, status: "PAID" } }, { $group: { _id: "$currency", total: { $sum: "$amountPaid" } } }]),
    Expense.aggregate([{ $match: { tenantId, status: { $in: ["APPROVED", "PAID"] } } }, { $group: { _id: "$currency", total: { $sum: "$amount" } } }]),
    MaintenanceRequest.aggregate([{ $match: { tenantId } }, { $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);
  const occupancyRate = propertyCount ? Math.round((occupied.length / propertyCount) * 1000) / 10 : 0;
  return <main className="min-h-screen bg-slate-50 py-10"><div className="mx-auto max-w-6xl px-4"><Link href={`/organizations/${id}/dashboard`} className="text-sm font-semibold text-blue-700">&larr; Operations dashboard</Link><div className="my-6"><h1 className="text-3xl font-bold">Portfolio reports</h1><p className="mt-2 text-slate-600">Live, tenant-scoped operating and financial summaries for {access.organization.name}.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Properties", propertyCount, `${publishedCount} published`], ["Active leases", activeLeases, `${occupied.length} occupied properties`], ["Occupancy", `${occupancyRate}%`, "Based on active leases"], ["Maintenance", maintenance.reduce((sum, row) => sum + row.count, 0), "All recorded requests"]].map(([label, value, detail]) => <article key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>)}</div><div className="mt-6 grid gap-5 md:grid-cols-3"><article className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Collected income</h2>{income.length ? income.map((row) => <p key={row._id} className="mt-3 text-2xl font-bold text-emerald-700">{row._id} {Number(row.total).toLocaleString()}</p>) : <p className="mt-3 text-sm text-slate-500">No paid invoices yet.</p>}</article><article className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Approved expenses</h2>{expenses.length ? expenses.map((row) => <p key={row._id} className="mt-3 text-2xl font-bold text-amber-700">{row._id} {Number(row.total).toLocaleString()}</p>) : <p className="mt-3 text-sm text-slate-500">No approved expenses yet.</p>}</article><article className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Maintenance by status</h2>{maintenance.length ? maintenance.map((row) => <div key={row._id} className="mt-3 flex justify-between text-sm"><span>{row._id.replaceAll("_", " ")}</span><strong>{row.count}</strong></div>) : <p className="mt-3 text-sm text-slate-500">No maintenance activity yet.</p>}</article></div></div></main>;
}
