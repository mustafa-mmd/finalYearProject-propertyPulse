import mongoose from "mongoose";
import connectDB from "@/config/database";
import RentalApplication from "@/models/RentalApplication";
import Lease from "@/models/Lease";
import Property from "@/models/Property";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Application not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    await connectDB();
    const application = await RentalApplication.findById(id);
    if (!application) return apiError("Application not found", { status: 404, code: "NOT_FOUND" });
    const isApplicant = application.applicantId.toString() === actor.id;
    const isOwner = application.ownerId.toString() === actor.id;

    if (body.action === "delete" || body.action === "remove") {
      if (!isApplicant && !isOwner) return apiError("Access denied", { status: 403, code: "FORBIDDEN" });
      application.deletedAt = new Date();
      await application.save();
      await writeAuditLog({ actor, action: "rental_application.delete", targetType: "RentalApplication", targetId: id, tenantId: application.tenantId, request });
      return apiSuccess({ id, status: "DELETED" });
    }

    let status = "";
    if (body.action === "withdraw" && isApplicant && ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(application.status)) status = "WITHDRAWN";
    if (body.action === "review" && isOwner && application.status === "SUBMITTED") status = "UNDER_REVIEW";
    if (body.action === "approve" && isOwner && ["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) status = "APPROVED";
    if (body.action === "decline" && isOwner && ["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) status = "DECLINED";
    if (!status) return apiError("This application action is not allowed", { status: 409, code: "INVALID_TRANSITION" });

    application.status = status;
    application.decision = { reason: String(body.reason || "").slice(0, 1000), decidedBy: actor.id, decidedAt: new Date() };
    await application.save();

    let leaseId = null;
    if (status === "APPROVED") {
      const property = await Property.findById(application.propertyId).lean();
      const monthlyRent = Number(property?.pricing?.monthlyRent || property?.rates?.monthly || 0);
      const lease = await Lease.create({ tenantId: application.tenantId, propertyId: application.propertyId, applicationId: application._id, landlordId: actor.id, tenantUserIds: [application.applicantId], startDate: application.desiredMoveIn, endDate: new Date(new Date(application.desiredMoveIn).setFullYear(new Date(application.desiredMoveIn).getFullYear() + 1)), currency: property?.currency || "ZAR", monthlyRent, status: "DRAFT" });
      leaseId = lease._id.toString();
    }

    await writeAuditLog({ actor, action: `rental_application.${body.action}`, targetType: "RentalApplication", targetId: id, tenantId: application.tenantId, metadata: { status, leaseId }, request });
    return apiSuccess({ id, status, leaseId });
  } catch (error) { return handleApiError(error, "applications.transition"); }
}

export async function DELETE(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Application not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const application = await RentalApplication.findById(id);
    if (!application) return apiError("Application not found", { status: 404, code: "NOT_FOUND" });
    const isApplicant = application.applicantId.toString() === actor.id;
    const isOwner = application.ownerId.toString() === actor.id;
    if (!isApplicant && !isOwner) return apiError("Access denied", { status: 403, code: "FORBIDDEN" });

    application.deletedAt = new Date();
    await application.save();
    await writeAuditLog({ actor, action: "rental_application.delete", targetType: "RentalApplication", targetId: id, tenantId: application.tenantId, request });
    return apiSuccess({ id, status: "DELETED" });
  } catch (error) { return handleApiError(error, "applications.delete"); }
}
