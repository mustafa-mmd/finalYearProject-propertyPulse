import { Schema, model, models } from "mongoose";

const WebhookEventSchema = new Schema(
  {
    provider: { type: String, required: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    paymentId: { type: String, required: true, trim: true },
    payloadHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["processed", "rejected", "failed"],
      required: true,
    },
    failureReason: { type: String, maxlength: 200 },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
WebhookEventSchema.index({ paymentId: 1, createdAt: -1 });

const WebhookEvent =
  models.WebhookEvent || model("WebhookEvent", WebhookEventSchema);

export default WebhookEvent;
