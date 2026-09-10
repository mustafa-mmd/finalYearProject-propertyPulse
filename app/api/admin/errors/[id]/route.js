import mongoose from "mongoose";
import OperationalError from "@/models/OperationalError";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/authorization";
import { writeAuditLog } from "@/utils/audit";

const STATUSES = new Set(["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"]);

export async function PATCH(request, { params }) {
  try {
    const actor = await requirePermission("system_errors.manage");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Error record not found", { status: 404, code: "NOT_FOUND" });
    }
    const body = await request.json();
    if (!STATUSES.has(body.status)) {
      return apiError("Invalid error status", { status: 422, code: "VALIDATION_ERROR" });
    }

    const now = new Date();
    const update = {
      status: body.status,
      resolutionNotes: String(body.notes || "").trim().slice(0, 2000),
    };
    if (body.status === "ACKNOWLEDGED") {
      update.acknowledgedBy = actor.id;
      update.acknowledgedAt = now;
    }
    if (["RESOLVED", "IGNORED"].includes(body.status)) {
      update.resolvedBy = actor.id;
      update.resolvedAt = now;
    }

    const item = await OperationalError.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!item) return apiError("Error record not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({
      actor,
      action: "system_error.status_update",
      targetType: "OperationalError",
      targetId: item._id,
      metadata: { status: body.status },
      request,
    });
    return apiSuccess({ id, status: item.status });
  } catch (error) {
    return handleApiError(error, "admin.errors.update");
  }
}
