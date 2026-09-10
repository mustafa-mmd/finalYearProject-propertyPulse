import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { DEFAULT_SUBSCRIPTION_PLANS } from "../config/plans.js";

const apply = process.argv.includes("--apply");
const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is required. Run with Node --env-file=.env.local.");
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

function reference(id) { return `PP-${id.toString().slice(-8).toUpperCase()}-${crypto.createHash("sha1").update(id.toString()).digest("hex").slice(0, 4).toUpperCase()}`; }
function purpose(property) { if (Number(property?.pricing?.salePrice) > 0) return "SALE"; if (Number(property?.rates?.nightly) > 0) return "SHORT_TERM_RENT"; return "LONG_TERM_RENT"; }
function category(type = "") { const value = String(type).toUpperCase(); return ["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "VILLA", "ROOM", "STUDIO", "LAND", "OFFICE", "SHOP", "WAREHOUSE", "INDUSTRIAL", "BUILDING", "UNIT"].find((item) => value.includes(item)) || "OTHER"; }

const legacyProperties = await db.collection("properties").find({ $or: [{ listingStatus: { $exists: false } }, { listingReference: { $exists: false } }, { listingPurpose: { $exists: false } }] }).toArray();
const ownerIds = new Set();
const propertyUpdates = legacyProperties.map((property) => {
  const owners = Array.isArray(property.owner)
    ? property.owner
    : property.owner
      ? [property.owner]
      : [];
  for (const id of owners) ownerIds.add(id.toString());
  const ownerObjectIds = owners.map((id) => typeof id === "string" ? new ObjectId(id) : id);

  return {
    updateOne: {
      filter: { _id: property._id },
      update: {
        $set: {
          owner: ownerObjectIds,
          listingStatus: property.listingStatus || "PUBLISHED",
          listingReference: property.listingReference || reference(property._id),
          listingPurpose: property.listingPurpose || purpose(property),
          listingCategory: property.listingCategory || category(property.type),
          currency: property.currency || "ZAR",
          completenessScore: property.completenessScore ?? 60,
          media: property.media?.length ? property.media : (property.images || []).map((url, index) => ({ type: "IMAGE", url, order: index, isCover: index === 0 })),
          statusHistory: property.statusHistory?.length ? property.statusHistory : [{ status: "PUBLISHED", reason: "Legacy record migration", at: property.createdAt || new Date() }]
        }
      }
    }
  };
});

const userUpdates = [
  { updateMany: { filter: { roles: { $exists: false } }, update: { $set: { roles: ["USER"] } } } },
  { updateMany: { filter: { accountStatus: { $exists: false } }, update: { $set: { accountStatus: "ACTIVE" } } } },
  { updateMany: { filter: { bookmarks: { $exists: false } }, update: { $set: { bookmarks: [] } } } },
];
if (ownerIds.size) userUpdates.push({ updateMany: { filter: { _id: { $in: [...ownerIds].map((id) => new ObjectId(id)) } }, update: { $addToSet: { roles: "PROPERTY_OWNER" } } } });

const legacyMessages = await db.collection("messages").find({ tenantId: { $exists: false } }).project({ _id: 1, property: 1 }).toArray();
const legacyPayments = await db.collection("payments").countDocuments({ statusHistory: { $exists: false } });
const featureFlags = [
  { key: "marketplace.sales", description: "Property sale offers and milestones", enabled: true, rolloutPercentage: 100 },
  { key: "rentals.recurring", description: "Recurring rent schedules and invoices", enabled: true, rolloutPercentage: 100 },
  { key: "ai.document_extraction", description: "Gemini document field extraction with mandatory human review", enabled: false, rolloutPercentage: 0 },
  { key: "international.checkout", description: "Non-ZAR regional payment adapters", enabled: false, rolloutPercentage: 0 },
];
const summary = { mode: apply ? "APPLY" : "DRY_RUN", legacyProperties: propertyUpdates.length, propertyOwners: ownerIds.size, legacyMessages: legacyMessages.length, legacyPayments, subscriptionPlans: DEFAULT_SUBSCRIPTION_PLANS.length, featureFlags: featureFlags.length, organizationStrategy: "Personal legacy records remain personal; no organization is inferred without owner confirmation" };
console.log(JSON.stringify(summary, null, 2));
if (apply) {
  if (propertyUpdates.length) await db.collection("properties").bulkWrite(propertyUpdates, { ordered: false });
  await db.collection("users").bulkWrite(userUpdates, { ordered: true });
  for (const message of legacyMessages) {
    const property = message.property ? await db.collection("properties").findOne({ _id: message.property }, { projection: { tenantId: 1 } }) : null;
    if (property?.tenantId) await db.collection("messages").updateOne({ _id: message._id }, { $set: { tenantId: property.tenantId } });
  }
  await db.collection("payments").updateMany({ statusHistory: { $exists: false } }, [{ $set: { statusHistory: [{ status: { $ifNull: ["$paymentStatus", "pending"] }, source: "legacy_migration", at: { $ifNull: ["$updatedAt", "$$NOW"] } }] } }]);
  for (const plan of DEFAULT_SUBSCRIPTION_PLANS) await db.collection("subscriptionplans").updateOne({ code: plan.code }, { $set: { ...plan, active: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  for (const flag of featureFlags) await db.collection("featureflags").updateOne({ key: flag.key }, { $setOnInsert: { ...flag, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
  console.log("Commercial foundation migration applied successfully.");
} else console.log("No data changed. Re-run with --apply after reviewing the counts.");
await client.close();
