import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AuditLog from "@/models/AuditLog";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export default async function OrganizationAuditLogsPage({ params, searchParams }) {
  const actor = await getActor();
  const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}/audit-logs`);
  const access = await getOrganizationAccess(id, actor);
  if (!access || (!access.permissions.includes("*") && !access.permissions.includes("reports.read"))) notFound();
  const query = await searchParams;
  const action = String(query?.action || "").trim().slice(0, 100);
  const escaped = action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const logs = await AuditLog.find({
    tenantId: id,
    ...(action ? { action: new RegExp(escaped, "i") } : {}),
  })
    .populate("actorId", "name email")
    .sort({ occurredAt: -1 })
    .limit(250)
    .lean();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/organizations/${id}`} className="text-sm font-semibold text-blue-700">&larr; Workspace</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">{access.organization.name}</p>
          <h1 className="text-3xl font-bold">Tenant audit log</h1>
          <p className="mt-2 text-slate-600">Immutable organization-scoped operational history.</p>
        </div>
        <form>
          <input name="action" defaultValue={action} placeholder="Filter action" className="rounded-lg border px-3 py-2" />
          <button className="ml-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Filter</button>
        </form>
      </div>
      <div className="mt-6 space-y-3">
        {logs.map((log) => (
          <article key={log._id.toString()} className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1.2fr_1fr_auto]">
            <div><p className="font-bold">{log.action}</p><p className="text-sm text-slate-500">{log.actorId?.name || "System"}</p></div>
            <div><p className="font-mono text-xs">{log.targetType}:{log.targetId}</p><p className="text-xs text-slate-500">{log.outcome}</p></div>
            <time className="text-xs text-slate-500">{new Date(log.occurredAt).toLocaleString()}</time>
          </article>
        ))}
        {!logs.length && <p className="rounded-2xl border border-dashed p-8 text-slate-500">No matching tenant audit records.</p>}
      </div>
    </section>
  );
}
