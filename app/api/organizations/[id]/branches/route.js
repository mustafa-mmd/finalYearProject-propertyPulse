import Branch from "@/models/Branch";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanEmail, cleanText } from "@/utils/organizationValidation";
import { assertTenantCapacity } from "@/utils/usageLimits";
import mongoose from "mongoose";
import OrganizationMember from "@/models/OrganizationMember";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "branches.read");
    const items = await Branch.find({ organizationId: id, deletedAt: { $exists: false } }).sort({ name: 1 }).lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "branches.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "branches.manage");
    const body = await request.json();
    await assertTenantCapacity(id, "branches");
    const name = cleanText(body.name, 120);
    const code = cleanText(body.code, 30).replace(/[^a-z0-9_-]/gi, "").toUpperCase();
    if (!name || !code) return apiError("Branch name and code are required", { status: 422, code: "VALIDATION_ERROR" });
    const branch = await Branch.create({ organizationId: id, name, code, email: cleanEmail(body.email), phone: cleanText(body.phone, 30) });
    await writeAuditLog({ actor: access.actor, action: "organization.branch_create", targetType: "Branch", targetId: branch._id, tenantId: id, request });
    return apiSuccess({ branch }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "branches.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "branches.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.branchId)) {
      return apiError("Branch not found", { status: 404, code: "NOT_FOUND" });
    }
    const branch = await Branch.findOne({
      _id: body.branchId,
      organizationId: id,
      deletedAt: { $exists: false },
    });
    if (!branch) return apiError("Branch not found", { status: 404, code: "NOT_FOUND" });
    const name = cleanText(body.name || branch.name, 120);
    const code = cleanText(body.code || branch.code, 30)
      .replace(/[^a-z0-9_-]/gi, "")
      .toUpperCase();
    if (!name || !code) {
      return apiError("Branch name and code are required", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }
    branch.name = name;
    branch.code = code;
    branch.email = cleanEmail(body.email);
    branch.phone = cleanText(body.phone, 30);
    if (["ACTIVE", "INACTIVE"].includes(body.status)) branch.status = body.status;
    await branch.save();
    await writeAuditLog({
      actor: access.actor,
      action: "organization.branch_update",
      targetType: "Branch",
      targetId: branch._id,
      tenantId: id,
      metadata: { status: branch.status },
      request,
    });
    return apiSuccess({ branch });
  } catch (error) {
    return handleApiError(error, "branches.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "branches.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.branchId)) {
      return apiError("Branch not found", { status: 404, code: "NOT_FOUND" });
    }
    const branch = await Branch.findOneAndUpdate(
      { _id: body.branchId, organizationId: id, deletedAt: { $exists: false } },
      { $set: { status: "ARCHIVED", deletedAt: new Date() } },
      { new: true }
    );
    if (!branch) return apiError("Branch not found", { status: 404, code: "NOT_FOUND" });
    await OrganizationMember.updateMany(
      { organizationId: id, branchIds: branch._id },
      { $pull: { branchIds: branch._id } }
    );
    await writeAuditLog({
      actor: access.actor,
      action: "organization.branch_archive",
      targetType: "Branch",
      targetId: branch._id,
      tenantId: id,
      request,
    });
    return apiSuccess({ id: branch._id.toString(), status: branch.status });
  } catch (error) {
    return handleApiError(error, "branches.archive");
  }
}
