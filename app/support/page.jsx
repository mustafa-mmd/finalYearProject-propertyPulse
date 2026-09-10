import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketForm from "@/components/SupportTicketForm";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support",
  description: "Get help with your PropertyPulse account.",
};

function statusColor(status) {
  const map = {
    OPEN: "bg-amber-100 text-amber-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-slate-100 text-slate-600",
    ESCALATED: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

const FAQS = [
  {
    q: "How does AI listing verification work?",
    a: "Every listing is automatically scanned for fraud signals, completeness, and compliance before publication. High-risk listings are escalated to our human review team.",
  },
  {
    q: "How long does verification take?",
    a: "Most listings are processed within 2–4 hours. High-risk or escalated cases may take up to 24 hours.",
  },
  {
    q: "How do I upgrade my subscription plan?",
    a: "Visit the Pricing page and choose a plan. Payments are processed via PayFast with instant confirmation.",
  },
  {
    q: "Can I invite team members to my workspace?",
    a: "Yes. Create or open an Organization and use the 'Invite member' action to send email invitations.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support EFT, credit/debit cards, and Instant EFT via PayFast. All payments are secured and audited.",
  },
];

export default async function SupportPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/support");

  await connectDB();
  const tickets = await SupportTicket.find({ requesterId: actor.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const openTickets = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const closedTickets = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="pp-page-header text-center">
          <p className="pp-page-header__eyebrow">Help center</p>
          <h1 className="pp-page-header__title">How can we help you?</h1>
          <p className="pp-page-header__subtitle mx-auto max-w-xl">
            Search our FAQs or submit a support ticket and our team will respond within 24 hours.
          </p>
        </div>

        {/* Main grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: form + FAQs */}
          <div className="space-y-8">
            {/* Submit form */}
            <div className="pp-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900">Submit a support ticket</h2>
              <p className="mt-1 text-sm text-slate-500">
                Describe your issue and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="mt-5">
                <SupportTicketForm />
              </div>
            </div>

            {/* FAQs */}
            <div className="pp-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
              <div className="mt-5 divide-y divide-slate-100">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group py-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-slate-800 marker:hidden list-none">
                      {faq.q}
                      <span className="shrink-0 text-blue-600 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Right: ticket history */}
          <div className="space-y-6">
            <div className="pp-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Your tickets</h2>
                {tickets.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {tickets.length} total
                  </span>
                )}
              </div>

              {tickets.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-sm text-slate-500">No support tickets yet.</p>
                </div>
              )}

              {openTickets.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Open ({openTickets.length})
                  </p>
                  <div className="space-y-3">
                    {openTickets.map((ticket) => (
                      <article
                        key={ticket._id.toString()}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs font-semibold text-blue-600">
                            {ticket.reference}
                          </p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(ticket.status)}`}>
                            {ticket.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="mt-2 font-semibold text-slate-900">{ticket.subject}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString("en-ZA")}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {closedTickets.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Resolved ({closedTickets.length})
                  </p>
                  <div className="space-y-3 opacity-70">
                    {closedTickets.slice(0, 5).map((ticket) => (
                      <article
                        key={ticket._id.toString()}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs text-slate-400">{ticket.reference}</p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-slate-700">{ticket.subject}</h3>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="pp-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900">Other ways to reach us</h2>
              <div className="mt-4 space-y-3">
                {[
                  { icon: "📧", label: "Email", value: "support@propertypulse.com" },
                  { icon: "📞", label: "Global Phone", value: "+1 (800) 555-0199 (24/7 Global Support)" },
                  { icon: "⏱️", label: "Response time", value: "Within 24 hours (business days)" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="text-sm text-slate-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
