import connectDB from "@/config/database";
import Organization from "@/models/Organization";
import OrganizationMember from "@/models/OrganizationMember";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  await requirePagePermission("organizations.read", "/admin/organizations");
  await connectDB();
  const organizations = await Organization.find({ deletedAt: { $exists: false } }).sort({ createdAt: -1 }).limit(200).lean();
  const counts = await OrganizationMember.aggregate([{ $match: { organizationId: { $in: organizations.map((o) => o._id) }, status: "ACTIVE" } }, { $group: { _id: "$organizationId", count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
  return <div><h1 className="text-3xl font-bold text-slate-950">Organizations</h1><p className="mt-2 text-slate-600">Tenant registry and verification status.</p><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Members</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y">{organizations.map((org) => <tr key={org._id.toString()}><td className="px-5 py-4 font-semibold">{org.name}<span className="block text-xs font-normal text-slate-500">{org.slug}</span></td><td className="px-5 py-4">{org.type.replaceAll("_", " ")}</td><td className="px-5 py-4">{countMap.get(org._id.toString()) || 0}</td><td className="px-5 py-4">{org.status}</td><td className="px-5 py-4">{new Date(org.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div></div>;
}
