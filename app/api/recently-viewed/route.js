import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import RecentlyViewedProperty from "@/models/RecentlyViewedProperty";
import { listingPublicFilter } from "@/config/listings";
import { getActor, requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const rows = await RecentlyViewedProperty.find({ userId: actor.id }).sort({ viewedAt: -1 }).limit(24).lean();
    const properties = await Property.find({ _id: { $in: rows.map((row) => row.propertyId) }, ...listingPublicFilter() }).lean();
    const byId = new Map(properties.map((property) => [property._id.toString(), property]));
    return apiSuccess(rows.map((row) => byId.get(row.propertyId.toString())).filter(Boolean));
  } catch (error) {
    return handleApiError(error, "recently-viewed.list");
  }
}

export async function POST(request) {
  try {
    const actor = await getActor();
    if (!actor) return apiSuccess({ recorded: false });
    const { propertyId } = await request.json();
    if (!mongoose.isValidObjectId(propertyId)) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    await RecentlyViewedProperty.findOneAndUpdate({ userId: actor.id, propertyId }, { $set: { viewedAt: new Date() } }, { upsert: true });
    await Property.updateOne({ _id: propertyId, ...listingPublicFilter() }, { $inc: { "metrics.views": 1 } });
    return apiSuccess({ recorded: true });
  } catch (error) {
    return handleApiError(error, "recently-viewed.record");
  }
}
