import { Schema, model, models } from "mongoose";

const SubscriptionPlanSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 50 },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    prices: {
      monthly: { type: Number, min: 0 },
      annual: { type: Number, min: 0 },
      currency: { type: String, uppercase: true, minlength: 3, maxlength: 3, default: "ZAR" },
    },
    limits: {
      activeListings: { type: Number, default: 1 },
      teamMembers: { type: Number, default: 1 },
      branches: { type: Number, default: 0 },
      storageMb: { type: Number, default: 250 },
      monthlyLeads: { type: Number, default: 20 },
      aiReviews: { type: Number, default: 0 },
      apiRequests: { type: Number, default: 0 },
    },
    features: [{ type: String, maxlength: 200 }],
    active: { type: Boolean, default: true, index: true },
    public: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
    version: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

SubscriptionPlanSchema.index({ active: 1, public: 1, sortOrder: 1 });
const SubscriptionPlan = models.SubscriptionPlan || model("SubscriptionPlan", SubscriptionPlanSchema);
export default SubscriptionPlan;
