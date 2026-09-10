import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { listingPublicFilter } from "@/config/listings";

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function queryProperties({ showFeatured = false } = {}) {
  try {
    await connectDB();

    if (showFeatured) {
      const featured = await Property.find({ $and: [listingPublicFilter(), { is_featured: true }] })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
      return serialize(featured);
    }

    const [total, properties] = await Promise.all([
      Property.countDocuments(listingPublicFilter()),
      Property.find(listingPublicFilter()).sort({ publishedAt: -1, createdAt: -1 }).limit(12).lean(),
    ]);
    return { total, properties: serialize(properties) };
  } catch (error) {
    console.error("[properties] Server query failed", {
      name: error?.name,
      code: error?.code,
    });
    return showFeatured ? [] : { total: 0, properties: [] };
  }
}

export async function queryProperty(id, { actorId, canReview = false } = {}) {
  if (!mongoose.isValidObjectId(id)) return null;

  try {
    await connectDB();
    const visibility = canReview
      ? { _id: id, deletedAt: { $exists: false } }
      : {
          _id: id,
          $or: [
            ...listingPublicFilter().$or,
            ...(actorId ? [{ owner: actorId }] : []),
          ],
          deletedAt: { $exists: false },
        };
    const property = await Property.findOne(visibility).lean();
    return property ? serialize(property) : null;
  } catch (error) {
    console.error("[properties] Property query failed", {
      name: error?.name,
      code: error?.code,
    });
    return null;
  }
}
