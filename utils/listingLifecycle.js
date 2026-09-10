import { hasCoordinates, hasUsableLocation, normalizeLocation } from "@/utils/location";

const CHECKS = Object.freeze([
  ["title", 10, (property) => Boolean(property.name?.trim().length >= 4)],
  ["description", 10, (property) => Boolean(property.description?.trim().length >= 15)],
  ["category", 8, (property) => Boolean(property.listingCategory || property.type)],
  ["purpose", 8, (property) => Boolean(property.listingPurpose)],
  ["address", 12, (property) => Boolean(normalizeLocation(property.location).formattedAddress)],
  ["coordinates", 10, (property) => hasUsableLocation(property.location)],
  ["media", 12, (property) => Boolean((property.images?.length || property.media?.length || 0) >= 1)],
  ["details", 10, (property) => Number(property.square_feet) > 0 || Number(property.beds) > 0 || Number(property.baths) > 0],
  ["pricing", 12, (property) => hasUsablePrice(property)],
  ["contact", 8, (property) => Boolean(property.seller_info?.email || property.seller_info?.phone || property.owner?.length || property.user)],
]);

function hasUsablePrice(property) {
  const values = [
    property.pricing?.salePrice,
    property.pricing?.monthlyRent,
    property.rates?.nightly,
    property.rates?.weekly,
    property.rates?.monthly,
  ];
  return values.some((value) => Number.isFinite(Number(value)) && Number(value) > 0);
}

export function calculateListingCompleteness(property) {
  let score = 0;
  const missing = [];

  for (const [key, weight, check] of CHECKS) {
    if (check(property)) score += weight;
    else missing.push(key);
  }

  return { score: Math.min(100, score), missing };
}

export function isSubmittable(property) {
  const result = calculateListingCompleteness(property);
  return {
    ...result,
    submittable: result.score >= 50 && hasUsableLocation(property.location),
  };
}

