import connectDB from "@/config/database";
import User from "@/models/User";
import UserAdminActions from "@/components/admin/UserAdminActions";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }) {
  const params = await searchParams;
  const actor = await requirePagePermission("users.read", "/admin/users");
  const query = (params?.q || "").trim().slice(0, 100);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await connectDB();
  const users = await User.find({
    accountStatus: { $ne: "DELETED" },
    ...(query ? { $or: [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }] } : {}),
  })
    .select("name email roles accountStatus verification security.mfaEnabled security.lastLoginAt createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Identity and access</p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Users</h2>
          <p className="mt-2 text-slate-600">Review account status and verification signals. Every enforcement action is recorded.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder="Search name or email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">User</th><th className="px-3 py-3">Roles</th><th className="px-3 py-3">Verification</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user._id.toString()}>
                <td className="px-3 py-4"><p className="font-semibold text-slate-900">{user.name}</p><p className="text-slate-500">{user.email}</p></td>
                <td className="px-3 py-4"><div className="flex max-w-xs flex-wrap gap-1">{(user.roles?.length ? user.roles : ["USER"]).map((role) => <span key={role} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">{role}</span>)}</div></td>
                <td className="px-3 py-4 text-slate-600">Email {user.verification?.emailVerified ? "verified" : "unverified"}<br />Identity {user.verification?.identityStatus || "NOT_STARTED"}</td>
                <td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{user.accountStatus}</span></td>
                <td className="px-3 py-4">
                  <UserAdminActions
                    userId={user._id.toString()}
                    status={user.accountStatus}
                    canSuspend={actor.permissions.includes("users.suspend")}
                    canBan={actor.permissions.includes("users.ban")}
                    canManageRoles={actor.permissions.includes("admins.manage") || actor.roles.includes("PLATFORM_OWNER")}
                    currentRoles={user.roles || []}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
