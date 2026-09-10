import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import ViewingAppointment from "@/models/ViewingAppointment";
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
    const items = await ViewingAppointment.find({
      $or: [{ requesterId: actor.id }, { ownerId: actor.id }],
      deletedAt: { $exists: false },
    })
      .populate("propertyId", "name listingReference images location")
      .populate("requesterId", "name email image")
      .populate("ownerId", "name email image")
      .sort({ scheduledStart: 1 })
      .limit(200)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "viewings.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";

    if (!mongoose.isValidObjectId(propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const start = new Date(body.scheduledStart);
    const durationMinutes = Math.min(180, Math.max(15, Number(body.durationMinutes) || 30));
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const startOfToday = dateOnly(new Date());

    if (
      Number.isNaN(start.getTime()) ||
      start < startOfToday ||
      start > new Date(Date.now() + 366 * 24 * 60 * 60_000)
    ) {
      return apiError("Choose a future viewing time starting today or later", {
        status: 422,
        code: "INVALID_SCHEDULE",
      });
    }

    const type = body.type === "VIRTUAL" ? "VIRTUAL" : "IN_PERSON";
    const timezone = typeof body.timezone === "string" ? body.timezone.trim().slice(0, 100) : "UTC";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";

    await connectDB();
    const property = await Property.findOne({ _id: propertyId, ...listingPublicFilter() });
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });

    const ownerId = property.owner?.[0]?.toString();
    if (!ownerId || ownerId === actor.id) {
      return apiError("You cannot request a viewing for your own listing", {
        status: 409,
        code: "SELF_ACTION_DENIED",
      });
    }

    // Update existing viewing appointment if one exists
    const existing = await ViewingAppointment.findOne({
      propertyId: property._id,
      requesterId: actor.id,
      status: { $in: ["REQUESTED", "CONFIRMED"] },
    });

    if (existing) {
      existing.scheduledStart = start;
      existing.scheduledEnd = end;
      existing.type = type;
      existing.timezone = timezone;
      existing.message = message;
      await existing.save();

      await writeAuditLog({
        actor,
        action: "viewing.update",
        targetType: "ViewingAppointment",
        targetId: existing._id,
        tenantId: property.tenantId,
        metadata: { propertyId, scheduledStart: start.toISOString(), type },
        request,
      });

      return apiSuccess({ id: existing._id.toString(), status: existing.status, updated: true }, { status: 200 });
    }

    const viewing = await ViewingAppointment.create({
      tenantId: property.tenantId || undefined,
      propertyId: property._id,
      requesterId: actor.id,
      ownerId,
      type,
      status: "REQUESTED",
      scheduledStart: start,
      scheduledEnd: end,
      timezone,
      message,
      statusHistory: [{ status: "REQUESTED", changedBy: actor.id, reason: "Viewing requested" }],
    });

    await Property.updateOne({ _id: property._id }, { $inc: { "metrics.viewingRequests": 1 } });
    await writeAuditLog({
      actor,
      action: "viewing.request",
      targetType: "ViewingAppointment",
      targetId: viewing._id,
      tenantId: property.tenantId,
      metadata: { propertyId, scheduledStart: start.toISOString(), type },
      request,
    });

    return apiSuccess({ id: viewing._id.toString(), status: viewing.status }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "viewings.create");
  }
}
