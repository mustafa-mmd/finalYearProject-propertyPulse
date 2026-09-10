import { Schema, model, models } from "mongoose";

/**
 * PushSubscription — stores a browser Web Push subscription endpoint
 * linked to a user account. A single user may have multiple subscriptions
 * (one per device/browser).
 */
const PushSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** The W3C PushSubscription JSON serialised as a sub-document */
    endpoint: {
      type: String,
      required: true,
      maxlength: 2048,
    },
    keys: {
      p256dh: { type: String, required: true, maxlength: 512 },
      auth:   { type: String, required: true, maxlength: 128 },
    },
    /** Browser / device hint for display in the settings page */
    userAgent: { type: String, maxlength: 512 },
    /** Last time a push was successfully sent to this endpoint */
    lastUsedAt: { type: Date, default: null },
    /** Endpoints that fail permanently are marked inactive */
    active: { type: Boolean, default: true, index: true },
    expirationTime: { type: Date, default: null },
  },
  { timestamps: true }
);

// One endpoint string per user (prevents duplicate registrations)
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

const PushSubscription =
  models.PushSubscription || model("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
