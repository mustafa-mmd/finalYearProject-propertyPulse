import { Schema, model, models } from "mongoose";

const SavedSearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    signature: { type: String, required: true, maxlength: 64 },
    filters: { type: Schema.Types.Mixed, required: true },
    alerts: {
      enabled: { type: Boolean, default: true },
      newListings: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      statusChanges: { type: Boolean, default: false },
      availability: { type: Boolean, default: false },
      channels: [{ type: String, enum: ["IN_APP", "EMAIL", "PUSH"] }],
      frequency: { type: String, enum: ["IMMEDIATE", "DAILY", "WEEKLY"], default: "DAILY" },
    },
    lastRunAt: Date,
    lastResultIds: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    deletedAt: Date,
  },
  { timestamps: true },
);

SavedSearchSchema.index({ userId: 1, signature: 1 }, { unique: true });
SavedSearchSchema.index({ "alerts.enabled": 1, lastRunAt: 1 });

const SavedSearch = models.SavedSearch || model("SavedSearch", SavedSearchSchema);
export default SavedSearch;
