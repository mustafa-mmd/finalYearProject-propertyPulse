import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import Property from "@/models/Property";
import { buildLocationLabel, normalizeLocation } from "@/utils/location";
import {
  createPayfastSignature,
  getPayfastConfig,
  getTrustedPropertyRate,
  PAYFAST_CURRENCY,
  PAYMENT_TYPES,
  validateCustomer,
} from "@/utils/payfast";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";
import { requireActor } from "@/utils/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request) {
  const rateLimit = await checkRateLimit(`payment:${getClientIp(request)}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return json(
      { error: "Too many payment attempts. Please try again shortly." },
      429,
      { "Retry-After": String(rateLimit.retryAfter) }
    );
  }

  try {
    const actor = await requireActor();
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000) {
      return json({ error: "Request is too large" }, 413);
    }

    const body = await request.json();
    await connectDB();

    // ── Handle existing Booking payment ──
    if (body.bookingId) {
      if (!mongoose.isValidObjectId(body.bookingId)) {
        return json({ error: "Invalid booking ID" }, 400);
      }
      const Booking = (await import("@/models/Booking")).default;
      const booking = await Booking.findById(body.bookingId).populate("propertyId").lean();
      if (!booking) return json({ error: "Booking not found" }, 404);
      if (booking.guestId.toString() !== actor.id) {
        return json({ error: "You can only pay for your own bookings" }, 403);
      }

      const propertyObj = booking.propertyId || {};
      const propertyName = propertyObj.name || "Property Stay";
      const amount = Number(booking.total);
      const currency = booking.currency || "ZAR";
      const transactionId = crypto.randomUUID();
      const paymentId = `booking-${booking._id}-${crypto.randomUUID()}`;

      await Payment.create({
        transactionId,
        userId: actor.id,
        paymentId,
        provider: "stripe",
        userName: actor.name || "Guest",
        userEmail: actor.email,
        userPhone: body.userPhone || "",
        propertyId: propertyObj._id || booking.propertyId,
        propertyName,
        amount,
        currency,
        paymentType: "nightly",
        paymentStatus: "pending",
        bookingStartDate: booking.checkIn,
        bookingEndDate: booking.checkOut,
        statusHistory: [{ status: "pending", source: "checkout", reference: paymentId }],
      });

      if (process.env.STRIPE_SECRET_KEY) {
        const stripeModule = await import("@/config/stripe");
        const stripe = stripeModule.default;
        const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: actor.email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: Math.round(amount * 100),
                product_data: {
                  name: `${propertyName} - Stay Reservation (${booking.nights} night${booking.nights > 1 ? "s" : ""})`,
                  description: `Stay reservation at ${propertyName}`,
                },
              },
            },
          ],
          metadata: {
            transactionId,
            paymentId,
            bookingId: booking._id.toString(),
            propertyId: (propertyObj._id || booking.propertyId).toString(),
            userId: actor.id,
            paymentType: "booking",
          },
          success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/bookings`,
        });

        await Payment.updateOne({ transactionId }, { provider: "stripe" });
        return json({ redirectUrl: session.url, transactionId, provider: "stripe" });
      }

      const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
      await Payment.updateOne({ transactionId }, { paymentStatus: "completed", paidAt: new Date(), provider: "demo" });
      return json({ redirectUrl: `${origin}/payment/success?tid=${transactionId}`, transactionId, provider: "demo" });
    }

    // ── Handle purchase Offer Earnest Deposit payment ──
    if (body.offerId) {
      if (!mongoose.isValidObjectId(body.offerId)) {
        return json({ error: "Invalid offer ID" }, 400);
      }
      const Offer = (await import("@/models/Offer")).default;
      const offer = await Offer.findById(body.offerId).populate("propertyId").lean();
      if (!offer) return json({ error: "Offer not found" }, 404);

      const propertyObj = offer.propertyId || {};
      const propertyName = propertyObj.name || "Property Purchase";
      const amount = Number(offer.depositAmount > 0 ? offer.depositAmount : offer.amount);
      const currency = offer.currency || "ZAR";
      const transactionId = crypto.randomUUID();
      const paymentId = `offer-${offer._id}-${crypto.randomUUID()}`;

      await Payment.create({
        transactionId,
        userId: actor.id,
        paymentId,
        provider: "stripe",
        userName: actor.name || "Buyer",
        userEmail: actor.email,
        userPhone: body.userPhone || "",
        propertyId: propertyObj._id || offer.propertyId,
        propertyName,
        amount,
        currency,
        paymentType: "monthly",
        paymentStatus: "pending",
        statusHistory: [{ status: "pending", source: "checkout", reference: paymentId }],
      });

      if (process.env.STRIPE_SECRET_KEY) {
        const stripeModule = await import("@/config/stripe");
        const stripe = stripeModule.default;
        const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: actor.email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: Math.round(amount * 100),
                product_data: {
                  name: `${propertyName} - Earnest Deposit`,
                  description: `Earnest deposit for property purchase offer`,
                },
              },
            },
          ],
          metadata: {
            transactionId,
            paymentId,
            offerId: offer._id.toString(),
            propertyId: (propertyObj._id || offer.propertyId).toString(),
            userId: actor.id,
            paymentType: "offer_deposit",
          },
          success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/offers`,
        });

        await Payment.updateOne({ transactionId }, { provider: "stripe" });
        return json({ redirectUrl: session.url, transactionId, provider: "stripe" });
      }

      const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
      await Payment.updateOne({ transactionId }, { paymentStatus: "completed", paidAt: new Date(), provider: "demo" });
      return json({ redirectUrl: `${origin}/payment/success?tid=${transactionId}`, transactionId, provider: "demo" });
    }

    // ── Handle Rental Application Holding Deposit payment ──
    if (body.applicationId) {
      if (!mongoose.isValidObjectId(body.applicationId)) {
        return json({ error: "Invalid application ID" }, 400);
      }
      const RentalApplication = (await import("@/models/RentalApplication")).default;
      const application = await RentalApplication.findById(body.applicationId).populate("propertyId").lean();
      if (!application) return json({ error: "Application not found" }, 404);

      const propertyObj = application.propertyId || {};
      const propertyName = propertyObj.name || "Rental Property";
      const amount = Number(propertyObj.pricing?.monthlyRent || propertyObj.rates?.monthly || propertyObj.rates?.nightly || 1000);
      const currency = propertyObj.currency || "ZAR";
      const transactionId = crypto.randomUUID();
      const paymentId = `app-${application._id}-${crypto.randomUUID()}`;

      await Payment.create({
        transactionId,
        userId: actor.id,
        paymentId,
        provider: "stripe",
        userName: actor.name || "Applicant",
        userEmail: actor.email,
        userPhone: body.userPhone || "",
        propertyId: propertyObj._id || application.propertyId,
        propertyName,
        amount,
        currency,
        paymentType: "monthly",
        paymentStatus: "pending",
        statusHistory: [{ status: "pending", source: "checkout", reference: paymentId }],
      });

      if (process.env.STRIPE_SECRET_KEY) {
        const stripeModule = await import("@/config/stripe");
        const stripe = stripeModule.default;
        const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: actor.email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: Math.round(amount * 100),
                product_data: {
                  name: `${propertyName} - Holding Deposit`,
                  description: `Holding deposit for rental application at ${propertyName}`,
                },
              },
            },
          ],
          metadata: {
            transactionId,
            paymentId,
            applicationId: application._id.toString(),
            propertyId: (propertyObj._id || application.propertyId).toString(),
            userId: actor.id,
            paymentType: "holding_deposit",
          },
          success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/rental-applications`,
        });

        await Payment.updateOne({ transactionId }, { provider: "stripe" });
        return json({ redirectUrl: session.url, transactionId, provider: "stripe" });
      }

      const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
      await Payment.updateOne({ transactionId }, { paymentStatus: "completed", paidAt: new Date(), provider: "demo" });
      return json({ redirectUrl: `${origin}/payment/success?tid=${transactionId}`, transactionId, provider: "demo" });
    }

    const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
    const paymentType = typeof body.type === "string" ? body.type.toLowerCase() : "";

    if (!mongoose.isValidObjectId(propertyId) || !PAYMENT_TYPES.includes(paymentType)) {
      return json({ error: "Invalid property or payment option" }, 400);
    }

    const customer = validateCustomer(body);
    if (customer.error) return json({ error: customer.error }, 400);

    const config = getPayfastConfig();

    const property = await Property.findById(propertyId)
      .select("name location rates currency")
      .lean();

    if (!property) return json({ error: "Property not found" }, 404);

    const amount = getTrustedPropertyRate(property, paymentType);
    if (!amount) {
      return json({ error: "This payment option is not available" }, 400);
    }

    const currency = property.currency || PAYFAST_CURRENCY;
    if (currency !== PAYFAST_CURRENCY && !process.env.STRIPE_SECRET_KEY) {
      return json({ error: "This property's currency is not supported by PayFast" }, 400);
    }

    const transactionId = crypto.randomUUID();
    const paymentId = `property-${propertyId}-${crypto.randomUUID()}`;
    const location = normalizeLocation(property.location);
    const { userPhone } = customer.value;
    const userName = actor.name;
    const userEmail = actor.email;

    await Payment.create({
      transactionId,
      userId: actor.id,
      paymentId,
      provider: "payfast",
      userName,
      userEmail,
      userPhone,
      propertyId,
      propertyName: property.name,
      propertyAddress: location.formattedAddress || buildLocationLabel(location),
      amount,
      currency,
      paymentType,
      paymentStatus: "pending",
      statusHistory: [
        { status: "pending", source: "checkout", reference: paymentId },
      ],
    });

    // Check if Stripe is configured for global payments
    if (process.env.STRIPE_SECRET_KEY) {
      const stripeModule = await import("@/config/stripe");
      const stripe = stripeModule.default;
      const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: userEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: `${property.name} - ${paymentType} payment`,
                description: `Payment for property ${property.name} (${paymentType})`,
              },
            },
          },
        ],
        metadata: {
          transactionId,
          paymentId,
          propertyId,
          userId: actor.id,
          paymentType,
        },
        success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment/cancel?tid=${transactionId}&propertyId=${propertyId}`,
      });

      // Update provider to stripe in DB record
      await Payment.updateOne({ transactionId }, { provider: "stripe" });

      return json({ redirectUrl: session.url, transactionId, provider: "stripe" });
    }

    // Demo mode fallback when external payment gateways (Stripe / PayFast) are not configured locally
    if (!process.env.STRIPE_SECRET_KEY && (!process.env.PAYFAST_MERCHANT_ID || currency !== PAYFAST_CURRENCY)) {
      const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
      await Payment.updateOne({ transactionId }, { paymentStatus: "completed", paidAt: new Date(), provider: "demo" });
      return json({ redirectUrl: `${origin}/payment/success?tid=${transactionId}`, transactionId, provider: "demo" });
    }

    // PayFast fallback for ZAR
    if (currency !== PAYFAST_CURRENCY) {
      return json({ error: `Currency ${currency} requires Stripe configuration` }, 400);
    }

    const returnUrl = new URL(config.returnUrl);
    returnUrl.searchParams.set("tid", transactionId);
    const cancelUrl = new URL(config.cancelUrl);
    cancelUrl.searchParams.set("tid", transactionId);
    cancelUrl.searchParams.set("propertyId", propertyId);

    const nameParts = userName.split(/\s+/);
    const paymentData = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      notify_url: config.notifyUrl,
      name_first: nameParts[0],
      name_last: nameParts.slice(1).join(" "),
      email_address: userEmail,
      m_payment_id: paymentId,
      amount: amount.toFixed(2),
      item_name: `${property.name} - ${paymentType}`.slice(0, 100),
    };

    paymentData.signature = createPayfastSignature(
      paymentData,
      config.passphrase
    );

    const redirectUrl = new URL(config.gatewayUrl);
    for (const [key, value] of Object.entries(paymentData)) {
      if (value !== "") redirectUrl.searchParams.append(key, String(value));
    }

    return json({ redirectUrl: redirectUrl.toString(), transactionId, provider: "payfast" });
  } catch (error) {
    console.error("[payment] Could not create checkout", {
      name: error?.name,
      code: error?.code,
    });
    return json({ error: "Payment could not be started. Please try again." }, 500);
  }
}
