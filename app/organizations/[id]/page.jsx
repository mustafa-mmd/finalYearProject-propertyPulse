import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrganizationWorkspaceActions from "@/components/OrganizationWorkspaceActions";
import Branch from "@/models/Branch";
import OrganizationMember from "@/models/OrganizationMember";
import OrganizationInvitation from "@/models/OrganizationInvitation";
import {
  BranchManagementActions,
  InvitationRevokeButton,
  MemberManagementActions,
} from "@/components/OrganizationDirectoryActions";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({ params }) {
  const actor = await getActor();
  const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}`);

  const access = await getOrganizationAccess(id, actor);
  if (!access) notFound();

  const [members, branches, invitations] = await Promise.all([
    OrganizationMember.find({ organizationId: id, status: { $ne: "REMOVED" } })
      .populate("userId", "name email image")
      .sort({ createdAt: 1 })
      .lean(),
    Branch.find({ organizationId: id, deletedAt: { $exists: false } })
      .sort({ name: 1 })
      .lean(),
    OrganizationInvitation.find({ organizationId: id, status: "PENDING" })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const can = (permission) =>
    access.permissions.includes("*") || access.permissions.includes(permission);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/organizations" className="text-sm font-semibold text-blue-700">
        &larr; All organizations
      </Link>
      <div className="mt-5 rounded-3xl bg-slate-950 p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-300">
              {access.organization.type.replaceAll("_", " ")}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{access.organization.name}</h1>
            <p className="mt-2 text-slate-300">Workspace ID: {access.organization.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/organizations/${id}/dashboard`}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Operations dashboard
            </Link>
            <Link
              href={`/organizations/${id}/audit-logs`}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Audit log
            </Link>
            <Link
              href={`/organizations/${id}/billing`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Usage and billing
            </Link>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              {access.organization.status}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <OrganizationWorkspaceActions
          organizationId={id}
          canInvite={can("members.invite")}
          canManageBranches={can("branches.manage")}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold">Team ({members.length})</h2>
          <div className="mt-4 divide-y">
            {members.map((member) => (
              <div key={member._id.toString()} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{member.userId?.name || "Pending user"}</p>
                  <p className="text-sm text-slate-500">{member.userId?.email}</p>
                </div>
                <p className="text-xs font-semibold text-blue-700">
                  {member.roles.join(", ")}
                </p>
                <MemberManagementActions
                  organizationId={id}
                  memberId={member._id.toString()}
                  role={member.roles.find((role) => role !== "OWNER") || member.roles[0]}
                  status={member.status}
                  canUpdate={can("members.update")}
                  canRemove={can("members.remove")}
                  protectedMember={member.userId?._id?.toString() === access.organization.ownerId.toString()}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold">Branches ({branches.length})</h2>
          <div className="mt-4 divide-y">
            {branches.map((branch) => (
              <div key={branch._id.toString()} className="flex justify-between py-3">
                <div>
                  <p className="font-semibold">{branch.name}</p>
                  <p className="text-sm text-slate-500">
                    {branch.email || "No branch email"}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">{branch.code}</span>
                <BranchManagementActions
                  organizationId={id}
                  branch={{
                    id: branch._id.toString(),
                    name: branch.name,
                    code: branch.code,
                    email: branch.email || "",
                    status: branch.status,
                  }}
                  canManage={can("branches.manage")}
                />
              </div>
            ))}
            {branches.length === 0 && (
              <p className="py-4 text-sm text-slate-500">No branches added.</p>
            )}
          </div>
        </div>
      </div>
      {invitations.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold">Pending invitations ({invitations.length})</h2>
          <div className="mt-4 divide-y">
            {invitations.map((invitation) => (
              <div key={invitation._id.toString()} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{invitation.email}</p>
                  <p className="text-xs text-slate-500">{invitation.roles.join(", ")} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                </div>
                {can("members.remove") && <InvitationRevokeButton organizationId={id} invitationId={invitation._id.toString()} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
