import mongoose from "mongoose";
import Vendor from "@/models/Vendor";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanEmail, cleanText } from "@/utils/organizationValidation";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "maintenance.read");
    const items = await Vendor.find({ tenantId: id, deletedAt: { $exists: false } }).sort({ name: 1 }).lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "vendors.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    const name = cleanText(body.name, 150);
    if (!name) return apiError("Vendor name is required", { status: 422, code: "VALIDATION_ERROR" });
    const vendor = await Vendor.create({ tenantId: id, name, email: cleanEmail(body.email), phone: cleanText(body.phone, 30), categories: String(body.categories || "").split(",").map((value) => cleanText(value, 60)).filter(Boolean).slice(0, 20), notes: cleanText(body.notes, 2000) });
    await writeAuditLog({ actor: access.actor, action: "vendor.create", targetType: "Vendor", targetId: vendor._id, tenantId: id, request });
    return apiSuccess({ vendor }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "vendors.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.vendorId)) return apiError("Vendor not found", { status: 404, code: "NOT_FOUND" });
    const update = {};
    if (body.name !== undefined) update.name = cleanText(body.name, 150);
    if (["ACTIVE", "INACTIVE", "BLOCKED"].includes(body.status)) update.status = body.status;
    if (["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(body.verificationStatus)) update.verificationStatus = body.verificationStatus;
    const vendor = await Vendor.findOneAndUpdate({ _id: body.vendorId, tenantId: id, deletedAt: { $exists: false } }, { $set: update }, { new: true, runValidators: true });
    if (!vendor) return apiError("Vendor not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor: access.actor, action: "vendor.update", targetType: "Vendor", targetId: vendor._id, tenantId: id, metadata: update, request });
    return apiSuccess({ vendor });
  } catch (error) {
    return handleApiError(error, "vendors.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "maintenance.manage");
    const body = await request.json();
    const vendor = mongoose.isValidObjectId(body.vendorId) ? await Vendor.findOneAndUpdate({ _id: body.vendorId, tenantId: id, deletedAt: { $exists: false } }, { $set: { status: "INACTIVE", deletedAt: new Date() } }, { new: true }) : null;
    if (!vendor) return apiError("Vendor not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor: access.actor, action: "vendor.archive", targetType: "Vendor", targetId: vendor._id, tenantId: id, request });
    return apiSuccess({ archived: true });
  } catch (error) {
    return handleApiError(error, "vendors.archive");
  }
}
