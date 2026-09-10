import mongoose from "mongoose";
import connectDB from "@/config/database";
import FraudCase from "@/models/FraudCase";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const ACTIONS = ["CLEAR", "RESTRICT", "SUSPEND", "ESCALATE"];
const FINAL_STATUSES = ["CLEARED", "ACTIONED", "CLOSED"];

export async function PATCH(request, { params }) {
  try {
    const actor = await requirePermission("risk_rules.manage");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Fraud case not found", { status: 404, code: "NOT_FOUND" });
    }
    const body = await request.json();
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim().slice(0, 2000);
    if (!ACTIONS.includes(action) || reason.length < 10) {
      return apiError("A valid human decision and reason are required", { status: 422, code: "VALIDATION_ERROR" });
    }
    await connectDB();
    const item = await FraudCase.findById(id);
    if (!item) return apiError("Fraud case not found", { status: 404, code: "NOT_FOUND" });
    if (FINAL_STATUSES.includes(item.status)) {
      return apiError("This fraud case already has a final decision", { status: 409, code: "ALREADY_DECIDED" });
    }
    item.humanDecision = { action, reason, decidedBy: actor.id, decidedAt: new Date() };
    item.assignedTo = item.assignedTo || actor.id;
    item.status = action === "CLEAR" ? "CLEARED" : action === "ESCALATE" ? "INVESTIGATING" : "ACTIONED";
    if (["CLEARED", "ACTIONED"].includes(item.status)) item.closedAt = new Date();
    await item.save();
    await writeAuditLog({
      actor,
      action: "fraud_case.human_decision",
      targetType: "FraudCase",
      targetId: item._id,
      tenantId: item.tenantId,
      reason,
      metadata: {
        action,
        note: "Operational account or listing enforcement must use its dedicated audited workflow",
      },
      request,
    });
    return apiSuccess({ id, status: item.status, action });
  } catch (error) {
    return handleApiError(error, "fraud-cases.decision");
  }
}
