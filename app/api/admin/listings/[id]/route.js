import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { recordListingVersion } from "@/utils/listingVersions";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor();
    const isOwner =
      actor.roles?.includes("PLATFORM_OWNER") ||
      actor.roles?.includes("SUPER_ADMIN") ||
      actor.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com";
    const canReview = actor.permissions?.includes("properties.review") || isOwner;

    if (!canReview) {
      return apiError("Admin permissions required to modify listing status", {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Invalid listing ID", { status: 404, code: "NOT_FOUND" });
    }

    const body = await request.json();
    const { status, reason } = body;

    const VALID_STATUSES = ["PUBLISHED", "DRAFT", "SUSPENDED", "CHANGES_REQUESTED", "ARCHIVED"];
    if (!VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`, {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectDB();
    const property = await Property.findById(id);
    if (!property) {
      return apiError("Listing not found", { status: 404, code: "NOT_FOUND" });
    }

    const oldStatus = property.listingStatus;
    property.listingStatus = status;

    if (status === "PUBLISHED") {
      property.publishedAt = property.publishedAt || new Date();
      property.approvedAt = property.approvedAt || new Date();
      property.verification.status = "VERIFIED";
      property.verification.verifiedBy = actor.id;
      property.verification.verifiedAt = new Date();
    } else if (status === "ARCHIVED") {
      property.deletedAt = new Date();
      property.archivedAt = new Date();
    }

    property.statusHistory.push({
      status,
      changedBy: actor.id,
      reason: reason || `Status manually changed to ${status} by admin`,
    });

    await property.save();

    await Promise.all([
      recordListingVersion(property, actor.id, "STATUS_CHANGED", { reason: `Changed to ${status}` }),
      writeAuditLog({
        actor,
        action: "listing.admin_update_status",
        targetType: "Property",
        targetId: property._id,
        tenantId: property.tenantId,
        metadata: { oldStatus, newStatus: status, reason },
        request,
      }),
    ]);

    return apiSuccess({
      id: property._id.toString(),
      listingStatus: property.listingStatus,
      verificationStatus: property.verification.status,
    });
  } catch (error) {
    return handleApiError(error, "admin.listings.patch");
  }
}
