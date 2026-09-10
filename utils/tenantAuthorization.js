import mongoose from "mongoose";
import connectDB from "@/config/database";
import Organization from "@/models/Organization";
import OrganizationMember from "@/models/OrganizationMember";
import { getActor, requireActor, AuthorizationError } from "@/utils/authorization";
import { organizationPermissions } from "@/config/organizations";

export async function getOrganizationAccess(organizationId, actor = null) {
  if (!mongoose.isValidObjectId(organizationId)) return null;
  const currentActor = actor || (await getActor());
  if (!currentActor) return null;

  await connectDB();
  const organization = await Organization.findOne({
    _id: organizationId,
    deletedAt: { $exists: false },
  }).lean();
  if (!organization) return null;

  if (currentActor.roles.includes("PLATFORM_OWNER") || currentActor.roles.includes("SUPER_ADMIN")) {
    return { actor: currentActor, organization, member: null, permissions: ["*"] };
  }

  const member = await OrganizationMember.findOne({
    organizationId,
    userId: currentActor.id,
    status: "ACTIVE",
  }).lean();
  if (!member) return null;
  return {
    actor: currentActor,
    organization,
    member,
    permissions: organizationPermissions(member.roles, member.customPermissions),
  };
}

export async function requireOrganizationPermission(organizationId, permission) {
  const actor = await requireActor();
  const access = await getOrganizationAccess(organizationId, actor);
  if (!access) throw new AuthorizationError("Organization access denied", 403, "TENANT_ACCESS_DENIED");
  if (!access.permissions.includes("*") && !access.permissions.includes(permission)) {
    throw new AuthorizationError("Organization permission denied", 403, "TENANT_PERMISSION_DENIED");
  }
  return access;
}
