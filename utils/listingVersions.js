import ListingVersion from "@/models/ListingVersion";

export async function recordListingVersion(property, actorId, action, options = {}) {
  const latest = await ListingVersion.findOne({ propertyId: property._id })
    .sort({ version: -1 })
    .select("version")
    .lean();

  return ListingVersion.create({
    propertyId: property._id,
    tenantId: property.tenantId || undefined,
    version: (latest?.version || 0) + 1,
    action,
    snapshot: property.toObject ? property.toObject() : property,
    changedFields: options.changedFields || [],
    createdBy: actorId,
    reason: options.reason,
  });
}
