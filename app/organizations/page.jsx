import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import OrganizationMember from "@/models/OrganizationMember";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organizations",
  description: "Manage your agency workspaces and team memberships.",
};

const TYPE_COLORS = {
  AGENCY: "bg-blue-100 text-blue-800",
  INDIVIDUAL_LANDLORD: "bg-violet-100 text-violet-800",
  PROPERTY_MANAGEMENT_COMPANY: "bg-emerald-100 text-emerald-800",
  DEVELOPER: "bg-orange-100 text-orange-800",
  CORPORATE: "bg-slate-100 text-slate-700",
};

const TYPE_ICONS = {
  AGENCY: "🏢",
  INDIVIDUAL_LANDLORD: "🏠",
  PROPERTY_MANAGEMENT_COMPANY: "🏗️",
  DEVELOPER: "🔨",
  CORPORATE: "💼",
};

export default async function OrganizationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/organizations");

  await connectDB();
  const memberships = await OrganizationMember.find({ userId: actor.id, status: "ACTIVE" })
    .populate("organizationId")
    .sort({ createdAt: -1 })
    .lean();

  const valid = memberships.filter((m) => m.organizationId && !m.organizationId.deletedAt);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pp-page-header">
            <p className="pp-page-header__eyebrow">Business workspace</p>
            <h1 className="pp-page-header__title">Organizations</h1>
            <p className="pp-page-header__subtitle">
              Collaborate with agents, property managers and finance staff in a shared workspace.
            </p>
          </div>
          <Link href="/organizations/new" className="btn-primary shrink-0">
            + Create organization
          </Link>
        </div>

        {valid.length === 0 && (
          <div className="pp-empty mt-8">
            <div className="pp-empty__icon text-4xl">🏢</div>
            <p className="pp-empty__title">No organizations yet</p>
            <p className="pp-empty__body">
              Create a workspace to collaborate with your team and manage portfolios together.
            </p>
            <Link href="/organizations/new" className="btn-primary mt-6">
              Create your first organization
            </Link>
          </div>
        )}

        {valid.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {valid.map((membership) => {
              const org = membership.organizationId;
              const typeColor = TYPE_COLORS[org.type] || "bg-slate-100 text-slate-700";
              const typeIcon = TYPE_ICONS[org.type] || "🏢";

              return (
                <Link
                  key={membership._id.toString()}
                  href={`/organizations/${org._id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                >
                  {/* Org header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      {typeIcon}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        org.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {org.status}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-slate-950 group-hover:text-blue-700 transition-colors">
                    {org.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeColor}`}>
                      {org.type?.replace(/_/g, " ")}
                    </span>
                    {org.slug && (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-500">
                        {org.slug}
                      </span>
                    )}
                  </div>

                  {org.description && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-blue-700">
                      Your roles: {(membership.roles || []).join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Info section */}
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "👥",
              title: "Team management",
              body: "Invite colleagues and assign granular roles — owner, agent, finance, or viewer.",
            },
            {
              icon: "🏗️",
              title: "Branch offices",
              body: "Add multiple branches to represent your office locations across South Africa.",
            },
            {
              icon: "📊",
              title: "Portfolio oversight",
              body: "All listings created under an organization are centrally tracked and reported.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-3 font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
