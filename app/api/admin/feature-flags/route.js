import connectDB from "@/config/database";
import FeatureFlag from "@/models/FeatureFlag";
import { requirePermission } from "@/utils/authorization";
import { apiSuccess, apiError, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("feature_flags.manage");
    await connectDB();
    const flags = await FeatureFlag.find({}).sort({ key: 1 }).lean();
    return apiSuccess({ flags });
  } catch (error) {
    return handleApiError(error, "admin.featureFlags.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requirePermission("feature_flags.manage");
    const body = await request.json();

    const key = typeof body.key === "string" ? body.key.trim().toLowerCase() : "";
    if (!/^[a-z0-9_.-]+$/.test(key)) {
      return apiError("Invalid feature flag key format. Use lowercase, numbers, underscores, dots or dashes.", { status: 422, code: "VALIDATION_ERROR" });
    }

    const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
    const enabled = Boolean(body.enabled);
    const rolloutPercentage = Math.min(100, Math.max(0, Number(body.rolloutPercentage || 0)));
    const allowedRoles = Array.isArray(body.allowedRoles) ? body.allowedRoles.filter((r) => typeof r === "string") : [];
    const allowedTenantIds = Array.isArray(body.allowedTenantIds) ? body.allowedTenantIds.filter((id) => typeof id === "string" && id.length === 24) : [];

    await connectDB();

    let flag = await FeatureFlag.findOne({ key });
    let actionType = "update";

    if (!flag) {
      flag = new FeatureFlag({ key });
      actionType = "create";
    }

    flag.description = description;
    flag.enabled = enabled;
    flag.rolloutPercentage = rolloutPercentage;
    flag.allowedRoles = allowedRoles;
    flag.allowedTenantIds = allowedTenantIds;
    flag.updatedBy = actor.id;

    await flag.save();

    await writeAuditLog({
      actor,
      action: `feature_flag.${actionType}`,
      targetType: "FeatureFlag",
      targetId: flag._id,
      metadata: { key, enabled, rolloutPercentage, allowedRoles },
      request,
    });

    return apiSuccess({ flag });
  } catch (error) {
    return handleApiError(error, "admin.featureFlags.save");
  }
}
