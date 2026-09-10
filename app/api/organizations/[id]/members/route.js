import crypto from "node:crypto";
import OrganizationMember from "@/models/OrganizationMember";
import OrganizationInvitation from "@/models/OrganizationInvitation";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanEmail, cleanOrganizationRoles } from "@/utils/organizationValidation";
import { checkTeamMembersLimit } from "@/utils/usageLimits";
import mongoose from "mongoose";
import Branch from "@/models/Branch";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    await requireOrganizationPermission(id, "members.read");
    const members = await OrganizationMember.find({ organizationId: id, status: { $ne: "REMOVED" } })
      .populate("userId", "name email image accountStatus verification.status")
      .sort({ createdAt: 1 })
      .lean();
    return apiSuccess({ items: members });
  } catch (error) {
    return handleApiError(error, "organization.members.list");
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "members.invite");
    const limitCheck = await checkTeamMembersLimit(access.actor.id, id);
    if (!limitCheck.allowed) {
      return apiError(limitCheck.message, { status: 403, code: "SUBSCRIPTION_LIMIT_EXCEEDED" });
    }
    const body = await request.json();
    const email = cleanEmail(body.email);
    if (!email) return apiError("Enter a valid email address", { status: 422, code: "VALIDATION_ERROR" });

    await OrganizationInvitation.updateMany({ organizationId: id, email, status: "PENDING" }, { $set: { status: "REVOKED" } });
    const token = crypto.randomBytes(32).toString("base64url");
    const invitation = await OrganizationInvitation.create({
      organizationId: id,
      email,
      roles: cleanOrganizationRoles(body.roles),
      branchIds: Array.isArray(body.branchIds) ? body.branchIds : [],
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      invitedBy: access.actor.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await writeAuditLog({ actor: access.actor, action: "organization.member_invite", targetType: "OrganizationInvitation", targetId: invitation._id, tenantId: id, metadata: { email, roles: invitation.roles }, request });
    return apiSuccess({ invitationId: invitation._id.toString(), expiresAt: invitation.expiresAt, invitationPath: `/invitations/${token}` }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "organization.members.invite");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "members.update");
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.memberId)) {
      return apiError("Member not found", { status: 404, code: "NOT_FOUND" });
    }
    const member = await OrganizationMember.findOne({
      _id: body.memberId,
      organizationId: id,
      status: { $ne: "REMOVED" },
    });
    if (!member) return apiError("Member not found", { status: 404, code: "NOT_FOUND" });

    const actorIsOrganizationOwner = access.organization.ownerId.toString() === access.actor.id;
    if (member.userId.toString() === access.organization.ownerId.toString()) {
      return apiError("The organization owner membership is fixed", {
        status: 409,
        code: "OWNER_PROTECTED",
      });
    }
    if (member.roles.includes("OWNER") && !actorIsOrganizationOwner) {
      return apiError("Only the organization owner can change an owner membership", {
        status: 403,
        code: "OWNER_PROTECTED",
      });
    }
    const roles = cleanOrganizationRoles(body.roles);
    if (roles.includes("OWNER") && !actorIsOrganizationOwner) {
      return apiError("Only the organization owner can assign the owner role", {
        status: 403,
        code: "OWNER_PROTECTED",
      });
    }
    const branchIds = Array.isArray(body.branchIds)
      ? body.branchIds.filter((value) => mongoose.isValidObjectId(value))
      : member.branchIds;
    if (branchIds.length) {
      const count = await Branch.countDocuments({
        _id: { $in: branchIds },
        organizationId: id,
        deletedAt: { $exists: false },
      });
      if (count !== branchIds.length) {
        return apiError("One or more branches are invalid", {
          status: 422,
          code: "VALIDATION_ERROR",
        });
      }
    }
    member.roles = roles;
    member.branchIds = branchIds;
    if (["ACTIVE", "SUSPENDED"].includes(body.status)) member.status = body.status;
    await member.save();
    await writeAuditLog({
      actor: access.actor,
      action: "organization.member_update",
      targetType: "OrganizationMember",
      targetId: member._id,
      tenantId: id,
      metadata: { roles: member.roles, status: member.status },
      request,
    });
    return apiSuccess({ member });
  } catch (error) {
    return handleApiError(error, "organization.members.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "members.remove");
    const body = await request.json();

    if (mongoose.isValidObjectId(body.invitationId)) {
      const invitation = await OrganizationInvitation.findOneAndUpdate(
        { _id: body.invitationId, organizationId: id, status: "PENDING" },
        { $set: { status: "REVOKED" } },
        { new: true }
      );
      if (!invitation) {
        return apiError("Invitation not found", { status: 404, code: "NOT_FOUND" });
      }
      await writeAuditLog({
        actor: access.actor,
        action: "organization.invitation_revoke",
        targetType: "OrganizationInvitation",
        targetId: invitation._id,
        tenantId: id,
        request,
      });
      return apiSuccess({ id: invitation._id.toString(), status: invitation.status });
    }

    if (!mongoose.isValidObjectId(body.memberId)) {
      return apiError("Member not found", { status: 404, code: "NOT_FOUND" });
    }
    const member = await OrganizationMember.findOne({
      _id: body.memberId,
      organizationId: id,
      status: { $ne: "REMOVED" },
    });
    if (!member) return apiError("Member not found", { status: 404, code: "NOT_FOUND" });
    if (member.userId.toString() === access.organization.ownerId.toString() || member.roles.includes("OWNER")) {
      return apiError("The organization owner cannot be removed", {
        status: 409,
        code: "OWNER_PROTECTED",
      });
    }
    member.status = "REMOVED";
    member.removedAt = new Date();
    await member.save();
    await writeAuditLog({
      actor: access.actor,
      action: "organization.member_remove",
      targetType: "OrganizationMember",
      targetId: member._id,
      tenantId: id,
      request,
    });
    return apiSuccess({ id: member._id.toString(), status: member.status });
  } catch (error) {
    return handleApiError(error, "organization.members.remove");
  }
}
