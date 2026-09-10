import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ApiRateLimitSchema = new Schema(
  {
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { versionKey: false },
);

ApiRateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true });

const ApiRateLimit =
  models.ApiRateLimit || model("ApiRateLimit", ApiRateLimitSchema);

export default ApiRateLimit;
