import { Schema, model, models } from "mongoose";
import { ORGANIZATION_ROLES } from "@/config/organizations";

const OrganizationInvitationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, index: true },
    roles: { type: [{ type: String, enum: ORGANIZATION_ROLES }], default: ["VIEWER"] },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    tokenHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"], default: "PENDING", index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

OrganizationInvitationSchema.index(
  { organizationId: 1, email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);
OrganizationInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
const OrganizationInvitation =
  models.OrganizationInvitation || model("OrganizationInvitation", OrganizationInvitationSchema);
export default OrganizationInvitation;
