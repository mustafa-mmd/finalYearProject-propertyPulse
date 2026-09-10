import { Schema, model, models } from "mongoose";
import { ACCOUNT_STATUSES, ROLES } from "@/config/authorization";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Please provide an email"],
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: 100,
    },
    image: { type: String, default: "", maxlength: 2000 },
    passwordHash: { type: String, select: false },
    passwordChangedAt: Date,
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    roles: {
      type: [{ type: String, enum: ROLES }],
      default: ["USER"],
      validate: {
        validator: (roles) => Array.isArray(roles) && roles.length > 0,
        message: "At least one role is required",
      },
    },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    verification: {
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      identityStatus: {
        type: String,
        enum: ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
        default: "NOT_STARTED",
      },
      addressStatus: {
        type: String,
        enum: ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
        default: "NOT_STARTED",
      },
      verifiedAt: Date,
    },
    security: {
      mfaEnabled: { type: Boolean, default: false },
      mfaRequired: { type: Boolean, default: false },
      lastLoginAt: Date,
      lastLoginIpHash: String,
      failedLoginCount: { type: Number, default: 0, min: 0 },
      lockedUntil: Date,
      totpSecretCipher: { type: String, select: false },
      pendingTotpSecretCipher: { type: String, select: false },
      recoveryCodeHashes: { type: [String], default: [], select: false },
      mfaEnabledAt: Date,
    },
    preferences: {
      locale: { type: String, default: "en", maxlength: 10 },
      timezone: { type: String, default: "Asia/Karachi", maxlength: 100 },
      currency: { type: String, default: "ZAR", maxlength: 3, uppercase: true },
      emailNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

UserSchema.index({ roles: 1, accountStatus: 1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

const User = models.User || model("User", UserSchema);
export default User;
