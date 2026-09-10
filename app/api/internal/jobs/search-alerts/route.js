import connectDB from "@/config/database";
import SavedSearch from "@/models/SavedSearch";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { searchProperties } from "@/utils/propertySearch";
import { emitNotification } from "@/utils/events";

export const dynamic = "force-dynamic";

const isDue = (search, now) => {
  if (!search.lastRunAt) return true;
  const elapsed = now.getTime() - search.lastRunAt.getTime();
  if (search.alerts.frequency === "IMMEDIATE") return elapsed >= 5 * 60_000;
  if (search.alerts.frequency === "WEEKLY") return elapsed >= 7 * 86_400_000;
  return elapsed >= 86_400_000;
};

export async function POST(request) {
  try {
    const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return apiError("Unauthorized", { status: 401, code: "UNAUTHORIZED" });
    await connectDB();
    const now = new Date();
    const candidates = await SavedSearch.find({ deletedAt: { $exists: false }, "alerts.enabled": true }).sort({ lastRunAt: 1 }).limit(100);
    let processed = 0;
    let notifications = 0;
    for (const search of candidates) {
      if (!isDue(search, now)) continue;
      const result = await searchProperties(search.filters, { pageSize: 24 });
      const ids = result.properties.map((property) => property._id.toString());
      const previous = new Set((search.lastResultIds || []).map(String));
      const newMatches = result.properties.filter((property) => !previous.has(property._id.toString()));
      const reduced = result.properties.filter((property) => search.lastRunAt && property.priceHistory?.some((entry) => entry.changedAt > search.lastRunAt && entry.amount >= 0));
      if (search.lastRunAt && search.alerts.newListings && newMatches.length) {
        await emitNotification({ recipientId: search.userId, type: "SEARCH_NEW_MATCHES", title: `${newMatches.length} new ${newMatches.length === 1 ? "property" : "properties"} match “${search.name}”`, body: "Newly available listings match your saved filters.", href: `/properties/search-results?${new URLSearchParams(search.filters).toString()}`, dedupeKey: `saved-search:new:${search._id}:${now.toISOString().slice(0, 10)}`, channels: search.alerts.channels?.length ? search.alerts.channels : ["IN_APP"] });
        notifications += 1;
      }
      if (search.lastRunAt && search.alerts.priceDrops && reduced.length) {
        await emitNotification({ recipientId: search.userId, type: "SEARCH_PRICE_CHANGES", title: `Price update in “${search.name}”`, body: `${reduced.length} matching ${reduced.length === 1 ? "property has" : "properties have"} updated pricing.`, href: `/properties/search-results?${new URLSearchParams(search.filters).toString()}`, dedupeKey: `saved-search:price:${search._id}:${now.toISOString().slice(0, 10)}`, channels: search.alerts.channels?.length ? search.alerts.channels : ["IN_APP"] });
        notifications += 1;
      }
      search.lastRunAt = now;
      search.lastResultIds = ids;
      await search.save();
      processed += 1;
    }
    return apiSuccess({ processed, notifications });
  } catch (error) {
    return handleApiError(error, "search-alerts.job");
  }
}
