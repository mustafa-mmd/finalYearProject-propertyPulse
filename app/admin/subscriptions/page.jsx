import connectDB from "@/config/database";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Subscription from "@/models/Subscription";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";
import { requirePagePermission } from "@/utils/pageAuthorization";
import Link from "next/link";
import SubscriptionAdminActions from "@/components/admin/SubscriptionAdminActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Subscriptions",
  description: "Manage subscription plans and active subscriptions.",
};

function statusColor(status) {
  const map = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    TRIALING: "bg-blue-100 text-blue-800",
    PAST_DUE: "bg-amber-100 text-amber-800",
    CANCELLED: "bg-red-100 text-red-800",
    EXPIRED: "bg-slate-100 text-slate-500",
    PENDING: "bg-orange-100 text-orange-800",
    PAUSED: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export default async function AdminSubscriptionsPage({ searchParams }) {
  const actor = await requirePagePermission("payments.read", "/admin/subscriptions");
  const params = await searchParams;
  const statusFilter = params?.status || "";

  await connectDB();

  const [dbPlans, subscriptions] = await Promise.all([
    SubscriptionPlan.find({}).sort({ sortOrder: 1 }).lean(),
    Subscription.find(statusFilter ? { status: statusFilter } : {})
      .populate("userId", "name email")
      .populate("tenantId", "name slug")
      .populate("planId", "name code")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const plans = dbPlans.length ? dbPlans : DEFAULT_SUBSCRIPTION_PLANS;

  const counts = await Subscription.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  const STATUS_TABS = ["", "PENDING", "ACTIVE", "TRIALING", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"];

  return (
    <div className="space-y-6">
      {/* Plans section */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Commercial configuration</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Subscription plans</h2>
            <p className="mt-1 text-slate-600">
              {plans.length} plan{plans.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Link href="/pricing" className="rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            View pricing page →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => (
            <div
              key={plan._id.toString()}
              className={`rounded-2xl border p-4 ${plan.active ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50 opacity-60"}`}
            >
              <div className="flex items-start justify-between">
                <p className="font-bold text-slate-900">{plan.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${plan.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                  {plan.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-500">{plan.code}</p>
              <p className="mt-3 text-xl font-extrabold text-blue-700">
                {plan.prices?.monthly == null ? "Custom" : plan.prices.monthly === 0 ? "Free" : `R ${plan.prices.monthly.toLocaleString()}`}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </p>
              {plan.limits && (
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {plan.limits.activeListings != null && <p>Listings: {plan.limits.activeListings === -1 ? "Unlimited" : plan.limits.activeListings}</p>}
                  {plan.limits.teamMembers != null && <p>Team seats: {plan.limits.teamMembers === -1 ? "Unlimited" : plan.limits.teamMembers}</p>}
                </div>
              )}
              <p className={`mt-2 text-xs ${plan.public ? "text-emerald-600" : "text-slate-400"}`}>
                {plan.public ? "Public pricing" : "Hidden from pricing"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Active subscriptions */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Subscriber management</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Active subscriptions</h2>
          </div>
          <form>
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {STATUS_TABS.map((s) => (
                <option key={s} value={s}>
                  {s || "All statuses"}
                  {s && countMap[s] ? ` (${countMap[s]})` : ""}
                </option>
              ))}
            </select>
            <button className="ml-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Filter
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto">
          {subscriptions.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              No subscriptions match this filter.
            </p>
          )}

          {subscriptions.length > 0 && (
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Plan</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Started</th>
                  <th>Renews / Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id.toString()}>
                    <td>
                      {sub.userId ? (
                        <div>
                          <p className="font-semibold">{sub.userId.name}</p>
                          <p className="text-xs text-slate-500">{sub.userId.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unknown</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {sub.planId?.name || sub.planCode || "—"}
                      </span>
                    </td>
                    <td>
                      {sub.tenantId ? (
                        <div>
                          <p className="text-sm font-medium">{sub.tenantId.name}</p>
                          <p className="font-mono text-xs text-slate-400">{sub.tenantId.slug}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Personal</span>
                      )}
                    </td>
                    <td>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(sub.status)}`}>
                        {sub.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600">
                      {sub.billingInterval || "—"}
                    </td>
                    <td className="text-xs text-slate-500">
                      {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : "—"}
                    </td>
                    <td className="text-xs text-slate-500">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <SubscriptionAdminActions
                        subscriptionId={sub._id.toString()}
                        status={sub.status}
                        provider={sub.provider}
                        canManage={actor.permissions.includes("subscriptions.manage")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
