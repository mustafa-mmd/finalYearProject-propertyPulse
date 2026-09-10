import mongoose from "mongoose";
import Expense from "@/models/Expense";
import Property from "@/models/Property";
import Vendor from "@/models/Vendor";
import WorkOrder from "@/models/WorkOrder";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanText } from "@/utils/organizationValidation";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "finance.read");
    const items = await Expense.find({ tenantId: id })
      .populate("propertyId", "name listingReference")
      .populate("vendorId", "name")
      .sort({ incurredAt: -1 })
      .limit(500)
      .lean();
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error, "expenses.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "finance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.propertyId) || !(await Property.exists({ _id: body.propertyId, tenantId: id, deletedAt: { $exists: false } }))) {
      return apiError("Choose a valid property", { status: 422, code: "VALIDATION_ERROR" });
    }
    if (body.workOrderId && !(mongoose.isValidObjectId(body.workOrderId) && await WorkOrder.exists({ _id: body.workOrderId, tenantId: id }))) return apiError("Work order is invalid", { status: 422, code: "VALIDATION_ERROR" });
    if (body.vendorId && !(mongoose.isValidObjectId(body.vendorId) && await Vendor.exists({ _id: body.vendorId, tenantId: id }))) return apiError("Vendor is invalid", { status: 422, code: "VALIDATION_ERROR" });
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return apiError("Enter a valid expense amount", { status: 422, code: "VALIDATION_ERROR" });
    const expense = await Expense.create({ tenantId: id, propertyId: body.propertyId, workOrderId: body.workOrderId || undefined, vendorId: body.vendorId || undefined, category: cleanText(body.category, 80), description: cleanText(body.description, 1000), currency: String(body.currency || "ZAR").toUpperCase().slice(0, 3), amount, incurredAt: body.incurredAt ? new Date(body.incurredAt) : new Date(), submittedBy: access.actor.id });
    await writeAuditLog({ actor: access.actor, action: "expense.create", targetType: "Expense", targetId: expense._id, tenantId: id, metadata: { amount, currency: expense.currency }, request });
    return apiSuccess({ expense }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "expenses.create");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "finance.manage");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.expenseId) || !["APPROVED", "PAID", "REJECTED", "VOID"].includes(body.status)) {
      return apiError("Invalid expense decision", { status: 422, code: "VALIDATION_ERROR" });
    }
    const expense = await Expense.findOne({ _id: body.expenseId, tenantId: id });
    if (!expense) return apiError("Expense not found", { status: 404, code: "NOT_FOUND" });
    const allowed = {
      PENDING_APPROVAL: ["APPROVED", "REJECTED", "VOID"],
      APPROVED: ["PAID", "VOID"],
      PAID: ["VOID"],
      REJECTED: ["VOID"],
      DRAFT: ["APPROVED", "REJECTED", "VOID"],
    };
    if (!allowed[expense.status]?.includes(body.status)) return apiError("Invalid expense transition", { status: 409, code: "INVALID_TRANSITION" });
    expense.status = body.status;
    if (body.status === "APPROVED") expense.approvedBy = access.actor.id;
    await expense.save();
    await writeAuditLog({ actor: access.actor, action: "expense.status_update", targetType: "Expense", targetId: expense._id, tenantId: id, metadata: { status: expense.status }, request });
    return apiSuccess({ id: expense._id.toString(), status: expense.status });
  } catch (error) {
    return handleApiError(error, "expenses.update");
  }
}
