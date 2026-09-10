import mongoose from "mongoose";
import AvailabilityBlock from "@/models/AvailabilityBlock";
import BookingNight from "@/models/BookingNight";
import Property from "@/models/Property";
import { dateOnly, enumerateNights } from "@/config/commerce";
import { listingPublicFilter } from "@/config/listings";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { actorOwns, getActor, requireActor } from "@/utils/authorization";
import { writeAuditLog } from "@/utils/audit";

export async function GET(request) {
  try {
    const propertyId = new URL(request.url).searchParams.get("propertyId");
    if (!mongoose.isValidObjectId(propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    const actor = await getActor();
    const property = await Property.findById(propertyId).select("owner tenantId listingStatus deletedAt").lean();
    if (!property || property.deletedAt) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    const owner = actor ? actorOwns(actor, property.owner) : false;
    if (!owner) {
      const publicProperty = await Property.exists({ _id: propertyId, ...listingPublicFilter() });
      if (!publicProperty) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    const [blocks, nights] = await Promise.all([
      AvailabilityBlock.find({ propertyId, deletedAt: { $exists: false }, endDate: { $gte: new Date() } })
        .sort({ startDate: 1 })
        .lean(),
      BookingNight.find({ propertyId, date: { $gte: dateOnly(new Date()) } })
        .sort({ date: 1 })
        .limit(730)
        .lean(),
    ]);
    return apiSuccess({
      blocks: blocks.map((block) => ({
        id: owner ? block._id.toString() : undefined,
        startDate: block.startDate,
        endDate: block.endDate,
        type: owner ? block.type : "UNAVAILABLE",
        reason: owner ? block.reason : undefined,
      })),
      bookedDates: nights.map((night) => night.date),
      canManage: owner,
    });
  } catch (error) {
    return handleApiError(error, "availability.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.propertyId)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    const property = await Property.findById(body.propertyId);
    if (!property || property.deletedAt || !actorOwns(actor, property.owner)) {
      return apiError("Only the property owner can manage availability", { status: 403, code: "FORBIDDEN" });
    }
    const nights = enumerateNights(body.startDate, body.endDate);
    if (!nights.length) {
      return apiError("Choose a valid availability date range", { status: 422, code: "INVALID_DATES" });
    }
    const conflict = await BookingNight.exists({ propertyId: property._id, date: { $in: nights } });
    if (conflict) {
      return apiError("The range contains booked or held nights", { status: 409, code: "DATES_UNAVAILABLE" });
    }
    const type = ["OWNER_BLOCK", "MAINTENANCE", "EXTERNAL_BOOKING"].includes(body.type)
      ? body.type
      : "OWNER_BLOCK";
    const block = await AvailabilityBlock.create({
      tenantId: property.tenantId,
      propertyId: property._id,
      startDate: nights[0],
      endDate: dateOnly(body.endDate),
      type,
      reason: String(body.reason || "").trim().slice(0, 500),
      createdBy: actor.id,
    });
    await writeAuditLog({ actor, action: "availability.block_create", targetType: "AvailabilityBlock", targetId: block._id, tenantId: property.tenantId, metadata: { propertyId: property._id, type, nights: nights.length }, request });
    return apiSuccess({ id: block._id.toString() }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "availability.create");
  }
}

export async function DELETE(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.blockId)) {
      return apiError("Availability block not found", { status: 404, code: "NOT_FOUND" });
    }
    const block = await AvailabilityBlock.findById(body.blockId).populate("propertyId", "owner");
    if (!block || block.deletedAt || !actorOwns(actor, block.propertyId?.owner || [])) {
      return apiError("Availability block not found", { status: 404, code: "NOT_FOUND" });
    }
    block.deletedAt = new Date();
    await block.save();
    await writeAuditLog({ actor, action: "availability.block_delete", targetType: "AvailabilityBlock", targetId: block._id, tenantId: block.tenantId, request });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "availability.delete");
  }
}
