import connectDB from "@/config/database";
import UserSession from "@/models/UserSession";
import SecurityEvent from "@/models/SecurityEvent";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export async function GET() {
  try { const actor = await requireActor(); await connectDB(); const items = await UserSession.find({ userId: actor.id, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).lean(); return apiSuccess(items.map((item) => ({ id: item._id.toString(), provider: item.provider, label: item.label, authenticatedAt: item.authenticatedAt, lastSeenAt: item.lastSeenAt, expiresAt: item.expiresAt, revokedAt: item.revokedAt, current: item.sessionId === actor.sessionId, mfaVerifiedAt: item.mfaVerifiedAt }))); } catch (error) { return handleApiError(error, "auth.sessions.list"); }
}

export async function DELETE(request) {
  try {
    const actor = await requireActor(); const body = await request.json(); await connectDB();
    const filter = body.allOthers ? { userId: actor.id, sessionId: { $ne: actor.sessionId }, revokedAt: { $exists: false } } : { _id: body.id, userId: actor.id, revokedAt: { $exists: false } };
    const result = await UserSession.updateMany(filter, { $set: { revokedAt: new Date(), revokeReason: "USER_REVOKED" } });
    if (!result.matchedCount) return apiError("Session not found", { status: 404, code: "NOT_FOUND" });
    await SecurityEvent.create({ userId: actor.id, type: "SESSION_REVOKED", severity: "WARNING", sessionId: actor.sessionId, metadata: { count: result.modifiedCount } });
    await writeAuditLog({ actor, action: "account.sessions_revoked", targetType: "User", targetId: actor.id, metadata: { count: result.modifiedCount }, request });
    return apiSuccess({ revoked: result.modifiedCount, currentRevoked: !body.allOthers && body.id });
  } catch (error) { return handleApiError(error, "auth.sessions.revoke"); }
}
