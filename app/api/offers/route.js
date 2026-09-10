import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import Offer from "@/models/Offer";
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
    const items = await Offer.find({
      $or: [{ buyerId: actor.id }, { sellerId: actor.id }],
      deletedAt: { $exists: false },
    })
      .populate("propertyId", "name images listingReference pricing currency location")
      .populate("buyerId", "name email verification.status")
      .sort({ updatedAt: -1 })
      .limit(250)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "offers.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();

    if (!mongoose.isValidObjectId(body.propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const amount = Number(body.amount);
    const closing = new Date(body.proposedClosingDate);
    const expires = new Date(body.expiresAt);
    const startOfToday = dateOnly(new Date());

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Number.isNaN(closing.getTime()) ||
      closing < startOfToday ||
      Number.isNaN(expires.getTime()) ||
      expires < startOfToday ||
      expires > new Date(Date.now() + 180 * 86_400_000)
    ) {
      return apiError("Enter a valid amount and future dates for closing & offer expiry", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectDB();

    const property = await Property.findOne({
      _id: body.propertyId,
      ...listingPublicFilter(),
    });

    if (!property) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const { isPropertyOwner, getPropertyOwnerId } = await import("@/utils/authorization");

    if (isPropertyOwner(property, actor)) {
      return apiError("You cannot offer on your own listing", {
        status: 409,
        code: "SELF_ACTION_DENIED",
      });
    }

    const sellerId = getPropertyOwnerId(property);


    const id = new mongoose.Types.ObjectId();
    const offer = await Offer.create({
      _id: id,
      rootOfferId: id,
      tenantId: property.tenantId,
      propertyId: property._id,
      buyerId: actor.id,
      sellerId,
      submittedBy: actor.id,
      currency: property.currency || "ZAR",
      amount,
      depositAmount: Math.max(0, Number(body.depositAmount) || 0),
      financingType: ["CASH", "MORTGAGE", "OTHER"].includes(body.financingType)
        ? body.financingType
        : "MORTGAGE",
      financingContingency: body.financingContingency !== false,
      inspectionContingency: body.inspectionContingency !== false,
      proposedClosingDate: closing,
      expiresAt: expires,
      message: String(body.message || "").trim().slice(0, 3000),
    });

    await writeAuditLog({
      actor,
      action: "offer.submit",
      targetType: "Offer",
      targetId: offer._id,
      tenantId: property.tenantId,
      metadata: { propertyId: property._id, amount, currency: offer.currency },
      request,
    });

    return apiSuccess({ id: offer._id.toString(), status: offer.status }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "offers.create");
  }
}
