import { Schema, model, models } from "mongoose";
const SecurityEventSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: { type: String, required: true, maxlength: 80, index: true }, severity: { type: String, enum: ["INFO", "WARNING", "CRITICAL"], default: "INFO" }, ipHash: String, userAgentHash: String, sessionId: String, metadata: Schema.Types.Mixed, occurredAt: { type: Date, default: Date.now, index: true } }, { timestamps: true });
SecurityEventSchema.index({ userId: 1, occurredAt: -1 });
const SecurityEvent = models.SecurityEvent || model("SecurityEvent", SecurityEventSchema); export default SecurityEvent;
