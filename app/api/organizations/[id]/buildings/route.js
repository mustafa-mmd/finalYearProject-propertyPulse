import mongoose from "mongoose";
import Building from "@/models/Building";
import Unit from "@/models/Unit";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanText } from "@/utils/organizationValidation";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "maintenance.read");
    const items = await Building.find({ tenantId: id, deletedAt: { $exists: false } }).sort({ name: 1 }).lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "buildings.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    const name = cleanText(body.name, 150);
    const reference = cleanText(body.reference, 50).replace(/[^a-z0-9_-]/gi, "").toUpperCase();
    if (!name || !reference) return apiError("Building name and reference are required", { status: 422, code: "VALIDATION_ERROR" });
    const building = await Building.create({
      tenantId: id,
      name,
      reference,
      address: {
        formattedAddress: cleanText(body.formattedAddress, 500),
        country: cleanText(body.country, 100),
        state: cleanText(body.state, 100),
        city: cleanText(body.city, 100),
        postalCode: cleanText(body.postalCode, 30),
      },
      managerId: mongoose.isValidObjectId(body.managerId) ? body.managerId : undefined,
    });
    await writeAuditLog({ actor: access.actor, action: "building.create", targetType: "Building", targetId: building._id, tenantId: id, request });
    return apiSuccess({ building }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "buildings.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.buildingId)) return apiError("Building not found", { status: 404, code: "NOT_FOUND" });
    const update = {};
    if (body.name !== undefined) update.name = cleanText(body.name, 150);
    if (["ACTIVE", "INACTIVE"].includes(body.status)) update.status = body.status;
    const building = await Building.findOneAndUpdate({ _id: body.buildingId, tenantId: id, deletedAt: { $exists: false } }, { $set: update }, { new: true, runValidators: true });
    if (!building) return apiError("Building not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor: access.actor, action: "building.update", targetType: "Building", targetId: building._id, tenantId: id, metadata: update, request });
    return apiSuccess({ building });
  } catch (error) {
    return handleApiError(error, "buildings.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.buildingId)) return apiError("Building not found", { status: 404, code: "NOT_FOUND" });
    const activeUnits = await Unit.countDocuments({ buildingId: body.buildingId, tenantId: id, deletedAt: { $exists: false }, status: { $ne: "INACTIVE" } });
    if (activeUnits) return apiError("Archive or deactivate all units before archiving the building", { status: 409, code: "ACTIVE_UNITS" });
    const building = await Building.findOneAndUpdate({ _id: body.buildingId, tenantId: id, deletedAt: { $exists: false } }, { $set: { status: "ARCHIVED", deletedAt: new Date() } }, { new: true });
    if (!building) return apiError("Building not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor: access.actor, action: "building.archive", targetType: "Building", targetId: building._id, tenantId: id, request });
    return apiSuccess({ archived: true });
  } catch (error) {
    return handleApiError(error, "buildings.archive");
  }
}
