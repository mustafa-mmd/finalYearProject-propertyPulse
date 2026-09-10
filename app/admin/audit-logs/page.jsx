import connectDB from "@/config/database";
import AuditLog from "@/models/AuditLog";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({ searchParams }) {
  await requirePagePermission("audit_logs.read", "/admin/audit-logs");
  const params = await searchParams;
  const action = (params?.action || "").trim().slice(0, 100);
  await connectDB();
  const logs = await AuditLog.find(action ? { action: new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {})
    .populate("actorId", "name email")
    .sort({ occurredAt: -1 })
    .limit(250)
    .lean();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-700">Security and compliance</p><h2 className="mt-1 text-3xl font-bold text-slate-950">Immutable audit log</h2><p className="mt-2 text-slate-600">Sensitive state changes and administrative decisions are append-only.</p></div><form><input name="action" defaultValue={action} placeholder="Filter action" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button className="ml-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button></form></div>
      <div className="mt-6 space-y-2">{!logs.length && <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-600">No matching audit records.</p>}{logs.map((log) => <article key={log._id.toString()} className="grid gap-2 rounded-xl border border-slate-200 p-4 text-sm md:grid-cols-[1.2fr_1fr_1fr_auto]"><div><p className="font-bold text-slate-900">{log.action}</p><p className="text-slate-500">{log.actorId?.name || "System"}</p></div><div><p className="text-xs uppercase text-slate-400">Target</p><p className="font-mono text-xs text-slate-700">{log.targetType}:{log.targetId}</p></div><div><p className="text-xs uppercase text-slate-400">Outcome</p><p className="font-semibold text-slate-700">{log.outcome}</p></div><time className="text-xs text-slate-500">{new Date(log.occurredAt).toLocaleString()}</time></article>)}</div>
    </section>
  );
}
