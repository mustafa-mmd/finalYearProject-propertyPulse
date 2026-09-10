import { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRoles: [{ type: String }],
    action: { type: String, required: true, trim: true, maxlength: 150, index: true },
    targetType: { type: String, required: true, trim: true, maxlength: 80 },
    targetId: { type: String, required: true, trim: true, maxlength: 150 },
    outcome: {
      type: String,
      enum: ["SUCCESS", "DENIED", "FAILURE"],
      default: "SUCCESS",
      index: true,
    },
    reason: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
    request: {
      ipHash: String,
      userAgent: { type: String, maxlength: 500 },
      requestId: { type: String, maxlength: 100 },
    },
    occurredAt: { type: Date, default: Date.now, immutable: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  }
);

AuditLogSchema.index({ tenantId: 1, occurredAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, occurredAt: -1 });

const denyMutation = function denyMutation(next) {
  next(new Error("Audit logs are immutable"));
};

AuditLogSchema.pre("updateOne", denyMutation);
AuditLogSchema.pre("updateMany", denyMutation);
AuditLogSchema.pre("findOneAndUpdate", denyMutation);
AuditLogSchema.pre("deleteOne", denyMutation);
AuditLogSchema.pre("deleteMany", denyMutation);
AuditLogSchema.pre("findOneAndDelete", denyMutation);

const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
export default AuditLog;
