import Property from "@/models/Property";
import User from "@/models/User";
import { listingPublicFilter } from "@/config/listings";

export async function recommendedProperties(actorId, limit = 12) {
  const user = actorId ? await User.findById(actorId).select("bookmarks preferences").lean() : null;
  const saved = user?.bookmarks?.length ? await Property.find({ _id: { $in: user.bookmarks }, ...listingPublicFilter() }).select("listingPurpose listingCategory location.city location.countryCode").lean() : [];
  const purposes = [...new Set(saved.map((item) => item.listingPurpose).filter(Boolean))]; const categories = [...new Set(saved.map((item) => item.listingCategory).filter(Boolean))]; const cities = [...new Set(saved.map((item) => item.location?.city).filter(Boolean))];
  const candidates = await Property.find({ ...listingPublicFilter(), ...(user?.bookmarks?.length ? { _id: { $nin: user.bookmarks } } : {}) }).sort({ is_featured: -1, publishedAt: -1, createdAt: -1 }).limit(100).lean();
  return candidates.map((property) => { const reasons = []; let score = Number(property.is_featured) * 8 + (property.verification?.status === "VERIFIED" ? 12 : 0); if (purposes.includes(property.listingPurpose)) { score += 30; reasons.push("matches your preferred listing purpose"); } if (categories.includes(property.listingCategory)) { score += 25; reasons.push("similar property category"); } if (cities.includes(property.location?.city)) { score += 20; reasons.push("in an area you saved"); } if (!saved.length) reasons.push("recently published"); return { property, score, reasons }; }).sort((a, b) => b.score - a.score).slice(0, limit);
}

export function calculateLeadScore({ hasMessage, hasViewing, hasBookmark, hasApplication, verified }) {
  const factors = []; const add = (condition, code, points) => condition && factors.push({ code, points }); add(hasMessage, "MESSAGE_SENT", 15); add(hasViewing, "VIEWING_REQUESTED", 25); add(hasBookmark, "PROPERTY_SAVED", 10); add(hasApplication, "APPLICATION_OR_OFFER", 35); add(verified, "VERIFIED_IDENTITY", 15); const score = Math.min(100, factors.reduce((total, factor) => total + factor.points, 0)); return { score, grade: score >= 70 ? "HOT" : score >= 35 ? "WARM" : "COLD", factors };
}
