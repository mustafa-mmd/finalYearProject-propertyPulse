import { Schema, model, models } from "mongoose";

const RecentlyViewedPropertySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

RecentlyViewedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });
RecentlyViewedPropertySchema.index({ viewedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const RecentlyViewedProperty = models.RecentlyViewedProperty || model("RecentlyViewedProperty", RecentlyViewedPropertySchema);
export default RecentlyViewedProperty;
