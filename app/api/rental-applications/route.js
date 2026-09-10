import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import RentalApplication from "@/models/RentalApplication";
import { dateOnly } from "@/config/commerce";
import { listingPublicFilter } from "@/config/listings";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const items = await RentalApplication.find({
      $or: [{ applicantId: actor.id }, { ownerId: actor.id }],
      deletedAt: { $exists: false },
    })
      .populate("propertyId", "name images listingReference pricing rates location")
      .populate("applicantId", "name email image verification.status")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "applications.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();

    if (!mongoose.isValidObjectId(body.propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const desiredMoveIn = new Date(body.desiredMoveIn);
    const startOfToday = dateOnly(new Date());

    if (Number.isNaN(desiredMoveIn.getTime()) || desiredMoveIn < startOfToday) {
      return apiError("Choose a future move-in date starting today or later", {
        status: 422,
        code: "INVALID_DATE",
      });
    }

    if (body.privacyPolicy !== true) {
      return apiError("Privacy consent is required", {
        status: 422,
        code: "CONSENT_REQUIRED",
      });
    }

    await connectDB();

    const property = await Property.findOne({
      _id: body.propertyId,
      ...listingPublicFilter(),
    });

    if (!property) {
      return apiError("Rental property not found", { status: 404, code: "NOT_FOUND" });
    }

    const { isPropertyOwner, getPropertyOwnerId } = await import("@/utils/authorization");

    if (isPropertyOwner(property, actor)) {
      return apiError("You cannot apply to your own listing", {
        status: 409,
        code: "SELF_ACTION_DENIED",
      });
    }

    const ownerId = getPropertyOwnerId(property);


    // Check if an active application already exists
    const existing = await RentalApplication.findOne({
      propertyId: property._id,
      applicantId: actor.id,
      status: { $in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
    });

    if (existing) {
      // Update the existing application with new parameters
      existing.desiredMoveIn = desiredMoveIn;
      existing.occupants = Math.min(30, Math.max(1, Number(body.occupants) || 1));
      existing.monthlyIncome = Math.max(0, Number(body.monthlyIncome) || 0);
      existing.employmentStatus = String(body.employmentStatus || "").trim().slice(0, 100);
      existing.message = String(body.message || "").trim().slice(0, 2000);
      existing.consent = { privacyPolicy: true, creditCheck: body.creditCheck === true };
      await existing.save();

      await writeAuditLog({
        actor,
        action: "rental_application.update",
        targetType: "RentalApplication",
        targetId: existing._id,
        tenantId: property.tenantId,
        request,
      });

      return apiSuccess(
        { id: existing._id.toString(), status: existing.status, updated: true },
        { status: 200 }
      );
    }

    const application = await RentalApplication.create({
      tenantId: property.tenantId,
      propertyId: property._id,
      applicantId: actor.id,
      ownerId,
      desiredMoveIn,
      occupants: Math.min(30, Math.max(1, Number(body.occupants) || 1)),
      monthlyIncome: Math.max(0, Number(body.monthlyIncome) || 0),
      employmentStatus: String(body.employmentStatus || "").trim().slice(0, 100),
      message: String(body.message || "").trim().slice(0, 2000),
      consent: { privacyPolicy: true, creditCheck: body.creditCheck === true },
    });

    await writeAuditLog({
      actor,
      action: "rental_application.submit",
      targetType: "RentalApplication",
      targetId: application._id,
      tenantId: property.tenantId,
      request,
    });

    let checkoutUrl = null;
    if (body.instantCheckout) {
      try {
        const crypto = await import("crypto");
        const Payment = (await import("@/models/Payment")).default;
        const transactionId = crypto.randomUUID();
        const paymentId = `app-${application._id}-${crypto.randomUUID()}`;
        const amount = Number(property.pricing?.monthlyRent || property.rates?.monthly || property.rates?.nightly || 1000);
        const currency = property.currency || "ZAR";

        await Payment.create({
          transactionId,
          userId: actor.id,
          paymentId,
          provider: "stripe",
          userName: actor.name || "Applicant",
          userEmail: actor.email,
          propertyId: property._id,
          propertyName: property.name,
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
                    name: `${property.name} - Holding Deposit`,
                    description: `Holding deposit / rental application fee for ${property.name}`,
                  },
                },
              },
            ],
            metadata: {
              transactionId,
              paymentId,
              applicationId: application._id.toString(),
              propertyId: property._id.toString(),
              userId: actor.id,
              paymentType: "holding_deposit",
            },
            success_url: `${origin}/payment/success?tid=${transactionId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/rental-applications`,
          });

          await Payment.updateOne({ transactionId }, { provider: "stripe" });
          checkoutUrl = session.url;
        }
      } catch (checkoutErr) {
        console.error("[rental-applications.create] Could not generate instant checkout:", checkoutErr);
      }
    }

    return apiSuccess({ id: application._id.toString(), status: application.status, checkoutUrl }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "applications.create");
  }
}
