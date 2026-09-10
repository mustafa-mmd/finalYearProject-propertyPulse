import { Schema, model, models } from "mongoose";

const OperationalErrorSchema = new Schema(
  {
    fingerprint: { type: String, required: true, unique: true, index: true },
    source: {
      type: String,
      enum: ["API", "SERVER_COMPONENT", "CLIENT", "JOB", "PROVIDER"],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "ERROR",
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"],
      default: "OPEN",
      index: true,
    },
    context: { type: String, required: true, maxlength: 200, index: true },
    errorName: { type: String, maxlength: 120 },
    errorCode: { type: String, maxlength: 120 },
    message: { type: String, required: true, maxlength: 1000 },
    stack: { type: String, maxlength: 8000 },
    path: { type: String, maxlength: 1000 },
    requestId: { type: String, maxlength: 120 },
    metadata: { type: Schema.Types.Mixed },
    occurrenceCount: { type: Number, default: 1, min: 1 },
    firstOccurredAt: { type: Date, default: Date.now },
    lastOccurredAt: { type: Date, default: Date.now, index: true },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    resolutionNotes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

OperationalErrorSchema.index({ status: 1, severity: 1, lastOccurredAt: -1 });

const OperationalError =
  models.OperationalError || model("OperationalError", OperationalErrorSchema);
export default OperationalError;
