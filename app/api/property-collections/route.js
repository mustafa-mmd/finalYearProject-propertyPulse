import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import PropertyCollection from "@/models/PropertyCollection";
import { listingPublicFilter } from "@/config/listings";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";
const kindOf = (value) => value === "COMPARE" ? "COMPARE" : "FAVORITES";

export async function GET(request) {
  try {
    const actor = await requireActor();
    const kind = new URL(request.url).searchParams.get("kind");
    await connectDB();
    const collections = await PropertyCollection.find({ userId: actor.id, deletedAt: { $exists: false }, ...(kind ? { kind: kindOf(kind) } : {}) }).sort({ updatedAt: -1 }).lean();
    const ids = collections.flatMap((item) => item.propertyIds || []);
    const properties = await Property.find({ _id: { $in: ids }, ...listingPublicFilter() }).lean();
    const byId = new Map(properties.map((property) => [property._id.toString(), property]));
    return apiSuccess(collections.map((collection) => ({ ...collection, properties: collection.propertyIds.map((id) => byId.get(id.toString())).filter(Boolean) })));
  } catch (error) {
    return handleApiError(error, "property-collections.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const kind = kindOf(body.kind);
    const name = String(body.name || (kind === "COMPARE" ? "Comparison" : "Favorites")).trim().slice(0, 80);
    await connectDB();
    const item = await PropertyCollection.findOneAndUpdate({ userId: actor.id, name, kind }, { $setOnInsert: { propertyIds: [] }, $unset: { deletedAt: 1 } }, { upsert: true, new: true, runValidators: true });
    return apiSuccess(item, { status: 201 });
  } catch (error) {
    return handleApiError(error, "property-collections.create");
  }
}

export async function PATCH(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.propertyId)) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    await connectDB();
    const property = await Property.findOne({ _id: body.propertyId, ...listingPublicFilter() }).select("_id").lean();
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    const kind = kindOf(body.kind);
    const name = String(body.name || (kind === "COMPARE" ? "Comparison" : "Favorites")).trim().slice(0, 80);
    let item = await PropertyCollection.findOne({ userId: actor.id, name, kind });
    if (!item) item = new PropertyCollection({ userId: actor.id, name, kind, propertyIds: [] });
    const exists = item.propertyIds.some((id) => id.toString() === body.propertyId);
    if (body.remove === true || exists) item.propertyIds.pull(body.propertyId);
    else {
      if (kind === "COMPARE" && item.propertyIds.length >= 4) return apiError("Compare up to four properties at a time", { status: 409, code: "COMPARE_LIMIT" });
      item.propertyIds.addToSet(body.propertyId);
    }
    item.deletedAt = undefined;
    await item.save();
    await writeAuditLog({ actor, action: "property_collection.update", targetType: "PropertyCollection", targetId: item._id, metadata: { kind, propertyId: body.propertyId, added: !exists }, request });
    return apiSuccess({ collection: item, added: !exists && body.remove !== true });
  } catch (error) {
    return handleApiError(error, "property-collections.update");
  }
}
