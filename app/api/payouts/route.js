import connectDB from "@/config/database";
import Payout from "@/models/Payout";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { emitNotification } from "@/utils/events";

export async function GET() { try { await requirePermission("payouts.review"); await connectDB(); return apiSuccess(await Payout.find({}).populate("recipientId", "name email").sort({ createdAt: -1 }).limit(250).lean()); } catch (error) { return handleApiError(error, "payouts.list"); } }

export async function POST(request) {
  try {
    const actor = await requirePermission("payouts.review"); const body = await request.json(); const gross = Number(body.grossAmount); const fee = Number(body.feeAmount || 0);
    if (!body.recipientId || !Number.isFinite(gross) || gross <= 0 || fee < 0 || fee > gross) return apiError("Payout details are invalid", { status: 422, code: "VALIDATION_ERROR" });
    await connectDB(); const item = await Payout.create({ tenantId: body.tenantId || undefined, recipientId: body.recipientId, provider: String(body.provider || "MANUAL_BANK").slice(0, 80), currency: String(body.currency || "ZAR").toUpperCase().slice(0, 3), grossAmount: gross, feeAmount: fee, netAmount: gross - fee });
    await writeAuditLog({ actor, action: "payout.create", targetType: "Payout", targetId: item._id, tenantId: item.tenantId, request }); return apiSuccess(item, { status: 201 });
  } catch (error) { return handleApiError(error, "payouts.create"); }
}

export async function PATCH(request) {
  try {
    const actor = await requirePermission("payouts.review"); const body = await request.json(); const action = String(body.action || "").toUpperCase();
    await connectDB(); const item = await Payout.findById(body.id); if (!item) return apiError("Payout not found", { status: 404, code: "NOT_FOUND" });
    const transitions = { PENDING: ["APPROVED", "CANCELLED"], APPROVED: ["PROCESSING", "CANCELLED"], PROCESSING: ["PAID", "FAILED"] };
    if (!transitions[item.status]?.includes(action)) return apiError("Invalid payout transition", { status: 409, code: "INVALID_STATUS_TRANSITION" });
    if (action === "PAID" && String(body.providerReference || "").trim().length < 4) return apiError("Provider reference is required", { status: 422, code: "PROVIDER_REFERENCE_REQUIRED" });
    item.status = action; if (action === "APPROVED") item.approvedBy = actor.id; if (action === "PAID") { item.providerReference = String(body.providerReference).trim(); item.paidAt = new Date(); } await item.save();
    await Promise.all([writeAuditLog({ actor, action: `payout.${action.toLowerCase()}`, targetType: "Payout", targetId: item._id, tenantId: item.tenantId, metadata: { providerReference: item.providerReference }, request }), emitNotification({ recipientId: item.recipientId, tenantId: item.tenantId, type: "PAYOUT_STATUS", title: `Payout ${action.toLowerCase()}`, body: `${item.currency} ${item.netAmount.toLocaleString()} payout is ${action.toLowerCase()}.`, href: "/notifications", dedupeKey: `payout:${item._id}:${action}`, channels: ["IN_APP", "EMAIL"] })]);
    return apiSuccess(item);
  } catch (error) { return handleApiError(error, "payouts.update"); }
}
