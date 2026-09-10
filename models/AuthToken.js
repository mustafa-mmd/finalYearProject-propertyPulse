import { Schema, model, models } from "mongoose";

const AuthTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  type: { type: String, enum: ["EMAIL_VERIFY", "PASSWORD_RESET", "MAGIC_LINK"], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
  requestedIpHash: String,
  attempts: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const AuthToken = models.AuthToken || model("AuthToken", AuthTokenSchema);
export default AuthToken;
