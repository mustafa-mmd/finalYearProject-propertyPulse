import mongoose from "mongoose";
import connectDB from "@/config/database";
import Subscription from "@/models/Subscription";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import Organization from "@/models/Organization";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const actor = await requireActor();
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    if (organizationId) await requireOrganizationPermission(organizationId, "finance.read");
    await connectDB();

    // Use raw collection query — userId was inserted as ObjectId via collection.insertOne
    const query = organizationId
      ? { tenantId: new mongoose.Types.ObjectId(organizationId) }
      : { userId: new mongoose.Types.ObjectId(actor.id) };

    const subscription = await Subscription.collection.findOne({
      ...query,
      status: { $in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE", "PAUSED"] },
    });

    return apiSuccess({ subscription });
  } catch (error) {
    return handleApiError(error, "subscriptions.get");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const planCode = typeof body.planCode === "string" ? body.planCode.trim().toUpperCase() : "";
    const billingInterval = body.billingInterval === "ANNUAL" ? "ANNUAL" : "MONTHLY";
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "ZAR";
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";

    const organizationAccess = organizationId
      ? await requireOrganizationPermission(organizationId, "finance.manage")
      : null;

    await connectDB();

    // Resolve plan from DB first, then fallback to DEFAULT_SUBSCRIPTION_PLANS
    let plan = await SubscriptionPlan.findOne({ code: planCode, active: true }).lean();
    if (!plan) {
      plan = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.code === planCode);
    }

    if (!plan) {
      return apiError("Subscription plan not found", { status: 404, code: "NOT_FOUND" });
    }

    // Cancel / archive existing subscription if present to allow upgrading
    await Subscription.updateMany(
      {
        ...(organizationId ? { tenantId: organizationId } : { userId: actor.id }),
        status: { $in: ["PENDING", "TRIALING", "ACTIVE"] },
      },
      {
        $set: {
          status: "CANCELLED",
          canceledAt: new Date(),
        },
      }
    );

    const now = new Date();
    const isFree = plan.code === "FREE";
    const trialDays = isFree ? 0 : 14;
    const periodDays = billingInterval === "ANNUAL" ? 365 : 30;

    const currentPeriodStart = now;
    const trialEndsAt = isFree ? undefined : new Date(now.getTime() + trialDays * 86_400_000);
    const currentPeriodEnd = new Date(now.getTime() + (trialDays + periodDays) * 86_400_000);

    // Use raw insertOne to bypass Mongoose validation on cached model schemas.
    // planId is optional when plan comes from DEFAULT_SUBSCRIPTION_PLANS (no DB _id).
    const toObjectId = (id) => new mongoose.Types.ObjectId(id);
    const { insertedId } = await Subscription.collection.insertOne({
      userId: organizationId ? undefined : toObjectId(actor.id),
      tenantId: organizationId ? toObjectId(organizationId) : undefined,
      planId: plan._id || undefined,
      planCode: plan.code.toUpperCase(),
      billingInterval,
      provider: "STRIPE",                  // valid enum value
      status: isFree ? "ACTIVE" : "TRIALING",
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      cancelAtPeriodEnd: false,
      limitsSnapshot: plan.limits?.toObject?.() || plan.limits || {},
      statusHistory: [
        {
          status: isFree ? "ACTIVE" : "TRIALING",
          changedBy: toObjectId(actor.id),
          reason: isFree
            ? "Free plan activated"
            : `Subscribed to ${plan.name} (${billingInterval.toLowerCase()}) with 14-day trial (${currency})`,
          at: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    const subscription = { _id: insertedId, status: isFree ? "ACTIVE" : "TRIALING", planCode: plan.code };

    if (organizationId) {
      await Organization.updateOne(
        { _id: organizationId },
        { $set: { subscriptionId: subscription._id } }
      );
    }

    await writeAuditLog({
      actor: organizationAccess?.actor || actor,
      action: "subscription.activate",
      targetType: "Subscription",
      targetId: subscription._id,
      tenantId: organizationId || undefined,
      metadata: { planCode, billingInterval, currency },
      request,
    });

    return apiSuccess(
      {
        id: subscription._id.toString(),
        status: subscription.status,
        planCode: subscription.planCode,
        currency,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "subscriptions.create");
  }
}
