import { Schema, model, models } from "mongoose";
import { ORGANIZATION_PERMISSIONS, ORGANIZATION_ROLES } from "@/config/organizations";

const OrganizationMemberSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roles: { type: [{ type: String, enum: ORGANIZATION_ROLES }], required: true, default: ["VIEWER"] },
    customPermissions: [{ type: String, enum: ORGANIZATION_PERMISSIONS }],
    status: { type: String, enum: ["ACTIVE", "INVITED", "SUSPENDED", "REMOVED"], default: "ACTIVE", index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: Date,
    removedAt: Date,
  },
  { timestamps: true }
);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
OrganizationMemberSchema.index({ organizationId: 1, status: 1, roles: 1 });
const OrganizationMember = models.OrganizationMember || model("OrganizationMember", OrganizationMemberSchema);
export default OrganizationMember;
