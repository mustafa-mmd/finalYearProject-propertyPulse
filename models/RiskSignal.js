import { Schema, model, models } from "mongoose";

const RiskSignalSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    subjectType: {
      type: String,
      enum: ["USER", "PROPERTY", "ORGANIZATION", "PAYMENT", "BOOKING", "DOCUMENT"],
      required: true,
      index: true,
    },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    source: { type: String, enum: ["RULE", "AI", "ADMIN", "PROVIDER"], required: true },
    code: { type: String, required: true, maxlength: 100, index: true },
    severity: { type: String, enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    score: { type: Number, min: 0, max: 100, required: true },
    description: { type: String, required: true, maxlength: 1000 },
    evidence: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true }
);

RiskSignalSchema.index({ subjectType: 1, subjectId: 1, status: 1 });
RiskSignalSchema.index({ tenantId: 1, severity: 1, createdAt: -1 });

const RiskSignal = models.RiskSignal || model("RiskSignal", RiskSignalSchema);
export default RiskSignal;
