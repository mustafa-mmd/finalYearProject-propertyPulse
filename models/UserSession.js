import { Schema, model, models } from "mongoose";

const UserSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  provider: { type: String, required: true, maxlength: 40 },
  ipHash: String,
  userAgentHash: String,
  label: { type: String, maxlength: 120 },
  mfaVerifiedAt: Date,
  authenticatedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  revokeReason: { type: String, maxlength: 200 },
}, { timestamps: true });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
UserSessionSchema.index({ userId: 1, revokedAt: 1, lastSeenAt: -1 });
const UserSession = models.UserSession || model("UserSession", UserSessionSchema);
export default UserSession;
