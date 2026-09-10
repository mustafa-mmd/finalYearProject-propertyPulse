import crypto from "node:crypto";
import connectDB from "@/config/database";
import OrganizationInvitation from "@/models/OrganizationInvitation";
import OrganizationMember from "@/models/OrganizationMember";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export async function POST(request, { params }) {
  try {
    const actor = await requireActor();
    const { token } = await params;
    const tokenHash = crypto.createHash("sha256").update(token || "").digest("hex");
    await connectDB();
    const invitation = await OrganizationInvitation.findOne({ tokenHash, status: "PENDING" });
    if (!invitation || invitation.expiresAt <= new Date()) return apiError("This invitation is invalid or expired", { status: 410, code: "INVITATION_EXPIRED" });
    if (invitation.email !== actor.email.toLowerCase()) return apiError("Sign in with the email address that was invited", { status: 403, code: "EMAIL_MISMATCH" });

    const member = await OrganizationMember.findOneAndUpdate(
      { organizationId: invitation.organizationId, userId: actor.id },
      { $set: { roles: invitation.roles, branchIds: invitation.branchIds, status: "ACTIVE", invitedBy: invitation.invitedBy, joinedAt: new Date(), removedAt: null } },
      { upsert: true, new: true, runValidators: true }
    );
    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = actor.id;
    await invitation.save();
    await writeAuditLog({ actor, action: "organization.invitation_accept", targetType: "OrganizationMember", targetId: member._id, tenantId: invitation.organizationId, request });
    return apiSuccess({ organizationId: invitation.organizationId.toString() });
  } catch (error) {
    return handleApiError(error, "invitations.accept");
  }
}
