import { Schema, model, models } from "mongoose";
const AvailabilityBlockSchema = new Schema({ tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true }, propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, type: { type: String, enum: ["OWNER_BLOCK", "MAINTENANCE", "EXTERNAL_BOOKING"], default: "OWNER_BLOCK" }, reason: { type: String, maxlength: 500 }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, deletedAt: Date }, { timestamps: true });
AvailabilityBlockSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
const AvailabilityBlock = models.AvailabilityBlock || model("AvailabilityBlock", AvailabilityBlockSchema);
export default AvailabilityBlock;
