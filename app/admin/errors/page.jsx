import ErrorStatusActions from "@/components/admin/ErrorStatusActions";
import connectDB from "@/config/database";
import OperationalError from "@/models/OperationalError";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System errors",
  description: "Review deduplicated operational failures.",
};

export default async function AdminErrorsPage({ searchParams }) {
  await requirePagePermission("system_errors.read", "/admin/errors");
  const params = await searchParams;
  const status = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"].includes(params?.status)
    ? params.status
    : "OPEN";
  await connectDB();
  const items = await OperationalError.find({ status })
    .sort({ severity: 1, lastOccurredAt: -1 })
    .limit(200)
    .lean();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <p className="text-sm font-semibold text-blue-300">Technical operations</p>
        <h1 className="mt-1 text-3xl font-bold">System errors</h1>
        <p className="mt-2 text-slate-300">Deduplicated failures with occurrence counts and sanitized diagnostics.</p>
      </div>
      <form className="rounded-2xl border bg-white p-4">
        <label className="text-sm font-semibold">
          Status
          <select name="status" defaultValue={status} className="ml-3 rounded-lg border px-3 py-2">
            {["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <button className="ml-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item._id.toString()} className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">{item.severity}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{item.source}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{item.occurrenceCount} occurrences</span>
                </div>
                <h2 className="mt-3 font-bold">{item.context}: {item.errorName}</h2>
                <p className="mt-1 max-w-4xl break-words text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">Last seen {new Date(item.lastOccurredAt).toLocaleString()}</p>
              </div>
              <ErrorStatusActions errorId={item._id.toString()} currentStatus={item.status} />
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-slate-500">No {status.toLowerCase()} system errors.</p>}
      </div>
    </section>
  );
}
