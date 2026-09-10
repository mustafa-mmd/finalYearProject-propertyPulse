import { Schema, model, models } from "mongoose";

const BranchSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 30 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE", index: true },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, maxlength: 30 },
    address: {
      formattedAddress: { type: String, maxlength: 500 },
      country: String,
      state: String,
      city: String,
      postalCode: String,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

BranchSchema.index({ organizationId: 1, code: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1, status: 1, name: 1 });
const Branch = models.Branch || model("Branch", BranchSchema);
export default Branch;
