import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  try {
    const actor = await requireActor();
    const isOwnerOrAdmin =
      actor.roles?.includes("PLATFORM_OWNER") ||
      actor.roles?.includes("SUPER_ADMIN") ||
      actor.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com" ||
      actor.permissions?.includes("properties.review");

    const body = await request.json();
    const ids = Array.from(new Set(Array.isArray(body.ids) ? body.ids : []))
      .filter(mongoose.isValidObjectId)
      .slice(0, 500);

    if (!ids.length) {
      return apiError("Select at least one listing", { status: 422, code: "VALIDATION_ERROR" });
    }

    const action = (body.action || "").toUpperCase();

    await connectDB();

    const queryFilter = isOwnerOrAdmin
      ? { _id: { $in: ids } }
      : { _id: { $in: ids }, owner: actor.id };

    let updateDoc = {};
    let statusReason = `Bulk action: ${action}`;

    if (action === "PUBLISH") {
      updateDoc = {
        $set: {
          listingStatus: "PUBLISHED",
          publishedAt: new Date(),
          approvedAt: new Date(),
          "verification.status": "VERIFIED",
          "verification.verifiedBy": actor.id,
          "verification.verifiedAt": new Date(),
        },
        $push: {
          statusHistory: {
            status: "PUBLISHED",
            changedBy: actor.id,
            reason: "Bulk published by admin",
            at: new Date(),
          },
        },
      };
    } else if (action === "UNPUBLISH" || action === "RETURN_TO_DRAFT" || action === "DRAFT") {
      updateDoc = {
        $set: {
          listingStatus: "DRAFT",
          "verification.status": "NOT_SUBMITTED",
        },
        $push: {
          statusHistory: {
            status: "DRAFT",
            changedBy: actor.id,
            reason: "Bulk reverted to draft by admin",
            at: new Date(),
          },
        },
      };
    } else if (action === "DELETE" || action === "ARCHIVE") {
      updateDoc = {
        $set: {
          listingStatus: "ARCHIVED",
          deletedAt: new Date(),
          archivedAt: new Date(),
        },
        $push: {
          statusHistory: {
            status: "ARCHIVED",
            changedBy: actor.id,
            reason: "Bulk archived/deleted by admin",
            at: new Date(),
          },
        },
      };
    } else {
      return apiError("Invalid bulk action type", { status: 422, code: "VALIDATION_ERROR" });
    }

    const result = await Property.updateMany(queryFilter, updateDoc);

    await writeAuditLog({
      actor,
      action: `listing.bulk_${action.toLowerCase()}`,
      targetType: "Property",
      targetId: ids[0],
      metadata: { selected: ids.length, updated: result.modifiedCount, action },
      request,
    });

    return apiSuccess({
      selected: ids.length,
      updated: result.modifiedCount,
      action,
    });
  } catch (error) {
    return handleApiError(error, "listings.bulk-edit");
  }
}
