import connectDB from "@/config/database";
import VerificationRequest from "@/models/VerificationRequest";
import { requirePermission } from "@/utils/authorization";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await requirePermission("verifications.read");
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const riskLevel = searchParams.get("riskLevel");
    const filter = {
      ...(status ? { status } : { status: { $in: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] } }),
      ...(riskLevel ? { riskLevel } : {}),
    };

    const [items, total] = await Promise.all([
      VerificationRequest.find(filter)
        .populate("propertyId", "name listingReference listingPurpose listingCategory listingStatus location images owner")
        .populate("requestedBy", "name email verification")
        .populate("assignedTo", "name email")
        .sort({ overallRiskScore: -1, submittedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      VerificationRequest.countDocuments(filter),
    ]);

    return apiSuccess({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error, "admin.verifications.list");
  }
}
