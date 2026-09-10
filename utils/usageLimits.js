import connectDB from "@/config/database";
import Subscription from "@/models/Subscription";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import OrganizationMember from "@/models/OrganizationMember";
import Branch from "@/models/Branch";
import Property from "@/models/Property";
import UsageRecord from "@/models/UsageRecord";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";
import { AuthorizationError } from "@/utils/authorization";

const METRICS = { activeListings: "ACTIVE_LISTINGS", teamMembers: "TEAM_MEMBERS", branches: "BRANCHES" };

export async function getTenantEntitlements(tenantId) {
  await connectDB();
  const subscription = await Subscription.findOne({ tenantId, status: { $in: ["TRIALING", "ACTIVE"] } }).populate("planId").lean();
  const fallback = DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.code === "FREE");
  return { subscription, planCode: subscription?.planCode || fallback.code, limits: subscription?.limitsSnapshot || subscription?.planId?.limits || fallback.limits };
}

async function currentUsage(tenantId, metric) {
  if (metric === "activeListings") return Property.countDocuments({ tenantId, listingStatus: { $nin: ["ARCHIVED", "SOLD", "RENTED", "EXPIRED"] }, deletedAt: { $exists: false } });
  if (metric === "teamMembers") return OrganizationMember.countDocuments({ organizationId: tenantId, status: "ACTIVE" });
  if (metric === "branches") return Branch.countDocuments({ organizationId: tenantId, status: "ACTIVE", deletedAt: { $exists: false } });
  return 0;
}

export async function assertTenantCapacity(tenantId, metric, increment = 1) {
  const entitlements = await getTenantEntitlements(tenantId);
  const limit = Number(entitlements.limits?.[metric] ?? 0);
  const used = await currentUsage(tenantId, metric);
  if (limit !== -1 && used + increment > limit) throw new AuthorizationError(`${metric} limit reached for the ${entitlements.planCode} plan`, 409, "PLAN_LIMIT_REACHED");
  const period = new Date().toISOString().slice(0, 7);
  const usageMetric = METRICS[metric];
  if (usageMetric) await UsageRecord.updateOne({ tenantId, metric: usageMetric, period }, { $set: { quantity: used } }, { upsert: true });
  return { used, limit, planCode: entitlements.planCode };
}

export async function tenantUsageSnapshot(tenantId) {
  const entitlements = await getTenantEntitlements(tenantId);
  const [activeListings, teamMembers, branches] = await Promise.all([currentUsage(tenantId, "activeListings"), currentUsage(tenantId, "teamMembers"), currentUsage(tenantId, "branches")]);
  return { planCode: entitlements.planCode, limits: entitlements.limits, usage: { activeListings, teamMembers, branches }, subscription: entitlements.subscription };
}

async function subjectEntitlements(userId, tenantId) {
  if (tenantId) return getTenantEntitlements(tenantId);
  await connectDB();
  const User = (await import("@/models/User")).default;
  const user = await User.findById(userId).select("email roles").lean();
  if (
    user &&
    (user.roles?.includes("PLATFORM_OWNER") ||
      user.roles?.includes("SUPER_ADMIN") ||
      user.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com")
  ) {
    return {
      subscription: null,
      planCode: "PLATFORM_OWNER",
      limits: {
        activeListings: -1,
        teamMembers: -1,
        branches: -1,
        storageMb: -1,
        monthlyLeads: -1,
        aiReviews: -1,
        apiRequests: -1,
      },
    };
  }
  const subscription = await Subscription.findOne({ userId, status: { $in: ["TRIALING", "ACTIVE"] } }).populate("planId").lean();
  const fallback = DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.code === "FREE");
  return { subscription, planCode: subscription?.planCode || fallback.code, limits: subscription?.limitsSnapshot || subscription?.planId?.limits || fallback.limits };
}

function limitResult(metric, used, limit, planCode) {
  const allowed = limit === -1 || used < limit;
  return { allowed, used, limit, planCode, message: allowed ? "Allowed" : `${metric} limit reached for the ${planCode} plan` };
}

export async function checkActiveListingsLimit(userId, tenantId = null) {
  const entitlements = await subjectEntitlements(userId, tenantId);
  const filter = tenantId ? { tenantId } : { owner: userId, tenantId: { $exists: false } };
  const used = await Property.countDocuments({ ...filter, listingStatus: { $nin: ["ARCHIVED", "SOLD", "RENTED", "EXPIRED"] }, deletedAt: { $exists: false } });
  return limitResult("Active listings", used, Number(entitlements.limits?.activeListings ?? 1), entitlements.planCode);
}

export async function checkTeamMembersLimit(userId, tenantId) {
  const entitlements = await subjectEntitlements(userId, tenantId);
  const used = await OrganizationMember.countDocuments({ organizationId: tenantId, status: { $in: ["ACTIVE", "INVITED"] } });
  return limitResult("Team member", used, Number(entitlements.limits?.teamMembers ?? 1), entitlements.planCode);
}

export async function checkAiReviewsLimit(userId, tenantId = null) {
  const entitlements = await subjectEntitlements(userId, tenantId); const period = new Date().toISOString().slice(0, 7);
  const subject = tenantId ? { tenantId } : { userId }; const record = await UsageRecord.findOne({ ...subject, metric: "AI_REVIEWS", period }).lean();
  return limitResult("AI review", record?.quantity || 0, Number(entitlements.limits?.aiReviews ?? 0), entitlements.planCode);
}

export async function incrementAiReviewsUsage(userId, tenantId = null) {
  const period = new Date().toISOString().slice(0, 7); const subject = tenantId ? { tenantId } : { userId };
  return UsageRecord.updateOne({ ...subject, metric: "AI_REVIEWS", period }, { $inc: { quantity: 1 } }, { upsert: true });
}
