import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    planCode: { type: String, required: true, uppercase: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    billingInterval: { type: String, enum: ["MONTHLY", "ANNUAL"], default: "MONTHLY" },
    provider: { type: String, enum: ["PAYFAST", "STRIPE", "PAYPAL", "MANUAL"], default: "MANUAL" },
    providerCustomerId: String,
    providerSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEndsAt: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: Date,
    limitsSnapshot: { type: Schema.Types.Mixed },
    statusHistory: [
      {
        status: { type: String, required: true },
        reason: { type: String, maxlength: 500 },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

SubscriptionSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE", "PAUSED"] }, userId: { $exists: true } } }
);
SubscriptionSchema.index(
  { tenantId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE", "PAUSED"] }, tenantId: { $exists: true } } }
);

const Subscription = models.Subscription || model("Subscription", SubscriptionSchema);
export default Subscription;
