import mongoose from "mongoose";
import Building from "@/models/Building";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanText } from "@/utils/organizationValidation";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "maintenance.read");
    const items = await Unit.find({ tenantId: id, deletedAt: { $exists: false } }).populate("buildingId", "name reference").populate("propertyId", "name listingReference").sort({ buildingId: 1, unitNumber: 1 }).lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "units.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.buildingId)) return apiError("Choose a valid building", { status: 422, code: "VALIDATION_ERROR" });
    const building = await Building.exists({ _id: body.buildingId, tenantId: id, deletedAt: { $exists: false } });
    if (!building) return apiError("Building not found", { status: 404, code: "NOT_FOUND" });
    if (body.propertyId) {
      if (!mongoose.isValidObjectId(body.propertyId) || !(await Property.exists({ _id: body.propertyId, tenantId: id, deletedAt: { $exists: false } }))) {
        return apiError("Linked property is invalid", { status: 422, code: "VALIDATION_ERROR" });
      }
    }
    const unitNumber = cleanText(body.unitNumber, 50);
    if (!unitNumber) return apiError("Unit number is required", { status: 422, code: "VALIDATION_ERROR" });
    const unit = await Unit.create({ tenantId: id, buildingId: body.buildingId, propertyId: body.propertyId || undefined, unitNumber, floor: cleanText(body.floor, 30), bedrooms: Number(body.bedrooms) || 0, bathrooms: Number(body.bathrooms) || 0 });
    await writeAuditLog({ actor: access.actor, action: "unit.create", targetType: "Unit", targetId: unit._id, tenantId: id, request });
    return apiSuccess({ unit }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "units.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.unitId)) return apiError("Unit not found", { status: 404, code: "NOT_FOUND" });
    const update = {};
    if (["VACANT", "OCCUPIED", "MAINTENANCE", "INACTIVE"].includes(body.status)) update.status = body.status;
    if (body.floor !== undefined) update.floor = cleanText(body.floor, 30);
    const unit = await Unit.findOneAndUpdate({ _id: body.unitId, tenantId: id, deletedAt: { $exists: false } }, { $set: update }, { new: true, runValidators: true });
    if (!unit) return apiError("Unit not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor: access.actor, action: "unit.update", targetType: "Unit", targetId: unit._id, tenantId: id, metadata: update, request });
    return apiSuccess({ unit });
  } catch (error) {
    return handleApiError(error, "units.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    const unit = mongoose.isValidObjectId(body.unitId) ? await Unit.findOneAndUpdate({ _id: body.unitId, tenantId: id, deletedAt: { $exists: false }, status: { $ne: "OCCUPIED" } }, { $set: { status: "INACTIVE", deletedAt: new Date() } }, { new: true }) : null;
    if (!unit) return apiError("Only a non-occupied unit can be archived", { status: 409, code: "UNIT_NOT_ARCHIVABLE" });
    await writeAuditLog({ actor: access.actor, action: "unit.archive", targetType: "Unit", targetId: unit._id, tenantId: id, request });
    return apiSuccess({ archived: true });
  } catch (error) {
    return handleApiError(error, "units.archive");
  }
}
