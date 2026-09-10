import mongoose from "mongoose";
import Inspection from "@/models/Inspection";
import Lease from "@/models/Lease";
import OrganizationMember from "@/models/OrganizationMember";
import Property from "@/models/Property";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanText } from "@/utils/organizationValidation";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "maintenance.read");
    const items = await Inspection.find({ tenantId: id })
      .populate("propertyId", "name listingReference")
      .populate("inspectorId", "name email")
      .sort({ scheduledAt: -1 })
      .limit(300)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "inspections.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.propertyId) || !(await Property.exists({ _id: body.propertyId, tenantId: id, deletedAt: { $exists: false } }))) return apiError("Choose a valid property", { status: 422, code: "VALIDATION_ERROR" });
    if (!mongoose.isValidObjectId(body.inspectorId) || !(await OrganizationMember.exists({ organizationId: id, userId: body.inspectorId, status: "ACTIVE" }))) return apiError("Choose an active inspector", { status: 422, code: "VALIDATION_ERROR" });
    if (body.leaseId && !(mongoose.isValidObjectId(body.leaseId) && await Lease.exists({ _id: body.leaseId, tenantId: id }))) return apiError("Lease is invalid", { status: 422, code: "VALIDATION_ERROR" });
    const type = ["MOVE_IN", "MOVE_OUT", "ROUTINE", "SAFETY", "SALE"].includes(body.type) ? body.type : "ROUTINE";
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return apiError("Choose a valid inspection date", { status: 422, code: "VALIDATION_ERROR" });
    const inspection = await Inspection.create({ tenantId: id, propertyId: body.propertyId, leaseId: body.leaseId || undefined, type, scheduledAt, inspectorId: body.inspectorId, participants: Array.isArray(body.participants) ? body.participants.filter((value) => mongoose.isValidObjectId(value)) : [] });
    await writeAuditLog({ actor: access.actor, action: "inspection.create", targetType: "Inspection", targetId: inspection._id, tenantId: id, request });
    return apiSuccess({ inspection }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "inspections.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.inspectionId)) return apiError("Inspection not found", { status: 404, code: "NOT_FOUND" });
    const inspection = await Inspection.findOne({ _id: body.inspectionId, tenantId: id });
    if (!inspection) return apiError("Inspection not found", { status: 404, code: "NOT_FOUND" });
    const transitions = { SCHEDULED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] };
    if (!transitions[inspection.status]?.includes(body.status)) return apiError("Invalid inspection transition", { status: 409, code: "INVALID_TRANSITION" });
    inspection.status = body.status;
    if (Array.isArray(body.rooms)) inspection.rooms = body.rooms.slice(0, 100).map((room) => ({ name: cleanText(room.name, 100), condition: ["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"].includes(room.condition) ? room.condition : "FAIR", notes: cleanText(room.notes, 2000), mediaUrls: Array.isArray(room.mediaUrls) ? room.mediaUrls.slice(0, 20) : [] }));
    if (body.status === "COMPLETED") inspection.completedAt = new Date();
    await inspection.save();
    await writeAuditLog({ actor: access.actor, action: "inspection.status_update", targetType: "Inspection", targetId: inspection._id, tenantId: id, metadata: { status: inspection.status }, request });
    return apiSuccess({ id: inspection._id.toString(), status: inspection.status });
  } catch (error) {
    return handleApiError(error, "inspections.update");
  }
}
