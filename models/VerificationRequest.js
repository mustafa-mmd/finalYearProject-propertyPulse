import { Schema, model, models } from "mongoose";

const FindingSchema = new Schema(
  {
    code: { type: String, required: true, maxlength: 100 },
    severity: { type: String, enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    category: { type: String, required: true, maxlength: 80 },
    message: { type: String, required: true, maxlength: 1000 },
    evidence: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const VerificationRequestSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED", "ESCALATED", "CANCELLED"],
      default: "QUEUED",
      index: true,
    },
    overallRiskScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    riskLevel: {
      type: String,
      enum: ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "UNKNOWN",
      index: true,
    },
    recommendedAction: {
      type: String,
      enum: ["AUTO_PASS_FOR_MANUAL_REVIEW", "STANDARD_MANUAL_REVIEW", "REQUEST_MORE_INFORMATION", "HIGH_RISK_REVIEW", "RECOMMEND_REJECTION", "ESCALATE_TO_FRAUD_TEAM"],
      default: "STANDARD_MANUAL_REVIEW",
    },
    confidenceScore: { type: Number, min: 0, max: 100 },
    scores: {
      content: { type: Number, min: 0, max: 100 },
      image: { type: Number, min: 0, max: 100 },
      document: { type: Number, min: 0, max: 100 },
      location: { type: Number, min: 0, max: 100 },
      price: { type: Number, min: 0, max: 100 },
      duplicate: { type: Number, min: 0, max: 100 },
      identity: { type: Number, min: 0, max: 100 },
    },
    findings: [FindingSchema],
    missingInformation: [{ type: String, maxlength: 200 }],
    positiveSignals: [{ type: String, maxlength: 300 }],
    adminSummary: { type: String, maxlength: 3000 },
    ai: {
      provider: String,
      modelName: String,
      modelVersion: String,
      promptVersion: String,
      processedAt: Date,
      requestHash: String,
    },
    decision: {
      action: { type: String, enum: ["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND", "ESCALATE"] },
      reason: { type: String, maxlength: 2000 },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: Date,
    },
    submittedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

VerificationRequestSchema.index({ status: 1, overallRiskScore: -1, submittedAt: 1 });
VerificationRequestSchema.index({ tenantId: 1, status: 1, submittedAt: 1 });
VerificationRequestSchema.index(
  { propertyId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] } },
  }
);

const VerificationRequest =
  models.VerificationRequest || model("VerificationRequest", VerificationRequestSchema);
export default VerificationRequest;
