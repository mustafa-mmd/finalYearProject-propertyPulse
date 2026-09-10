import mongoose from "mongoose";
import connectDB from "@/config/database";
import ViewingAppointment from "@/models/ViewingAppointment";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const OWNER_ACTIONS = { CONFIRM: "CONFIRMED", REJECT: "REJECTED", COMPLETE: "COMPLETED", NO_SHOW: "NO_SHOW" };

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Viewing not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.toUpperCase() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

    await connectDB();
    const viewing = await ViewingAppointment.findById(id);
    if (!viewing || viewing.deletedAt) return apiError("Viewing not found", { status: 404, code: "NOT_FOUND" });
    const isOwner = viewing.ownerId.toString() === actor.id;
    const isRequester = viewing.requesterId.toString() === actor.id;
    let nextStatus;

    if (action === "CANCEL" && (isOwner || isRequester)) {
      nextStatus = "CANCELLED";
    } else if (isOwner && OWNER_ACTIONS[action]) {
      nextStatus = OWNER_ACTIONS[action];
    } else {
      return apiError("You cannot perform this viewing action", { status: 403, code: "FORBIDDEN" });
    }

    viewing.status = nextStatus;
    viewing.decisionReason = reason;
    viewing.statusHistory.push({ status: nextStatus, changedBy: actor.id, reason });
    await viewing.save();
    await writeAuditLog({
      actor,
      action: `viewing.${action.toLowerCase()}`,
      targetType: "ViewingAppointment",
      targetId: viewing._id,
      tenantId: viewing.tenantId,
      reason,
      request,
    });
    return apiSuccess({ id: viewing._id.toString(), status: viewing.status });
  } catch (error) {
    return handleApiError(error, "viewings.update");
  }
}
