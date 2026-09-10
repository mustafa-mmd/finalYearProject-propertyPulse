import SupportTicketActions from "@/components/admin/SupportTicketActions";
import connectDB from "@/config/database";
import SupportTicket from "@/models/SupportTicket";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support operations | PropertyPulse" };

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"];

export default async function AdminSupportPage({ searchParams }) {
  await requirePagePermission("support.manage", "/admin/support");
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params?.status) ? params.status : "";
  await connectDB();
  const tickets = await SupportTicket.find(status ? { status } : {})
    .populate("requesterId", "name email")
    .populate("assignedTo", "name email")
    .populate("messages.authorId", "name email")
    .sort({ priority: -1, createdAt: -1 })
    .limit(250)
    .lean();

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Customer operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Support tickets</h1>
          <p className="mt-2 text-slate-600">Prioritize requests, record internal notes, and move every issue to a clear resolution.</p>
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
        {tickets.map((ticket) => {
          const latestMessage = ticket.messages?.at(-1);
          return (
            <article key={ticket._id.toString()} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">{ticket.reference}</span>
                    <span className={ticket.priority === "URGENT" ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700" : ticket.priority === "HIGH" ? "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700" : "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"}>{ticket.priority}</span>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">{ticket.status}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-slate-950">{ticket.subject}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{ticket.description}</p>
                </div>
                <div className="shrink-0 text-sm text-slate-500 md:text-right">
                  <p className="font-bold text-slate-800">{ticket.requesterId?.name || "Unknown requester"}</p>
                  <p>{ticket.requesterId?.email || "No email"}</p>
                  <p className="mt-2 text-xs">Assigned: {ticket.assignedTo?.name || "Unassigned"}</p>
                </div>
              </div>
              {latestMessage && (
                <div className="mt-4 rounded-xl border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-950">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{latestMessage.internal ? "Latest internal note" : "Latest message"} · {latestMessage.authorId?.name || "User"}</p>
                  <p className="mt-1">{latestMessage.body}</p>
                </div>
              )}
              <SupportTicketActions ticketId={ticket._id.toString()} currentStatus={ticket.status} currentPriority={ticket.priority} />
            </article>
          );
        })}
        {tickets.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No support tickets match this filter.</p>}
      </div>
    </section>
  );
}
