export const DEFAULT_SEARCH_FILTERS = Object.freeze({
  q: "",
  purpose: "",
  category: "",
  type: "",
  beds: "",
  baths: "",
  pricePeriod: "monthly",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  furnishing: "",
  petsAllowed: "",
  parking: "",
  verified: "",
  availableBy: "",
  latitude: "",
  longitude: "",
  radiusKm: "",
  bounds: "",
  polygon: "",
  sort: "recommended",
  page: "1",
});

const firstValue = (value) => (Array.isArray(value) ? value[0] : value);

const readParam = (source, key) => {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }

  return firstValue(source?.[key]);
};

const cleanString = (value, maxLength = 100) =>
  String(value ?? "").trim().slice(0, maxLength);

const cleanNumber = (value, maximum) => {
  const rawValue = cleanString(value, 20);
  if (!rawValue) return "";

  const number = Number(rawValue);
  if (!Number.isFinite(number) || number < 0) return "";
  return String(Math.min(number, maximum));
};

const cleanCoordinate = (value, minimum, maximum) => {
  const rawValue = cleanString(value, 24);
  if (!rawValue) return "";
  const number = Number(rawValue);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? String(number) : "";
};

const cleanBounds = (value) => {
  const rawValue = cleanString(value, 120);
  const values = rawValue.split(",").map(Number);
  if (values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) return "";
  const [west, south, east, north] = values;
  return west >= -180 && east <= 180 && south >= -90 && north <= 90 && west < east && south < north ? values.join(",") : "";
};

const cleanPolygon = (value) => {
  const rawValue = cleanString(value, 1800);
  if (!rawValue) return "";
  const points = rawValue.split(";").map((point) => point.split(",").map(Number));
  if (points.length < 3 || points.length > 100 || points.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90)) return "";
  return points.map(([lng, lat]) => `${lng},${lat}`).join(";");
};

const PRICE_PERIODS = new Set(["nightly", "weekly", "monthly", "sale"]);
const BOOLEAN_VALUES = new Set(["true", "false"]);
const SORT_VALUES = new Set([
  "recommended",
  "newest",
  "price_asc",
  "price_desc",
  "area_desc",
  "beds_desc",
]);

export const normalizeSearchFilters = (source = {}) => {
  const legacyQuery = readParam(source, "location");
  const legacyType = readParam(source, "propertyType");
  const rawType = readParam(source, "type") ?? legacyType;
  const pricePeriod = cleanString(readParam(source, "pricePeriod"), 12);
  const sort = cleanString(readParam(source, "sort"), 24);

  return {
    q: cleanString(readParam(source, "q") ?? legacyQuery),
    purpose: cleanString(readParam(source, "purpose"), 50).toUpperCase(),
    category: cleanString(readParam(source, "category"), 50).toUpperCase(),
    type: cleanString(rawType === "All" ? "" : rawType, 60),
    beds: cleanNumber(readParam(source, "beds"), 20),
    baths: cleanNumber(readParam(source, "baths"), 20),
    pricePeriod: PRICE_PERIODS.has(pricePeriod) ? pricePeriod : "monthly",
    minPrice: cleanNumber(readParam(source, "minPrice"), 1_000_000_000),
    maxPrice: cleanNumber(readParam(source, "maxPrice"), 1_000_000_000),
    minArea: cleanNumber(readParam(source, "minArea"), 1_000_000_000),
    maxArea: cleanNumber(readParam(source, "maxArea"), 1_000_000_000),
    furnishing: cleanString(readParam(source, "furnishing"), 30).toUpperCase(),
    petsAllowed: BOOLEAN_VALUES.has(cleanString(readParam(source, "petsAllowed"), 5))
      ? cleanString(readParam(source, "petsAllowed"), 5)
      : "",
    parking: cleanNumber(readParam(source, "parking"), 100),
    verified: BOOLEAN_VALUES.has(cleanString(readParam(source, "verified"), 5))
      ? cleanString(readParam(source, "verified"), 5)
      : "",
    availableBy: /^\d{4}-\d{2}-\d{2}$/.test(cleanString(readParam(source, "availableBy"), 10))
      ? cleanString(readParam(source, "availableBy"), 10)
      : "",
    latitude: cleanCoordinate(readParam(source, "latitude") ?? readParam(source, "lat"), -90, 90),
    longitude: cleanCoordinate(readParam(source, "longitude") ?? readParam(source, "lng"), -180, 180),
    radiusKm: cleanNumber(readParam(source, "radiusKm"), 500),
    bounds: cleanBounds(readParam(source, "bounds")),
    polygon: cleanPolygon(readParam(source, "polygon")),
    sort: SORT_VALUES.has(sort) ? sort : "recommended",
    page: cleanNumber(readParam(source, "page"), 10_000) || "1",
  };
};

export const buildSearchParams = (filters, overrides = {}) => {
  const values = normalizeSearchFilters({ ...filters, ...overrides });
  const params = new URLSearchParams();

  if (values.q) params.set("q", values.q);
  if (values.purpose) params.set("purpose", values.purpose);
  if (values.category) params.set("category", values.category);
  if (values.type) params.set("type", values.type);
  if (values.beds) params.set("beds", values.beds);
  if (values.baths) params.set("baths", values.baths);

  const hasPrice = values.minPrice || values.maxPrice;
  if (hasPrice) {
    params.set("pricePeriod", values.pricePeriod);
    if (values.minPrice) params.set("minPrice", values.minPrice);
    if (values.maxPrice) params.set("maxPrice", values.maxPrice);
  }

  if (values.minArea) params.set("minArea", values.minArea);
  if (values.maxArea) params.set("maxArea", values.maxArea);
  if (values.furnishing) params.set("furnishing", values.furnishing);
  if (values.petsAllowed) params.set("petsAllowed", values.petsAllowed);
  if (values.parking) params.set("parking", values.parking);
  if (values.verified) params.set("verified", values.verified);
  if (values.availableBy) params.set("availableBy", values.availableBy);
  if (values.latitude && values.longitude) {
    params.set("latitude", values.latitude);
    params.set("longitude", values.longitude);
    if (values.radiusKm) params.set("radiusKm", values.radiusKm);
  }
  if (values.bounds) params.set("bounds", values.bounds);
  if (values.polygon) params.set("polygon", values.polygon);
  if (values.sort !== "recommended") params.set("sort", values.sort);
  if (values.page !== "1") params.set("page", values.page);

  return params;
};

export const hasAdvancedFilters = (filters) =>
  Boolean(
    filters.purpose ||
      filters.category ||
      filters.beds ||
      filters.baths ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minArea ||
      filters.maxArea ||
      filters.furnishing ||
      filters.petsAllowed ||
      filters.parking ||
      filters.verified ||
      filters.availableBy ||
      (filters.latitude && filters.longitude) ||
      filters.bounds ||
      filters.polygon ||
      filters.sort !== "recommended",
  );
