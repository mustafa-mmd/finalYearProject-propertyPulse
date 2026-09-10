import mongoose from "mongoose";
import connectDB from "@/config/database";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import Lease from "@/models/Lease";
import SaleTransaction from "@/models/SaleTransaction";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!mongoose.isValidObjectId(propertyId)) {
      return apiError("Invalid property ID", { status: 422, code: "VALIDATION_ERROR" });
    }

    await connectDB();

    const items = await Review.find({
      propertyId,
      status: "PUBLISHED",
      deletedAt: { $exists: false },
    })
      .populate("authorId", "name image verification.status")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const summary = await Review.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          status: "PUBLISHED",
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    return apiSuccess({
      items,
      summary: summary[0] || { average: 0, count: 0 },
    });
  } catch (error) {
    return handleApiError(error, "reviews.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();

    if (
      !mongoose.isValidObjectId(body.transactionId) ||
      !["BOOKING", "LEASE", "SALE"].includes(body.transactionType)
    ) {
      return apiError("Invalid completed transaction", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    const rating = Number(body.rating);
    const text = String(body.body || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 10) {
      return apiError("Rating and a meaningful review (at least 10 characters) are required", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectDB();
    let transaction;

    if (body.transactionType === "BOOKING") {
      transaction = await Booking.findOne({
        _id: body.transactionId,
        guestId: actor.id,
        status: "COMPLETED",
      });
    }
    if (body.transactionType === "LEASE") {
      transaction = await Lease.findOne({
        _id: body.transactionId,
        tenantUserIds: actor.id,
        status: { $in: ["ACTIVE", "ENDED"] },
      });
    }
    if (body.transactionType === "SALE") {
      transaction = await SaleTransaction.findOne({
        _id: body.transactionId,
        buyerId: actor.id,
        status: "CLOSED",
      });
    }

    if (!transaction) {
      return apiError("Only verified participants can review a completed transaction", {
        status: 403,
        code: "REVIEW_NOT_ELIGIBLE",
      });
    }

    const propertyId = transaction.propertyId;
    const subjectUserId =
      transaction.ownerId || transaction.landlordId || transaction.sellerId;

    const review = await Review.create({
      tenantId: transaction.tenantId,
      propertyId,
      authorId: actor.id,
      subjectUserId,
      transactionType: body.transactionType,
      transactionId: transaction._id,
      rating,
      title: String(body.title || "").trim().slice(0, 120),
      body: text.slice(0, 3000),
      status:
        text.includes("http://") || text.includes("https://")
          ? "PENDING_MODERATION"
          : "PUBLISHED",
    });

    await writeAuditLog({
      actor,
      action: "review.create",
      targetType: "Review",
      targetId: review._id,
      tenantId: transaction.tenantId,
      request,
    });

    return apiSuccess({ id: review._id.toString(), status: review.status }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "reviews.create");
  }
}
