import { LISTING_CATEGORIES, LISTING_PURPOSES } from "@/config/listings";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MAX_PROPERTY_IMAGES = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function cleanText(value, maxLength, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\0/g, "").trim().slice(0, maxLength);
}

export function optionalNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}

export function requiredNumber(value, options) {
  const number = optionalNumber(value, options);
  return number === undefined ? null : number;
}

export function normalizePurpose(value) {
  const purpose = cleanText(value, 50).toUpperCase();
  return LISTING_PURPOSES.includes(purpose) ? purpose : "LONG_TERM_RENT";
}

export function normalizeCategory(value, legacyType = "") {
  const explicit = cleanText(value, 50).toUpperCase();
  if (LISTING_CATEGORIES.includes(explicit)) return explicit;
  const normalizedLegacy = cleanText(legacyType, 50)
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return LISTING_CATEGORIES.includes(normalizedLegacy) ? normalizedLegacy : "OTHER";
}

export function validateImages(images) {
  if (images.length > MAX_PROPERTY_IMAGES) {
    return `Upload no more than ${MAX_PROPERTY_IMAGES} images`;
  }
  for (const image of images) {
    if (!IMAGE_TYPES.has(image.type)) return "Only JPEG, PNG, WebP, and AVIF images are supported";
    if (image.size <= 0 || image.size > MAX_IMAGE_BYTES) {
      return "Each image must be between 1 byte and 10 MB";
    }
  }
  return null;
}

export function parsePropertyNumbers(formData) {
  const values = {
    beds: requiredNumber(formData.get("beds"), { min: 0, max: 1000 }),
    baths: requiredNumber(formData.get("baths"), { min: 0, max: 1000 }),
    square_feet: optionalNumber(formData.get("square_feet"), { min: 0, max: 100_000_000 }),
    nightly: optionalNumber(formData.get("rates[nightly]") ?? formData.get("rates.nightly"), { min: 0, max: 100_000_000 }),
    weekly: optionalNumber(formData.get("rates[weekly]") ?? formData.get("rates.weekly"), { min: 0, max: 100_000_000 }),
    monthly: optionalNumber(formData.get("rates[monthly]") ?? formData.get("rates.monthly"), { min: 0, max: 100_000_000 }),
    salePrice: optionalNumber(formData.get("pricing[salePrice]") ?? formData.get("pricing.salePrice"), { min: 0, max: 100_000_000_000 }),
    monthlyRent: optionalNumber(formData.get("pricing[monthlyRent]") ?? formData.get("pricing.monthlyRent"), { min: 0, max: 100_000_000 }),
  };

  const invalid = Object.entries(values)
    .filter(([, value]) => value === null)
    .map(([key]) => key);
  return { values, invalid };
}
