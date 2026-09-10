import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const GeocodeCacheSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["forward", "reverse"],
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    location: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

const GeocodeCache =
  models.GeocodeCache || model("GeocodeCache", GeocodeCacheSchema);

export default GeocodeCache;
