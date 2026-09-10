import mongoose from "mongoose";
import connectDB from "@/config/database";
import Subscription from "@/models/Subscription";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const TRANSITIONS = {
  PENDING: { ACTIVATE: "ACTIVE", CANCEL: "CANCELLED" },
  TRIALING: { ACTIVATE: "ACTIVE", PAUSE: "PAUSED", CANCEL: "CANCELLED" },
  ACTIVE: { PAUSE: "PAUSED", CANCEL: "CANCELLED" },
  PAST_DUE: { ACTIVATE: "ACTIVE", PAUSE: "PAUSED", CANCEL: "CANCELLED" },
  PAUSED: { RESUME: "ACTIVE", CANCEL: "CANCELLED" },
};

export async function PATCH(request, { params }) {
  try {
    const actor = await requirePermission("subscriptions.manage");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Subscription not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (reason.length < 10) return apiError("Provide a clear reason for this action", { status: 422, code: "VALIDATION_ERROR" });
    await connectDB();
    const subscription = await Subscription.findById(id);
    if (!subscription) return apiError("Subscription not found", { status: 404, code: "NOT_FOUND" });
    const nextStatus = TRANSITIONS[subscription.status]?.[action];
    if (!nextStatus) return apiError("This subscription action is not allowed from its current status", { status: 409, code: "INVALID_TRANSITION" });
    const previousStatus = subscription.status;
    subscription.status = nextStatus;
    subscription.statusHistory.push({ status: nextStatus, reason, changedBy: actor.id });
    if (nextStatus === "ACTIVE" && !subscription.currentPeriodStart) {
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (nextStatus === "CANCELLED") subscription.cancelledAt = new Date();
    await subscription.save();
    await writeAuditLog({ actor, action: "subscription.admin_update", targetType: "Subscription", targetId: subscription._id, tenantId: subscription.tenantId, reason, metadata: { action, previousStatus, nextStatus }, request });
    return apiSuccess({ id, status: nextStatus });
  } catch (error) {
    return handleApiError(error, "admin.subscriptions.update");
  }
}
