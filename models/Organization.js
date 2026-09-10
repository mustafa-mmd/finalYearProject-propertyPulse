import { Schema, model, models } from "mongoose";
import { ORGANIZATION_TYPES } from "@/config/organizations";

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    type: { type: String, enum: ORGANIZATION_TYPES, required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "ARCHIVED"], default: "PENDING_VERIFICATION", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contact: {
      email: { type: String, lowercase: true, trim: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 30 },
      website: { type: String, maxlength: 2000 },
    },
    address: {
      formattedAddress: { type: String, maxlength: 500 },
      country: String,
      state: String,
      city: String,
      postalCode: String,
    },
    branding: {
      logoUrl: { type: String, maxlength: 2000 },
      primaryColor: { type: String, match: /^#[0-9a-f]{6}$/i },
      customDomain: { type: String, lowercase: true, trim: true, maxlength: 253 },
    },
    settings: {
      timezone: { type: String, default: "Asia/Karachi", maxlength: 100 },
      locale: { type: String, default: "en", maxlength: 10 },
      currency: { type: String, default: "ZAR", uppercase: true, minlength: 3, maxlength: 3 },
      requireListingApproval: { type: Boolean, default: true },
      allowAgentPublishing: { type: Boolean, default: false },
    },
    verification: {
      status: { type: String, enum: ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"], default: "NOT_STARTED" },
      businessRegistrationVerified: { type: Boolean, default: false },
      officeAddressVerified: { type: Boolean, default: false },
      representativeVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    deletedAt: Date,
  },
  { timestamps: true }
);

OrganizationSchema.index({ status: 1, type: 1, createdAt: -1 });
OrganizationSchema.index({ "branding.customDomain": 1 }, { unique: true, sparse: true });
OrganizationSchema.index({ deletedAt: 1 }, { sparse: true });
const Organization = models.Organization || model("Organization", OrganizationSchema);
export default Organization;
