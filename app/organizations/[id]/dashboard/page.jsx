import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Booking from "@/models/Booking";
import Branch from "@/models/Branch";
import Invoice from "@/models/Invoice";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import OrganizationMember from "@/models/OrganizationMember";
import Property from "@/models/Property";
import RentalApplication from "@/models/RentalApplication";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export default async function OrganizationDashboardPage({ params }) {
  const actor = await getActor();
  const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}/dashboard`);
  const access = await getOrganizationAccess(id, actor);
  if (!access) notFound();

  const [
    listings,
    published,
    members,
    branches,
    bookings,
    applications,
    maintenance,
    outstandingInvoices,
    invoiceTotals,
  ] = await Promise.all([
    Property.countDocuments({ tenantId: id, deletedAt: { $exists: false } }),
    Property.countDocuments({ tenantId: id, listingStatus: "PUBLISHED", deletedAt: { $exists: false } }),
    OrganizationMember.countDocuments({ organizationId: id, status: "ACTIVE" }),
    Branch.countDocuments({ organizationId: id, status: "ACTIVE", deletedAt: { $exists: false } }),
    Booking.countDocuments({ tenantId: id, status: { $in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] } }),
    RentalApplication.countDocuments({ tenantId: id, status: { $in: ["SUBMITTED", "UNDER_REVIEW"] } }),
    MaintenanceRequest.countDocuments({ tenantId: id, status: { $nin: ["RESOLVED", "CANCELLED", "REJECTED"] } }),
    Invoice.countDocuments({ tenantId: id, status: { $in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }),
    Invoice.aggregate([
      { $match: { tenantId: access.organization._id, status: { $in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } } },
      { $group: { _id: "$currency", total: { $sum: { $subtract: ["$total", "$amountPaid"] } } } },
    ]),
  ]);

  const cards = [
    ["Listings", listings, `${published} published`],
    ["Active team", members, `${branches} active branches`],
    ["Bookings", bookings, "Active booking workflow"],
    ["Applications", applications, "Awaiting decisions"],
    ["Maintenance", maintenance, "Open operational issues"],
    ["Outstanding invoices", outstandingInvoices, invoiceTotals.map((row) => `${row._id} ${Number(row.total || 0).toLocaleString()}`).join(" · ") || "No balance due"],
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/organizations/${id}`} className="text-sm font-semibold text-blue-700">&larr; Workspace</Link>
      <div className="mt-5 rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-sm font-semibold text-blue-300">{access.organization.name}</p>
        <h1 className="mt-2 text-3xl font-bold">Operations dashboard</h1>
        <p className="mt-2 text-slate-300">Tenant-scoped portfolio, leasing, finance and maintenance activity.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, description]) => (
          <article key={label} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href={`/organizations/${id}/property-management`} className="rounded-2xl bg-blue-600 p-5 font-bold text-white">Property management &rarr;</Link>
        <Link href={`/organizations/${id}/reports`} className="rounded-2xl bg-slate-900 p-5 font-bold text-white">Portfolio reports &rarr;</Link>
        <Link href={`/organizations/${id}/audit-logs`} className="rounded-2xl border bg-white p-5 font-bold">Tenant audit log &rarr;</Link>
      </div>
      {(access.permissions.includes("*") || access.permissions.includes("settings.manage")) && <Link href={`/organizations/${id}/enterprise`} className="mt-4 block rounded-2xl border border-blue-200 bg-blue-50 p-5 font-bold text-blue-900">Enterprise API keys and webhooks &rarr;</Link>}
    </section>
  );
}
