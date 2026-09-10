import mongoose from "mongoose";
import connectDB from "@/config/database";
import SupportTicket from "@/models/SupportTicket";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

export async function PATCH(request, { params }) {
  try {
    const actor = await requirePermission("support.manage");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Support ticket not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    const status = String(body.status || "").toUpperCase();
    const priority = String(body.priority || "").toUpperCase();
    const message = String(body.message || "").trim().slice(0, 5000);
    if (!STATUSES.includes(status) || !PRIORITIES.includes(priority)) {
      return apiError("Choose a valid ticket status and priority", { status: 422, code: "VALIDATION_ERROR" });
    }
    await connectDB();
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return apiError("Support ticket not found", { status: 404, code: "NOT_FOUND" });
    const before = { status: ticket.status, priority: ticket.priority };
    ticket.status = status;
    ticket.priority = priority;
    if (!ticket.assignedTo && status !== "OPEN") ticket.assignedTo = actor.id;
    if (message) ticket.messages.push({ authorId: actor.id, body: message, internal: true });
    ticket.resolvedAt = status === "RESOLVED" ? new Date() : undefined;
    ticket.closedAt = status === "CLOSED" ? new Date() : undefined;
    await ticket.save();
    await writeAuditLog({ actor, action: "support_ticket.update", targetType: "SupportTicket", targetId: ticket._id, tenantId: ticket.tenantId, metadata: { before, after: { status, priority }, internalNoteAdded: Boolean(message) }, request });
    return apiSuccess({ id, status, priority });
  } catch (error) {
    return handleApiError(error, "admin.support.update");
  }
}
