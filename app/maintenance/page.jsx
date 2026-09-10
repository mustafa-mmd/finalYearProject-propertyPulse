import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import OrganizationMember from "@/models/OrganizationMember";
import MaintenanceStatusAction from "@/components/MaintenanceStatusAction";
import { organizationPermissions } from "@/config/organizations";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance", description: "Track and manage property maintenance requests." };
const priorityStyles = { LOW: "bg-slate-100 text-slate-600", NORMAL: "bg-amber-100 text-amber-800", HIGH: "bg-orange-100 text-orange-800", EMERGENCY: "bg-red-200 text-red-900" };
const closedStatuses = ["CLOSED", "CANCELLED"];

export default async function MaintenancePage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/maintenance");
  await connectDB();
  const memberships = await OrganizationMember.find({ userId: actor.id, status: "ACTIVE" }).select("organizationId roles customPermissions").lean();
  const readableTenants = memberships.filter((item) => organizationPermissions(item.roles, item.customPermissions).includes("maintenance.read")).map((item) => item.organizationId);
  const manageableTenants = new Set(memberships.filter((item) => organizationPermissions(item.roles, item.customPermissions).includes("maintenance.manage")).map((item) => item.organizationId.toString()));
  const requests = await MaintenanceRequest.find({ $or: [{ requesterId: actor.id }, { ownerId: actor.id }, { assignedTo: actor.id }, { tenantId: { $in: readableTenants } }], deletedAt: { $exists: false } }).populate("propertyId", "name listingReference").populate("requesterId", "name email").sort({ createdAt: -1 }).lean();
  const active = requests.filter((item) => !closedStatuses.includes(item.status));
  const closed = requests.filter((item) => closedStatuses.includes(item.status));
  function card(item) {
    const canManage = item.ownerId?.toString() === actor.id || item.assignedTo?.toString() === actor.id || manageableTenants.has(item.tenantId?.toString()) || actor.permissions.includes("*");
    return <article key={item._id.toString()} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityStyles[item.priority] || priorityStyles.NORMAL}`}>{item.priority}</span></div><p className="mt-1 text-sm text-slate-600">{item.propertyId?.name || "Property"}{item.propertyId?.listingReference ? ` (${item.propertyId.listingReference})` : ""}</p><p className="mt-2 max-w-2xl text-sm text-slate-600">{item.description}</p><p className="mt-2 text-xs text-slate-400">{item.category.replaceAll("_", " ")} · Reported by {item.requesterId?.name || item.requesterId?.email || "user"} · {new Date(item.createdAt).toLocaleDateString()}</p></div><div className="flex shrink-0 flex-col items-start gap-2 sm:items-end"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{item.status.replaceAll("_", " ")}</span>{canManage && <MaintenanceStatusAction id={item._id.toString()} status={item.status} />}</div></div></article>;
  }
  return <main className="min-h-screen bg-slate-50 py-12"><div className="mx-auto max-w-5xl px-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Property operations</p><h1 className="mt-2 text-3xl font-bold">Maintenance requests</h1><p className="mt-2 text-slate-600">Report, assign and resolve property issues with an auditable status workflow.</p></div><Link href="/maintenance/new" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Submit request</Link></div>{!requests.length && <div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">No maintenance requests</p><p className="mt-2 text-sm text-slate-500">New requests from your properties and organizations appear here.</p></div>}{active.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Active ({active.length})</h2>{active.map(card)}</section>}{closed.length > 0 && <section className="mt-10 space-y-4 opacity-80"><h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Closed ({closed.length})</h2>{closed.map(card)}</section>}</div></main>;
}
