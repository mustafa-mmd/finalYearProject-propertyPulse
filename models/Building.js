import { Schema, model, models } from "mongoose";
const BuildingSchema = new Schema({ tenantId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true }, name: { type: String, required: true, maxlength: 150 }, reference: { type: String, required: true, maxlength: 50 }, address: { formattedAddress: String, country: String, state: String, city: String, postalCode: String, latitude: Number, longitude: Number }, managerId: { type: Schema.Types.ObjectId, ref: "User" }, status: { type: String, enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE" }, deletedAt: Date }, { timestamps: true });
BuildingSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
const Building = models.Building || model("Building", BuildingSchema); export default Building;
