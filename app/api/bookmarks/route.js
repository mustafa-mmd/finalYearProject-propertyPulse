import mongoose from "mongoose";
import connectDB from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import RecommendationFeedback from "@/models/RecommendationFeedback";
import { listingPublicFilter } from "@/config/listings";
import { getActor, requireActor } from "@/utils/authorization";
import { apiError, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const actor = await getActor(); if (!actor) return Response.json([]);
    await connectDB(); const propertyId = new URL(request.url).searchParams.get("propertyId"); const user = await User.findById(actor.id).select("bookmarks").lean();
    if (propertyId) return Response.json({ isBookmarked: mongoose.isValidObjectId(propertyId) && user?.bookmarks?.some((id) => id.toString() === propertyId) });
    const properties = await Property.find({ _id: { $in: user?.bookmarks || [] }, ...listingPublicFilter() }).lean();
    return Response.json(properties, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return handleApiError(error, "bookmarks.list"); }
}

export async function POST(request) {
  try {
    const actor = await requireActor(); const { propertyId } = await request.json();
    if (!mongoose.isValidObjectId(propertyId)) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    await connectDB(); const property = await Property.findOne({ _id: propertyId, ...listingPublicFilter() }).select("_id").lean();
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    const user = await User.findById(actor.id).select("bookmarks"); const bookmarked = user.bookmarks.some((id) => id.toString() === propertyId);
    if (bookmarked) user.bookmarks.pull(propertyId); else user.bookmarks.addToSet(propertyId); await user.save();
    await RecommendationFeedback.create({ userId: actor.id, propertyId, action: bookmarked ? "HIDE" : "SAVE", context: "bookmark", expiresAt: new Date(Date.now() + 365 * 86_400_000) });
    return Response.json({ message: bookmarked ? "Bookmark removed" : "Property saved", isBookmarked: !bookmarked });
  } catch (error) { return handleApiError(error, "bookmarks.toggle"); }
}
