import stripe from "@/config/stripe";
import connectDB from "@/config/database";
import Subscription from "@/models/Subscription";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/stripe-webhook
 * Handles Stripe webhook events (checkout.session.completed, invoice.paid, etc.)
 * Activates subscriptions upon successful payment.
 */
export async function POST(request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    const rawBody = await request.text();
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Dev mode: parse without verification (NOT for production)
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, planCode, billingInterval, transactionId, bookingId, applicationId } = session.metadata || {};
        const stripeSubscriptionId = session.subscription;

        // Handle SaaS Subscription activation
        if (userId && planCode) {
          const sub = await Subscription.findOne({
            userId,
            planCode,
            status: "PENDING",
            provider: "STRIPE",
          });

          if (sub) {
            const now = new Date();
            const periodEnd = billingInterval === "ANNUAL"
              ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
              : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

            sub.status = "ACTIVE";
            sub.providerSubscriptionId = stripeSubscriptionId;
            sub.currentPeriodStart = now;
            sub.currentPeriodEnd = periodEnd;
            sub.statusHistory.push({
              status: "ACTIVE",
              reason: "Stripe checkout.session.completed",
              at: now,
            });
            await sub.save();
          }
        }

        // Handle One-Time Property Payment completion
        if (transactionId) {
          const Payment = (await import("@/models/Payment")).default;
          const payment = await Payment.findOne({ transactionId });
          if (payment && payment.paymentStatus !== "completed") {
            payment.paymentStatus = "completed";
            payment.paidAt = new Date();
            payment.statusHistory.push({
              status: "completed",
              source: "stripe_webhook",
              reference: session.id,
              at: new Date(),
            });
            await payment.save();
          }
        }

        // Handle Booking confirmation
        if (bookingId) {
          const Booking = (await import("@/models/Booking")).default;
          const BookingNight = (await import("@/models/BookingNight")).default;
          const booking = await Booking.findById(bookingId);
          if (booking && booking.status !== "CONFIRMED") {
            booking.status = "CONFIRMED";
            booking.statusHistory.push({
              status: "CONFIRMED",
              reason: "Stripe payment completed",
              at: new Date(),
            });
            await booking.save();
            await BookingNight.updateMany(
              { bookingId: booking._id },
              { $set: { status: "CONFIRMED" }, $unset: { holdExpiresAt: 1 } }
            );
          }
        }

        // Handle Purchase Offer deposit completion
        if (session.metadata?.offerId) {
          const Offer = (await import("@/models/Offer")).default;
          const offer = await Offer.findById(session.metadata.offerId);
          if (offer) {
            offer.status = "ACCEPTED";
            await offer.save();
          }
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const stripeSubId = invoice.subscription;
        if (!stripeSubId) break;

        const sub = await Subscription.findOne({ providerSubscriptionId: stripeSubId });
        if (sub && sub.status !== "ACTIVE") {
          sub.status = "ACTIVE";
          const now = new Date();
          sub.currentPeriodStart = now;
          sub.currentPeriodEnd = sub.billingInterval === "ANNUAL"
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          sub.statusHistory.push({ status: "ACTIVE", reason: "invoice.payment_succeeded", at: now });
          await sub.save();
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const stripeSubId = invoice.subscription;
        if (!stripeSubId) break;

        const sub = await Subscription.findOne({ providerSubscriptionId: stripeSubId });
        if (sub) {
          sub.status = "PAST_DUE";
          sub.statusHistory.push({ status: "PAST_DUE", reason: "invoice.payment_failed" });
          await sub.save();
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;
        const sub = await Subscription.findOne({ providerSubscriptionId: stripeSub.id });
        if (sub) {
          sub.status = "CANCELLED";
          sub.cancelledAt = new Date();
          sub.statusHistory.push({ status: "CANCELLED", reason: "customer.subscription.deleted" });
          await sub.save();
        }
        break;
      }

      default:
        // Unhandled event — acknowledge silently
        break;
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error, "stripe.webhook");
  }
}
