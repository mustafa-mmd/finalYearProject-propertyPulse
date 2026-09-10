import connectDB from "@/config/database";
import stripe from "@/config/stripe";
import Subscription from "@/models/Subscription";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/config/plans";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/subscription
 * Creates a Stripe Checkout Session for subscribing to a plan.
 * Returns { checkoutUrl } to redirect the user.
 */
export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json().catch(() => ({}));
    const planCode = typeof body.planCode === "string" ? body.planCode.trim().toUpperCase() : "";
    const billingInterval = body.billingInterval === "ANNUAL" ? "ANNUAL" : "MONTHLY";

    await connectDB();

    // Resolve plan — DB first, then defaults
    let plan = await SubscriptionPlan.findOne({ code: planCode, active: true }).lean();
    if (!plan) plan = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.code === planCode);
    if (!plan) return apiError("Subscription plan not found", { status: 404, code: "NOT_FOUND" });

    // Free plan — activate immediately without Stripe
    const monthlyPrice = plan.prices?.monthly ?? null;
    if (monthlyPrice === 0 || monthlyPrice === null) {
      return apiError("Free or Enterprise plans do not go through Stripe checkout", {
        status: 400,
        code: "NOT_APPLICABLE",
      });
    }

    // Prevent duplicate active subscription
    const existing = await Subscription.findOne({
      userId: actor.id,
      status: { $in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE"] },
    });
    if (existing) {
      return apiError("You already have an active subscription. Cancel it first to switch plans.", {
        status: 409,
        code: "SUBSCRIPTION_EXISTS",
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return apiError("Payment gateway is not configured. Contact support.", {
        status: 503,
        code: "GATEWAY_UNAVAILABLE",
      });
    }

    // Amount in cents (Stripe uses smallest currency unit)
    const amount = billingInterval === "ANNUAL"
      ? Math.round((plan.prices?.annual ?? monthlyPrice * 12) * 100)
      : Math.round(monthlyPrice * 100);

    const currency = (plan.prices?.currency || "USD").toLowerCase();
    const intervalStripe = billingInterval === "ANNUAL" ? "year" : "month";
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Create Stripe Checkout Session (hosted payment page — PCI compliant)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: actor.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            recurring: { interval: intervalStripe },
            unit_amount: amount,
            product_data: {
              name: `PropertyPulse ${plan.name} Plan`,
              description: plan.description || `${plan.name} subscription — billed ${billingInterval.toLowerCase()}`,
              images: [`${origin}/images/logo.png`],
              metadata: { planCode: plan.code },
            },
          },
        },
      ],
      metadata: {
        userId: actor.id,
        planCode: plan.code,
        billingInterval,
        actorEmail: actor.email,
      },
      subscription_data: {
        metadata: {
          userId: actor.id,
          planCode: plan.code,
          billingInterval,
        },
        trial_period_days: 14,
      },
      success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.code}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    // Create a PENDING subscription record
    const subscription = await Subscription.create({
      userId: actor.id,
      planId: plan._id || undefined,
      planCode: plan.code,
      billingInterval,
      provider: "STRIPE",
      status: "PENDING",
      providerSubscriptionId: null,
      limitsSnapshot: plan.limits,
      statusHistory: [
        {
          status: "PENDING",
          changedBy: actor.id,
          reason: "Stripe checkout initiated",
        },
      ],
    });

    await writeAuditLog({
      actor,
      action: "subscription.checkout_started",
      targetType: "Subscription",
      targetId: subscription._id,
      metadata: { planCode: plan.code, billingInterval, stripeSessionId: session.id },
      request,
    });

    return apiSuccess({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    return handleApiError(error, "payment.subscription");
  }
}
