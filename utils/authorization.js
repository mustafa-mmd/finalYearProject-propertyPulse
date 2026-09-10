import connectDB from "@/config/database";
import User from "@/models/User";
import { getSessionUser } from "@/utils/getSessionUser";
import { hasPermission, permissionsForRoles } from "@/config/authorization";

export class AuthorizationError extends Error {
  constructor(message, status = 403, code = "FORBIDDEN") {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
    this.code = code;
  }
}

export async function getActor() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) return null;

  await connectDB();
  const user = await User.findById(sessionUser.userId)
    .select("name email image roles accountStatus verification security.mfaEnabled security.mfaRequired")
    .lean();

  if (!user || user.accountStatus !== "ACTIVE") return null;

  const roles = user.roles?.length ? user.roles : ["USER"];
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    roles,
    permissions: permissionsForRoles(roles),
    verification: user.verification,
    mfaEnabled: Boolean(user.security?.mfaEnabled),
    mfaRequired: Boolean(user.security?.mfaRequired),
    mfaVerified: sessionUser.user?.mfaVerified === true,
    authTime: sessionUser.user?.authTime,
    sessionId: sessionUser.user?.sessionId,
  };
}

export async function requireActor() {
  const actor = await getActor();
  if (!actor) {
    throw new AuthorizationError("Authentication required", 401, "AUTH_REQUIRED");
  }
  return actor;
}

export async function requirePermission(permission) {
  const actor = await requireActor();
  if (actor.mfaRequired && !actor.mfaVerified) {
    throw new AuthorizationError("Multi-factor authentication is required for this action", 403, "MFA_REQUIRED");
  }
  if (!hasPermission(actor.roles, permission)) {
    throw new AuthorizationError("You do not have permission for this action");
  }
  return actor;
}

export function actorOwns(actor, ownerIds = []) {
  return ownerIds.some((ownerId) => ownerId?.toString() === actor.id);
}

export function getPropertyOwnerId(property) {
  if (!property) return null;
  if (Array.isArray(property.owner) && property.owner.length > 0) {
    const o = property.owner[0];
    return typeof o === "object" ? o?._id?.toString() || o?.id?.toString() : o?.toString();
  }
  if (property.owner) {
    const o = property.owner;
    return typeof o === "object" ? o?._id?.toString() || o?.id?.toString() : o?.toString();
  }
  if (property.user) {
    const u = property.user;
    return typeof u === "object" ? u?._id?.toString() || u?.id?.toString() : u?.toString();
  }
  return null;
}

export function isPropertyOwner(property, actor) {
  if (!property || !actor) return false;
  const actorId = actor.id?.toString() || actor._id?.toString();
  if (!actorId) return false;

  const primaryOwnerId = getPropertyOwnerId(property);
  if (primaryOwnerId === actorId) return true;

  if (Array.isArray(property.owner)) {
    const isOwner = property.owner.some((o) => {
      const id = typeof o === "object" ? o?._id?.toString() || o?.id?.toString() : o?.toString();
      return id === actorId;
    });
    if (isOwner) return true;
  }

  if (property.seller_info?.email && actor.email && property.seller_info.email.toLowerCase() === actor.email.toLowerCase()) {
    return true;
  }

  return false;
}

