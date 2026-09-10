import { Schema, model, models } from "mongoose";

const ListingVersionSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    version: { type: Number, required: true, min: 1 },
    action: {
      type: String,
      enum: ["CREATED", "UPDATED", "SUBMITTED", "STATUS_CHANGED", "RESTORED"],
      required: true,
    },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changedFields: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ListingVersionSchema.index({ propertyId: 1, version: -1 }, { unique: true });
ListingVersionSchema.index({ tenantId: 1, createdAt: -1 });

const ListingVersion = models.ListingVersion || model("ListingVersion", ListingVersionSchema);
export default ListingVersion;
