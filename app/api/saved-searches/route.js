import crypto from "node:crypto";
import connectDB from "@/config/database";
import SavedSearch from "@/models/SavedSearch";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { normalizeSearchFilters } from "@/utils/searchFilters";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";

const signatureFor = (filters) => crypto.createHash("sha256").update(JSON.stringify(filters)).digest("hex");
const cleanName = (value) => String(value || "").trim().slice(0, 100);
const cleanAlerts = (alerts = {}) => ({
  enabled: alerts.enabled !== false,
  newListings: alerts.newListings !== false,
  priceDrops: alerts.priceDrops !== false,
  statusChanges: alerts.statusChanges === true,
  availability: alerts.availability === true,
  channels: Array.from(new Set(Array.isArray(alerts.channels) ? alerts.channels : ["IN_APP"]))
    .filter((channel) => ["IN_APP", "EMAIL", "PUSH"].includes(channel)),
  frequency: ["IMMEDIATE", "DAILY", "WEEKLY"].includes(alerts.frequency) ? alerts.frequency : "DAILY",
});

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const items = await SavedSearch.find({ userId: actor.id, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error, "saved-searches.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const filters = normalizeSearchFilters(body.filters || {});
    filters.page = "1";
    const name = cleanName(body.name) || filters.q || "My property search";
    const signature = signatureFor(filters);
    await connectDB();
    const item = await SavedSearch.findOneAndUpdate(
      { userId: actor.id, signature },
      { $set: { name, filters, alerts: cleanAlerts(body.alerts), deletedAt: null } },
      { upsert: true, new: true, runValidators: true },
    );
    await writeAuditLog({ actor, action: "saved_search.upsert", targetType: "SavedSearch", targetId: item._id, request });
    return apiSuccess(item, { status: 201 });
  } catch (error) {
    return handleApiError(error, "saved-searches.create");
  }
}

export async function PATCH(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    if (!body.id) return apiError("Saved search is required", { status: 422, code: "VALIDATION_ERROR" });
    const update = {};
    if (body.name !== undefined) update.name = cleanName(body.name);
    if (body.alerts !== undefined) update.alerts = cleanAlerts(body.alerts);
    await connectDB();
    const item = await SavedSearch.findOneAndUpdate({ _id: body.id, userId: actor.id, deletedAt: { $exists: false } }, { $set: update }, { new: true, runValidators: true });
    if (!item) return apiError("Saved search not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor, action: "saved_search.update", targetType: "SavedSearch", targetId: item._id, request });
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error, "saved-searches.update");
  }
}

export async function DELETE(request) {
  try {
    const actor = await requireActor();
    const id = new URL(request.url).searchParams.get("id");
    await connectDB();
    const item = await SavedSearch.findOneAndUpdate({ _id: id, userId: actor.id }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!item) return apiError("Saved search not found", { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ actor, action: "saved_search.delete", targetType: "SavedSearch", targetId: item._id, request });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "saved-searches.delete");
  }
}
