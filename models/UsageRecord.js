import { Schema, model, models } from "mongoose";

const UsageRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    metric: {
      type: String,
      enum: ["ACTIVE_LISTINGS", "TEAM_MEMBERS", "BRANCHES", "STORAGE_MB", "LEADS", "AI_REVIEWS", "API_REQUESTS"],
      required: true,
    },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    quantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

UsageRecordSchema.index({ userId: 1, metric: 1, period: 1 }, { unique: true, sparse: true });
UsageRecordSchema.index({ tenantId: 1, metric: 1, period: 1 }, { unique: true, sparse: true });
const UsageRecord = models.UsageRecord || model("UsageRecord", UsageRecordSchema);
export default UsageRecord;
