import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import connectDB from "@/config/database";
import { getActor } from "@/utils/authorization";
import { getOrganizationAccess } from "@/utils/tenantAuthorization";
import { tenantUsageSnapshot } from "@/utils/usageLimits";

export const dynamic = "force-dynamic";

function Usage({ label, used, limit }) {
  const unlimited = limit === -1;
  const percentage = unlimited ? 5 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return <div><div className="flex justify-between text-sm"><span>{label}</span><strong>{used} / {unlimited ? "Unlimited" : limit}</strong></div><div className="mt-2 h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-blue-600" style={{ width: `${percentage}%` }} /></div></div>;
}

export default async function OrganizationBillingPage({ params }) {
  const actor = await getActor(); const { id } = await params;
  if (!actor) redirect(`/api/auth/signin?callbackUrl=/organizations/${id}/billing`);
  const access = await getOrganizationAccess(id, actor);
  if (!access || (!access.permissions.includes("*") && !access.permissions.includes("finance.read"))) notFound();
  await connectDB();
  const [snapshot, plans] = await Promise.all([tenantUsageSnapshot(id), SubscriptionPlan.find({ active: true, public: true }).sort({ sortOrder: 1 }).lean()]);
  return <section className="mx-auto max-w-6xl px-4 py-10"><Link href={`/organizations/${id}`} className="text-sm font-semibold text-blue-700">← Workspace</Link><h1 className="mt-4 text-3xl font-bold">Usage & billing</h1><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]"><div className="space-y-5 rounded-2xl border bg-white p-6"><div><p className="text-sm text-slate-500">Current entitlement</p><h2 className="text-2xl font-bold">{snapshot.planCode}</h2><p className="text-sm text-slate-600">{snapshot.subscription?.status || "Default free limits"}</p></div><Usage label="Active listings" used={snapshot.usage.activeListings} limit={snapshot.limits.activeListings} /><Usage label="Team members" used={snapshot.usage.teamMembers} limit={snapshot.limits.teamMembers} /><Usage label="Branches" used={snapshot.usage.branches} limit={snapshot.limits.branches ?? 0} /></div><div><h2 className="text-xl font-bold">Available plans</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{plans.map((plan) => <article key={plan._id.toString()} className="rounded-2xl border bg-white p-5"><h3 className="font-bold">{plan.name}</h3><p className="mt-1 text-sm text-slate-600">{plan.description}</p><p className="mt-3 font-bold">{plan.prices?.monthly == null ? "Contact sales" : `${plan.prices.currency} ${plan.prices.monthly}/month`}</p><p className="mt-3 text-xs text-amber-700">Paid activation requires the recurring billing provider configured at launch.</p></article>)}</div></div></div></section>;
}
