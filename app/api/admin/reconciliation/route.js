import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import ReconciliationRun from "@/models/ReconciliationRun";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export async function GET() { try { await requirePermission("payments.read"); await connectDB(); return apiSuccess(await ReconciliationRun.find({}).sort({ createdAt: -1 }).limit(50).lean()); } catch (error) { return handleApiError(error, "reconciliation.list"); } }
export async function POST(request) {
  try {
    const actor = await requirePermission("payments.read"); const body = await request.json();
    if (!Array.isArray(body.transactions) || body.transactions.length > 5000) return apiError("Provide up to 5,000 provider transactions", { status: 422, code: "VALIDATION_ERROR" });
    const periodStart = new Date(body.periodStart); const periodEnd = new Date(body.periodEnd); const provider = String(body.provider || "").toLowerCase();
    if (!provider || Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart >= periodEnd) return apiError("Reconciliation period is invalid", { status: 422, code: "VALIDATION_ERROR" });
    await connectDB(); const internal = await Payment.find({ provider, createdAt: { $gte: periodStart, $lte: periodEnd } }).lean();
    const providerMap = new Map(body.transactions.map((entry) => [String(entry.reference || ""), entry])); const internalMap = new Map(internal.map((entry) => [String(entry.payfastData?.pf_payment_id || entry.paymentId || entry.transactionId), entry])); const discrepancies = []; let matched = 0;
    for (const [reference, external] of providerMap) { const local = internalMap.get(reference); if (!local) discrepancies.push({ type: "MISSING_INTERNAL", reference, providerAmount: Number(external.amount), providerStatus: String(external.status || "") }); else if (Math.abs(Number(local.amount) - Number(external.amount)) > 0.01) discrepancies.push({ type: "AMOUNT_MISMATCH", reference, internalAmount: local.amount, providerAmount: Number(external.amount), internalStatus: local.paymentStatus, providerStatus: String(external.status || "") }); else matched += 1; }
    for (const [reference, local] of internalMap) if (!providerMap.has(reference)) discrepancies.push({ type: "MISSING_PROVIDER", reference, internalAmount: local.amount, internalStatus: local.paymentStatus });
    const run = await ReconciliationRun.create({ provider, periodStart, periodEnd, uploadedBy: actor.id, status: "COMPLETED", totals: { providerCount: providerMap.size, internalCount: internalMap.size, matched, missingInternal: discrepancies.filter((item) => item.type === "MISSING_INTERNAL").length, missingProvider: discrepancies.filter((item) => item.type === "MISSING_PROVIDER").length, amountMismatch: discrepancies.filter((item) => item.type === "AMOUNT_MISMATCH").length }, discrepancies: discrepancies.slice(0, 1000), completedAt: new Date() });
    await Payment.updateMany({ _id: { $in: internal.filter((entry) => !discrepancies.some((item) => item.reference === String(entry.payfastData?.pf_payment_id || entry.paymentId || entry.transactionId))).map((entry) => entry._id) } }, { $set: { reconciledAt: new Date() } });
    await writeAuditLog({ actor, action: "payments.reconcile", targetType: "ReconciliationRun", targetId: run._id, metadata: run.totals, request }); return apiSuccess(run, { status: 201 });
  } catch (error) { return handleApiError(error, "reconciliation.run"); }
}
