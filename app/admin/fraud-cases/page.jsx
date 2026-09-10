import FraudCaseActions from "@/components/admin/FraudCaseActions";
import connectDB from "@/config/database";
import FraudCase from "@/models/FraudCase";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";
const ACTIVE_STATUSES = ["OPEN", "TRIAGED", "INVESTIGATING"];

export default async function FraudCasesPage({ searchParams }) {
  await requirePagePermission("risk_rules.manage", "/admin/fraud-cases");
  const params = await searchParams;
  const status = ["OPEN", "TRIAGED", "INVESTIGATING", "CLEARED", "ACTIONED", "CLOSED"].includes(params?.status) ? params.status : "";
  await connectDB();
  const cases = await FraudCase.find(status ? { status } : {}).populate("assignedTo", "name email").populate("humanDecision.decidedBy", "name email").sort({ status: 1, score: -1, createdAt: 1 }).limit(250).lean();

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Risk operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Fraud review cases</h1>
          <p className="mt-2 max-w-2xl text-slate-300">Signals prioritize work; only an authorized human records the operational decision.</p>
        </div>
        <form className="flex gap-2">
          <select name="status" defaultValue={status} className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white">
            <option value="">All statuses</option>
            {["OPEN", "TRIAGED", "INVESTIGATING", "CLEARED", "ACTIONED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="rounded-lg bg-white px-4 text-sm font-bold text-slate-950">Filter</button>
        </form>
      </header>
      <div className="space-y-4">
        {cases.map((item) => (
          <article key={item._id.toString()} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={["HIGH", "CRITICAL"].includes(item.severity) ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"}>{item.severity} · SCORE {item.score}</span>
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">{item.status}</span>
                </div>
                <h2 className="mt-3 font-black text-slate-950">{item.entityType} · {item.entityId.toString()}</h2>
              </div>
              <p className="text-sm text-slate-500">Assigned: {item.assignedTo?.name || "Unassigned"}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.signals.slice(0, 8).map((signal, index) => (
                <div key={signal.code + "-" + index} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="font-bold">{signal.code}</span>
                  <span className="float-right font-mono text-red-700">+{signal.weight}</span>
                </div>
              ))}
            </div>
            {item.humanDecision?.reason && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-950"><span className="font-bold">{item.humanDecision.action}:</span> {item.humanDecision.reason}</p>}
            {ACTIVE_STATUSES.includes(item.status) && <FraudCaseActions caseId={item._id.toString()} currentAction={item.humanDecision?.action} />}
          </article>
        ))}
        {cases.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No fraud cases match this filter.</p>}
      </div>
    </section>
  );
}
