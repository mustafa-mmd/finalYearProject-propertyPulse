import { Schema, model, models } from "mongoose";

const PropertyCollectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: ["FAVORITES", "COMPARE"], default: "FAVORITES", index: true },
    propertyIds: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    deletedAt: Date,
  },
  { timestamps: true },
);

PropertyCollectionSchema.index({ userId: 1, name: 1, kind: 1 }, { unique: true });

const PropertyCollection = models.PropertyCollection || model("PropertyCollection", PropertyCollectionSchema);
export default PropertyCollection;
