import mongoose from "mongoose";
import connectDB from "@/config/database";
import Report from "@/models/Report";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

const STATUSES = ["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "DISMISSED", "CLOSED"];
const FINAL_STATUSES = ["ACTIONED", "DISMISSED", "CLOSED"];

export async function PATCH(request, { params }) {
  try {
    const actor = await requirePermission("reports.review");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Report not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    const status = String(body.status || "").toUpperCase();
    const resolution = String(body.resolution || "").trim().slice(0, 3000);
    if (!STATUSES.includes(status) || (FINAL_STATUSES.includes(status) && resolution.length < 10)) {
      return apiError("Choose a valid status and provide a clear resolution for a final decision", { status: 422, code: "VALIDATION_ERROR" });
    }
    await connectDB();
    const report = await Report.findById(id);
    if (!report) return apiError("Report not found", { status: 404, code: "NOT_FOUND" });
    const before = report.status;
    report.status = status;
    if (!report.assignedTo && status !== "OPEN") report.assignedTo = actor.id;
    if (resolution) report.resolution = resolution;
    if (FINAL_STATUSES.includes(status)) {
      report.resolvedAt = new Date();
      report.resolvedBy = actor.id;
    } else {
      report.resolvedAt = undefined;
      report.resolvedBy = undefined;
    }
    await report.save();
    await writeAuditLog({ actor, action: "trust_report.update", targetType: "Report", targetId: report._id, tenantId: report.tenantId, reason: resolution, metadata: { before, after: status }, request });
    return apiSuccess({ id, status });
  } catch (error) {
    return handleApiError(error, "admin.reports.update");
  }
}
