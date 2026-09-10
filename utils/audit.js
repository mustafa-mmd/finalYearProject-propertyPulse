import crypto from "node:crypto";
import AuditLog from "@/models/AuditLog";
import connectDB from "@/config/database";

function hashIp(ip) {
  const salt = process.env.AUDIT_IP_HASH_SALT;
  if (!ip || !salt) return undefined;
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

function requestContext(request) {
  if (!request) return undefined;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  return {
    ipHash: hashIp(ip),
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
    requestId: request.headers.get("x-request-id")?.slice(0, 100),
  };
}

export async function writeAuditLog({
  actor,
  action,
  targetType,
  targetId,
  tenantId,
  outcome = "SUCCESS",
  reason,
  metadata,
  request,
}) {
  await connectDB();
  return AuditLog.create({
    tenantId: tenantId || undefined,
    actorId: actor?.id || undefined,
    actorRoles: actor?.roles || [],
    action,
    targetType,
    targetId: String(targetId),
    outcome,
    reason,
    metadata,
    request: requestContext(request),
  });
}
