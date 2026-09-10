import mongoose from "mongoose";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import Refund from "@/models/Refund";
import { requireActor, requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { emitNotification } from "@/utils/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const items = await Refund.find(actor.permissions.includes("refunds.review") ? {} : { requestedBy: actor.id })
      .populate("paymentId", "transactionId propertyName amount currency userId userEmail")
      .sort({ createdAt: -1 }).limit(250).lean();
    return apiSuccess(items);
  } catch (error) { return handleApiError(error, "refunds.list"); }
}

export async function POST(request) {
  try {
    const actor = await requireActor(); const body = await request.json();
    if (!mongoose.isValidObjectId(body.paymentId)) return apiError("Payment not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const payment = await Payment.findOne({ _id: body.paymentId, paymentStatus: "completed", $or: [{ userId: actor.id }, { userEmail: actor.email }] });
    if (!payment) return apiError("Completed payment not found", { status: 404, code: "NOT_FOUND" });
    const available = Math.max(0, payment.amount - (payment.refundedAmount || 0));
    const amount = Number(body.amount); const reason = String(body.reason || "").trim().slice(0, 1000);
    if (!Number.isFinite(amount) || amount <= 0 || amount > available || reason.length < 10) return apiError("Provide a valid amount and reason", { status: 422, code: "VALIDATION_ERROR", details: { available } });
    if (await Refund.exists({ paymentId: payment._id, status: { $in: ["REQUESTED", "APPROVED", "PROCESSING"] } })) return apiError("A refund request is already active", { status: 409, code: "CONFLICT" });
    const item = await Refund.create({ paymentId: payment._id, requestedBy: actor.id, currency: payment.currency, amount, reason });
    await writeAuditLog({ actor, action: "refund.request", targetType: "Refund", targetId: item._id, request });
    return apiSuccess(item, { status: 201 });
  } catch (error) { return handleApiError(error, "refunds.request"); }
}

export async function PATCH(request) {
  try {
    const actor = await requirePermission("refunds.review"); const body = await request.json(); const action = String(body.action || "").toUpperCase();
    if (!["APPROVE", "REJECT", "COMPLETE", "FAIL"].includes(action)) return apiError("Invalid refund action", { status: 422, code: "VALIDATION_ERROR" });
    await connectDB(); const item = await Refund.findById(body.id).populate("paymentId");
    if (!item) return apiError("Refund not found", { status: 404, code: "NOT_FOUND" });
    const allowed = { REQUESTED: ["APPROVE", "REJECT"], APPROVED: ["COMPLETE", "FAIL"], PROCESSING: ["COMPLETE", "FAIL"] };
    if (!allowed[item.status]?.includes(action)) return apiError("Invalid refund status transition", { status: 409, code: "INVALID_STATUS_TRANSITION" });
    if (action === "APPROVE") { item.status = "APPROVED"; item.approvedBy = actor.id; }
    if (action === "REJECT") item.status = "REJECTED";
    if (action === "FAIL") item.status = "FAILED";
    if (action === "COMPLETE") {
      const reference = String(body.providerReference || "").trim();
      if (reference.length < 4) return apiError("Provider reference is required", { status: 422, code: "PROVIDER_REFERENCE_REQUIRED" });
      item.status = "COMPLETED"; item.providerReference = reference; item.processedAt = new Date();
      const payment = item.paymentId; payment.refundedAmount = (payment.refundedAmount || 0) + item.amount;
      if (payment.refundedAmount >= payment.amount) payment.paymentStatus = "refunded";
      payment.statusHistory.push({ status: payment.paymentStatus, source: "finance_refund", reference }); await payment.save();
    }
    await item.save();
    await Promise.all([
      writeAuditLog({ actor, action: `refund.${action.toLowerCase()}`, targetType: "Refund", targetId: item._id, metadata: { note: String(body.note || "").slice(0, 500), providerReference: item.providerReference }, request }),
      emitNotification({ recipientId: item.requestedBy, type: "REFUND_STATUS", title: `Refund ${item.status.toLowerCase()}`, body: `${item.currency} ${item.amount.toLocaleString()} refund status is now ${item.status.toLowerCase()}.`, href: "/payments", dedupeKey: `refund:${item._id}:${item.status}`, channels: ["IN_APP", "EMAIL"] }),
    ]);
    return apiSuccess(item);
  } catch (error) { return handleApiError(error, "refunds.update"); }
}
