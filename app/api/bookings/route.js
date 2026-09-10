import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import BookingNight from "@/models/BookingNight";
import AvailabilityBlock from "@/models/AvailabilityBlock";
import { dateOnly, enumerateNights } from "@/config/commerce";
import { listingPublicFilter } from "@/config/listings";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { emitNotification } from "@/utils/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const items = await Booking.find({
      $or: [{ guestId: actor.id }, { ownerId: actor.id }],
      deletedAt: { $exists: false },
    })
      .populate("propertyId", "name images listingReference location")
      .populate("guestId", "name email image")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "bookings.list");
  }
}

export async function POST(request) {
  let bookingId;
  try {
    const actor = await requireActor();
    const body = await request.json();

    if (!mongoose.isValidObjectId(body.propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const nights = enumerateNights(body.checkIn, body.checkOut);
    const startOfToday = dateOnly(new Date());

    if (!nights.length || nights[0] < startOfToday) {
      return apiError("Choose between 1 and 365 future nights", {
        status: 422,
        code: "INVALID_DATES",
      });
    }

    const guests = Math.min(
      50,
      Math.max(1, Number.parseInt(body.guests, 10) || 1)
    );

    await connectDB();

    const property = await Property.findOne({
      _id: body.propertyId,
      ...listingPublicFilter(),
      $or: [
        {
          listingPurpose: {
            $in: [
              "SHORT_TERM_RENT",
              "LONG_TERM_RENT",
              "SHARED_ACCOMMODATION",
              "STUDENT_ACCOMMODATION",
            ],
          },
        },
        { listingPurpose: { $exists: false } },
      ],
    });

    if (!property) {
      return apiError("Bookable property not found", {
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const { isPropertyOwner, getPropertyOwnerId } = await import("@/utils/authorization");

    if (isPropertyOwner(property, actor)) {
      return apiError("You cannot book your own listing", {
        status: 409,
        code: "SELF_ACTION_DENIED",
      });
    }

    const ownerId = getPropertyOwnerId(property);


    const blocked = await AvailabilityBlock.exists({
      propertyId: property._id,
      deletedAt: { $exists: false },
      startDate: { $lt: new Date(body.checkOut) },
      endDate: { $gt: new Date(body.checkIn) },
    });

    if (blocked) {
      return apiError("Those dates are unavailable", {
        status: 409,
        code: "DATES_UNAVAILABLE",
      });
    }

    bookingId = new mongoose.Types.ObjectId();
    const holdExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    try {
      await BookingNight.insertMany(
        nights.map((date) => ({
          propertyId: property._id,
          bookingId,
          date,
          status: "HELD",
          holdExpiresAt,
        })),
        { ordered: true }
      );
    } catch (error) {
      await BookingNight.deleteMany({ bookingId });
      if (error?.code === 11000) {
        return apiError(
          "Some dates were just reserved. Choose different dates.",
          { status: 409, code: "DATES_UNAVAILABLE" }
        );
      }
      throw error;
    }

    // Effective per-night rate with fallbacks to weekly / monthly / pricing
    const nightlyRate =
      Number(property.rates?.nightly || 0) ||
      (property.rates?.weekly ? Math.round(property.rates.weekly / 7) : 0) ||
      (property.rates?.monthly ? Math.round(property.rates.monthly / 30) : 0) ||
      (property.pricing?.monthlyRent ? Math.round(property.pricing.monthlyRent / 30) : 0);

    if (nightlyRate <= 0) {
      await BookingNight.deleteMany({ bookingId });
      return apiError("Rate not set for this property. Contact the host.", {
        status: 422,
        code: "MISSING_RATE",
      });
    }

    const subtotal = nightlyRate * nights.length;

    const booking = await Booking.create({
      _id: bookingId,
      tenantId: property.tenantId,
      propertyId: property._id,
      guestId: actor.id,
      ownerId,
      checkIn: nights[0],
      checkOut: new Date(body.checkOut),
      nights: nights.length,
      guests,
      nightlyRate,
      subtotal,
      total: subtotal,
      currency: property.currency || "ZAR",
      message:
        typeof body.message === "string"
          ? body.message.trim().slice(0, 1000)
          : "",
      statusHistory: [
        {
          status: "REQUESTED",
          changedBy: actor.id,
          reason: "Booking requested",
        },
      ],
    });

    await writeAuditLog({
      actor,
      action: "booking.request",
      targetType: "Booking",
      targetId: booking._id,
      tenantId: property.tenantId,
      metadata: {
        propertyId: property._id,
        nights: nights.length,
        total: subtotal,
      },
      request,
    });

    await emitNotification({
      recipientId: ownerId,
      tenantId: property.tenantId,
      type: "BOOKING_REQUESTED",
      title: "New booking request",
      body: `${actor.name || "A guest"} requested ${nights.length} night(s) at ${property.name}.`,
      href: "/bookings",
      dedupeKey: `booking-request:${booking._id}`,
      channels: ["IN_APP", "EMAIL"],
    });

    let checkoutUrl = null;
    if (body.instantCheckout) {
      try {
        const crypto = await import("crypto");
        const Payment = (await import("@/models/Payment")).default;
        const transactionId = crypto.randomUUID();
        const paymentId = `booking-${booking._id}-${crypto.randomUUID()}`;

        await Payment.create({
          transactionId,
          userId: actor.id,
          paymentId,
          provider: "stripe",
          userName: actor.name || "Guest",
          userEmail: actor.email,
          propertyId: property._id,
          propertyName: property.name,
          amount: subtotal,
          currency: property.currency || "ZAR",
          paymentType: "nightly",
          paymentStatus: "pending",
          bookingStartDate: nights[0],
          bookingEndDate: new Date(body.checkOut),
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
                  currency: (property.currency || "ZAR").toLowerCase(),
                  unit_amount: Math.round(subtotal * 100),
                  product_data: {
                    name: `${property.name} - Stay Reservation (${nights.length} night${nights.length > 1 ? "s" : ""})`,
                    description: `Stay reservation from ${nights[0].toISOString().slice(0, 10)} to ${body.checkOut}`,
                  },
                },
              },
            ],
            metadata: {
              transactionId,
              paymentId,
              bookingId: booking._id.toString(),
              propertyId: property._id.toString(),
              userId: actor.id,
              paymentType: "booking",
            },
            success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/bookings`,
          });

          await Payment.updateOne({ transactionId }, { provider: "stripe" });
          checkoutUrl = session.url;
        }
      } catch (checkoutErr) {
        console.error("[bookings.create] Could not generate instant checkout:", checkoutErr);
      }
    }

    return apiSuccess(
      {
        id: booking._id.toString(),
        status: booking.status,
        total: booking.total,
        currency: booking.currency,
        holdExpiresAt,
        checkoutUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (bookingId) await BookingNight.deleteMany({ bookingId }).catch(() => {});
    return handleApiError(error, "bookings.create");
  }
}

