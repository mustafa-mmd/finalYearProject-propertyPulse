import mongoose from "mongoose";
import connectDB from "@/config/database";
import Expense from "@/models/Expense";
import Invoice from "@/models/Invoice";
import Lease from "@/models/Lease";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import Property from "@/models/Property";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { authenticateEnterpriseRequest } from "@/utils/enterpriseSecurity";
import { checkRateLimit } from "@/utils/rateLimit";
export async function GET(request) { try { await connectDB(); const key = await authenticateEnterpriseRequest(request, "reports.read"); if (!key) return apiError("Invalid API key or scope", { status: 401, code: "UNAUTHORIZED" }); const rate = await checkRateLimit(`enterprise:${key._id}`, { limit: 300, windowMs: 60_000 }); if (!rate.allowed) return apiError("API rate limit exceeded", { status: 429, code: "RATE_LIMITED" }); const tenantId = new mongoose.Types.ObjectId(key.tenantId); const [properties, activeLeases, income, expenses, maintenance] = await Promise.all([Property.countDocuments({ tenantId, deletedAt: { $exists: false } }), Lease.countDocuments({ tenantId, status: "ACTIVE" }), Invoice.aggregate([{ $match: { tenantId, status: "PAID" } }, { $group: { _id: "$currency", total: { $sum: "$amountPaid" } } }]), Expense.aggregate([{ $match: { tenantId, status: { $in: ["APPROVED", "PAID"] } } }, { $group: { _id: "$currency", total: { $sum: "$amount" } } }]), MaintenanceRequest.aggregate([{ $match: { tenantId } }, { $group: { _id: "$status", count: { $sum: 1 } } }])]); return apiSuccess({ properties, activeLeases, income, expenses, maintenance, generatedAt: new Date().toISOString() }, { headers: { "X-RateLimit-Remaining": String(rate.remaining) } }); } catch (error) { return handleApiError(error, "enterprise.reports"); } }
