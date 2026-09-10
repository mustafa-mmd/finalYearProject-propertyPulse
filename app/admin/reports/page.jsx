import ReportActions from "@/components/admin/ReportActions";
import connectDB from "@/config/database";
import Report from "@/models/Report";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";
const VALID_STATUSES = ["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "DISMISSED", "CLOSED"];

export default async function AdminReportsPage({ searchParams }) {
  await requirePagePermission("reports.review", "/admin/reports");
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params?.status) ? params.status : "";
  await connectDB();
  const reports = await Report.find(status ? { status } : {})
    .populate("reporterId", "name email")
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email")
    .sort({ priority: -1, createdAt: 1 })
    .limit(250)
    .lean();

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Trust and safety</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Marketplace reports</h1>
          <p className="mt-2 text-slate-600">Triage reports and preserve an audited human resolution for every final decision.</p>
        </div>
        <form className="flex gap-2">
          <select name="status" defaultValue={status} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="">All statuses</option>
            {VALID_STATUSES.map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">Filter</button>
        </form>
      </header>
      <div className="space-y-4">
        {reports.map((report) => (
          <article key={report._id.toString()} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={["HIGH", "CRITICAL"].includes(report.priority) ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"}>{report.priority}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{report.reason}</span>
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">{report.status}</span>
                </div>
                <h2 className="mt-3 font-black text-slate-950">{report.targetType} · {report.targetId.toString()}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{report.details || "No additional details were supplied."}</p>
              </div>
              <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                <p>Reporter: <span className="font-semibold text-slate-800">{report.reporterId?.email || "Unknown"}</span></p>
                <p className="mt-1">Assigned: {report.assignedTo?.name || "Unassigned"}</p>
              </div>
            </div>
            {report.resolution && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><span className="font-bold">Resolution:</span> {report.resolution}</p>}
            {!["ACTIONED", "DISMISSED", "CLOSED"].includes(report.status) && <ReportActions reportId={report._id.toString()} currentStatus={report.status} />}
          </article>
        ))}
        {reports.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No reports match this filter.</p>}
      </div>
    </section>
  );
}
