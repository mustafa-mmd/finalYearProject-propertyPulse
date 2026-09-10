import mongoose from "mongoose";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import OrganizationMember from "@/models/OrganizationMember";
import Vendor from "@/models/Vendor";
import WorkOrder from "@/models/WorkOrder";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanText } from "@/utils/organizationValidation";

const TRANSITIONS = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "maintenance.read");
    const items = await WorkOrder.find({ tenantId: id })
      .populate("maintenanceRequestId", "title priority status propertyId")
      .populate("vendorId", "name verificationStatus")
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "work-orders.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.maintenanceRequestId)) return apiError("Choose a maintenance request", { status: 422, code: "VALIDATION_ERROR" });
    const maintenance = await MaintenanceRequest.findOne({ _id: body.maintenanceRequestId, tenantId: id, deletedAt: { $exists: false } });
    if (!maintenance) return apiError("Maintenance request not found", { status: 404, code: "NOT_FOUND" });
    if (body.vendorId && !(mongoose.isValidObjectId(body.vendorId) && await Vendor.exists({ _id: body.vendorId, tenantId: id, status: "ACTIVE", deletedAt: { $exists: false } }))) {
      return apiError("Choose an active vendor", { status: 422, code: "VALIDATION_ERROR" });
    }
    if (body.assigneeId && !(mongoose.isValidObjectId(body.assigneeId) && await OrganizationMember.exists({ organizationId: id, userId: body.assigneeId, status: "ACTIVE" }))) {
      return apiError("Choose an active team member", { status: 422, code: "VALIDATION_ERROR" });
    }
    const scope = cleanText(body.scope, 5000);
    if (scope.length < 10) return apiError("Provide a clear work scope", { status: 422, code: "VALIDATION_ERROR" });
    const workOrder = await WorkOrder.create({
      tenantId: id,
      maintenanceRequestId: maintenance._id,
      vendorId: body.vendorId || undefined,
      assigneeId: body.assigneeId || undefined,
      scope,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      currency: String(body.currency || "ZAR").toUpperCase().slice(0, 3),
      estimate: Math.max(0, Number(body.estimate) || 0),
    });
    maintenance.status = "ASSIGNED";
    maintenance.assignedTo = body.assigneeId || maintenance.assignedTo;
    await maintenance.save();
    await writeAuditLog({ actor: access.actor, action: "work_order.create", targetType: "WorkOrder", targetId: workOrder._id, tenantId: id, metadata: { maintenanceRequestId: maintenance._id }, request });
    return apiSuccess({ workOrder }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "work-orders.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.workOrderId)) return apiError("Work order not found", { status: 404, code: "NOT_FOUND" });
    const workOrder = await WorkOrder.findOne({ _id: body.workOrderId, tenantId: id });
    if (!workOrder) return apiError("Work order not found", { status: 404, code: "NOT_FOUND" });
    if (body.status && !TRANSITIONS[workOrder.status]?.includes(body.status)) {
      return apiError(`Cannot move a work order from ${workOrder.status} to ${body.status}`, { status: 409, code: "INVALID_TRANSITION" });
    }
    if (body.status) workOrder.status = body.status;
    if (body.actualCost !== undefined) workOrder.actualCost = Math.max(0, Number(body.actualCost) || 0);
    if (body.status === "COMPLETED") {
      workOrder.completedAt = new Date();
      workOrder.approvedBy = access.actor.id;
    }
    await workOrder.save();
    if (body.status === "COMPLETED") {
      const remaining = await WorkOrder.countDocuments({ maintenanceRequestId: workOrder.maintenanceRequestId, status: { $nin: ["COMPLETED", "CANCELLED"] } });
      if (!remaining) await MaintenanceRequest.updateOne({ _id: workOrder.maintenanceRequestId }, { $set: { status: "RESOLVED", resolution: { notes: "All work orders completed", resolvedAt: new Date(), resolvedBy: access.actor.id } } });
    }
    await writeAuditLog({ actor: access.actor, action: "work_order.update", targetType: "WorkOrder", targetId: workOrder._id, tenantId: id, metadata: { status: workOrder.status }, request });
    return apiSuccess({ id: workOrder._id.toString(), status: workOrder.status });
  } catch (error) {
    return handleApiError(error, "work-orders.update");
  }
}
