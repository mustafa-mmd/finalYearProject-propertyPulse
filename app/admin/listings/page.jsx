import Link from "next/link";
import Image from "next/image";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { requirePagePermission } from "@/utils/pageAuthorization";
import AdminListingsTableClient from "@/components/admin/AdminListingsTableClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Listings",
  description: "Manage all platform property listings.",
};

function statusColor(status) {
  const map = {
    PUBLISHED: "bg-emerald-100 text-emerald-800",
    DRAFT: "bg-slate-100 text-slate-600",
    PENDING_AI_REVIEW: "bg-amber-100 text-amber-800",
    PENDING_MANUAL_REVIEW: "bg-amber-100 text-amber-800",
    CHANGES_REQUESTED: "bg-orange-100 text-orange-800",
    SUSPENDED: "bg-red-100 text-red-800",
    ARCHIVED: "bg-slate-100 text-slate-500",
    SOLD: "bg-blue-100 text-blue-800",
    LEASED: "bg-violet-100 text-violet-800",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export default async function AdminListingsPage({ searchParams }) {
  await requirePagePermission("properties.review", "/admin/listings");
  const params = await searchParams;

  const status = params?.status || "";
  const purpose = params?.purpose || "";
  const q = (params?.q || "").trim().slice(0, 100);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  await connectDB();

  const filter = {
    deletedAt: { $exists: false },
    ...(status ? { listingStatus: status } : {}),
    ...(purpose ? { listingPurpose: purpose } : {}),
    ...(q
      ? {
          $or: [
            { name: new RegExp(escaped, "i") },
            { listingReference: new RegExp(escaped, "i") },
            { "location.city": new RegExp(escaped, "i") },
          ],
        }
      : {}),
  };

  const [listings, counts] = await Promise.all([
    Property.find(filter)
      .populate("owner", "name email")
      .select("name listingReference listingStatus listingPurpose listingCategory location images completenessScore verification createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Property.aggregate([
      { $match: { deletedAt: { $exists: false } } },
      { $group: { _id: "$listingStatus", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Published", value: "PUBLISHED" },
    { label: "AI review", value: "PENDING_AI_REVIEW" },
    { label: "Manual review", value: "PENDING_MANUAL_REVIEW" },
    { label: "Draft", value: "DRAFT" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Changes requested", value: "CHANGES_REQUESTED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Content moderation</p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Listings</h2>
          <p className="mt-2 text-slate-600">
            {total.toLocaleString()} total listings across all statuses.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, ref, city…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-48"
          />
          <select
            name="purpose"
            defaultValue={purpose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All purposes</option>
            <option value="LONG_TERM_RENT">Long-term rent</option>
            <option value="SALE">Sale</option>
            <option value="SHORT_TERM_RENT">Short-term</option>
            <option value="COMMERCIAL_LEASE">Commercial lease</option>
            <option value="SHARED_ACCOMMODATION">Shared accommodation</option>
            <option value="STUDENT_ACCOMMODATION">Student accommodation</option>
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Filter
          </button>
        </form>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {STATUS_TABS.map(({ label, value }) => {
          const count = value ? (countMap[value] || 0) : total;
          const active = status === value;
          return (
            <Link
              key={value}
              href={`/admin/listings?status=${value}${purpose ? `&purpose=${purpose}` : ""}${q ? `&q=${q}` : ""}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-white text-slate-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Listings table */}
      <div className="mt-4">
        {listings.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
            No listings match this filter.
          </p>
        ) : (
          <AdminListingsTableClient listings={JSON.parse(JSON.stringify(listings))} />
        )}
      </div>

      {listings.length === 100 && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Showing first 100 results. Use search to narrow down.
        </p>
      )}
    </section>
  );
}
