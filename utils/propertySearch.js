import connectDB from "@/config/database";
import Property from "@/models/Property";
import { normalizeSearchFilters } from "@/utils/searchFilters";
import { listingPublicFilter } from "@/config/listings";

const RATE_PATHS = Object.freeze({
  nightly: "rates.nightly",
  weekly: "rates.weekly",
  monthly: "rates.monthly",
  sale: "pricing.salePrice",
});

const SORT_OPTIONS = Object.freeze({
  recommended: null,
  newest: { createdAt: -1, _id: -1 },
  price_asc: "price_asc",
  price_desc: "price_desc",
  area_desc: { square_feet: -1, createdAt: -1 },
  beds_desc: { beds: -1, baths: -1, createdAt: -1 },
});

const SEARCH_FIELDS = [
  "name",
  "description",
  "type",
  "location.formattedAddress",
  "location.street",
  "location.area",
  "location.district",
  "location.city",
  "location.state",
  "location.country",
  "location.postalCode",
  "location.zipcode",
  "amenities",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveNumber = (value) => {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const rangeFilter = (minimum, maximum) => {
  const min = toPositiveNumber(minimum);
  const max = toPositiveNumber(maximum);

  if (min === null && max === null) return null;

  const lower = min !== null && max !== null ? Math.min(min, max) : min;
  const upper = min !== null && max !== null ? Math.max(min, max) : max;

  return {
    ...(lower !== null ? { $gte: lower } : {}),
    ...(upper !== null ? { $lte: upper } : {}),
  };
};

export const buildPropertyQuery = (filters) => {
  const conditions = [];
  const queryTokens = filters.q
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const token of queryTokens) {
    const pattern = new RegExp(escapeRegex(token), "i");
    conditions.push({
      $or: SEARCH_FIELDS.map((field) => ({ [field]: pattern })),
    });
  }

  if (filters.type) {
    conditions.push({
      type: new RegExp(`^${escapeRegex(filters.type)}$`, "i"),
    });
  }
  if (filters.purpose) conditions.push({ listingPurpose: filters.purpose });
  if (filters.category) conditions.push({ listingCategory: filters.category });
  if (filters.furnishing) conditions.push({ "marketDetails.furnishing": filters.furnishing });
  if (filters.petsAllowed) conditions.push({ "marketDetails.petsAllowed": filters.petsAllowed === "true" });
  if (filters.parking) conditions.push({ "marketDetails.parkingSpaces": { $gte: Number(filters.parking) } });
  if (filters.verified === "true") conditions.push({ "verification.status": "VERIFIED" });
  if (filters.availableBy) {
    const availableBy = new Date(`${filters.availableBy}T23:59:59.999Z`);
    if (!Number.isNaN(availableBy.getTime())) {
      conditions.push({ "marketDetails.availabilityDate": { $lte: availableBy } });
    }
  }

  if (filters.polygon) {
    const points = filters.polygon.split(";").map((point) => point.split(",").map(Number));
    if (points.length >= 3) {
      const first = points[0];
      const last = points.at(-1);
      if (first[0] !== last[0] || first[1] !== last[1]) points.push(first);
      conditions.push({ "location.coordinates": { $geoWithin: { $geometry: { type: "Polygon", coordinates: [points] } } } });
    }
  } else if (filters.bounds) {
    const [west, south, east, north] = filters.bounds.split(",").map(Number);
    conditions.push({ "location.coordinates": { $geoWithin: { $box: [[west, south], [east, north]] } } });
  } else if (filters.latitude && filters.longitude) {
    const latitude = Number(filters.latitude);
    const longitude = Number(filters.longitude);
    const radiusKm = Math.max(0.25, Number(filters.radiusKm) || 10);
    conditions.push({ "location.coordinates": { $geoWithin: { $centerSphere: [[longitude, latitude], radiusKm / 6378.1] } } });
  }

  const minimumBeds = toPositiveNumber(filters.beds);
  if (minimumBeds !== null) conditions.push({ beds: { $gte: minimumBeds } });

  const minimumBaths = toPositiveNumber(filters.baths);
  if (minimumBaths !== null) conditions.push({ baths: { $gte: minimumBaths } });

  const priceRange = rangeFilter(filters.minPrice, filters.maxPrice);
  if (priceRange) {
    const ratePath = RATE_PATHS[filters.pricePeriod] || RATE_PATHS.monthly;
    conditions.push({ [ratePath]: priceRange });
  }

  const areaRange = rangeFilter(filters.minArea, filters.maxArea);
  if (areaRange) conditions.push({ square_feet: areaRange });

  return conditions.length > 0 ? { $and: conditions } : {};
};

const getSort = (sort, pricePeriod) => {
  if (sort === "price_asc" || sort === "price_desc") {
    const ratePath = RATE_PATHS[pricePeriod] || RATE_PATHS.monthly;
    return {
      [ratePath]: sort === "price_asc" ? 1 : -1,
      createdAt: -1,
      _id: -1,
    };
  }

  return (
    SORT_OPTIONS[sort] || {
      is_featured: -1,
      createdAt: -1,
      _id: -1,
    }
  );
};

export const searchProperties = async (source = {}, options = {}) => {
  await connectDB();

  const filters = normalizeSearchFilters(source);
  const page = clampInteger(filters.page, 1, 1, 10000);
  const pageSize = clampInteger(options.pageSize, 9, 1, 24);
  const searchQuery = buildPropertyQuery(filters);
  const query = { $and: [listingPublicFilter(), searchQuery] };
  const sort = getSort(filters.sort, filters.pricePeriod);
  const skip = (page - 1) * pageSize;

  const [properties, total] = await Promise.all([
    Property.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    Property.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    properties,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    appliedFilters: { ...filters, page: String(page) },
  };
};

const cleanFacetRows = (rows, key) =>
  rows
    .filter((row) => typeof row._id === "string" && row._id.trim())
    .map((row) => ({
      value: row._id.trim(),
      label: row._id.trim(),
      count: row.count,
      ...(key ? { kind: key } : {}),
    }));

const facetPipeline = (field, limit = 50) => [
  {
    $match: { $and: [listingPublicFilter(), { [field]: { $type: "string", $ne: "" } }] },
  },
  {
    $group: {
      _id: { $trim: { input: `$${field}` } },
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1, _id: 1 } },
  { $limit: limit },
];

export const getSearchOptions = async (rawQuery = "") => {
  await connectDB();

  const query = String(rawQuery ?? "").trim().slice(0, 80);
  const pattern = query ? new RegExp(escapeRegex(query), "i") : null;

  const suggestionTerms = pattern
    ? {
        $or: [
          { name: pattern },
          { type: pattern },
          { "location.city": pattern },
          { "location.state": pattern },
          { "location.street": pattern },
        ],
      }
    : {};
  const suggestionFilter = { $and: [listingPublicFilter(), suggestionTerms] };

  if (query) {
    const [suggestionProperties, matchingCityRows] = await Promise.all([
      Property.find(suggestionFilter)
        .select("name type location.city location.state")
        .sort({ is_featured: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      Property.aggregate([
        {
          $match: {
            $and: [listingPublicFilter(), { "location.city": pattern }],
          },
        },
        ...facetPipeline("location.city", 8),
      ]),
    ]);

    return {
      suggestions: buildSuggestions(
        suggestionProperties,
        cleanFacetRows(matchingCityRows, "location"),
        query,
      ),
    };
  }

  const [typeRows, purposeRows, categoryRows, cityRows, stateRows, rangeRows, suggestionProperties] =
    await Promise.all([
      Property.aggregate(facetPipeline("type")),
      Property.aggregate(facetPipeline("listingPurpose")),
      Property.aggregate(facetPipeline("listingCategory")),
      Property.aggregate(facetPipeline("location.city", 20)),
      Property.aggregate(facetPipeline("location.state", 20)),
      Property.aggregate([
        { $match: listingPublicFilter() },
        {
          $group: {
            _id: null,
            minBeds: { $min: "$beds" },
            maxBeds: { $max: "$beds" },
            minBaths: { $min: "$baths" },
            maxBaths: { $max: "$baths" },
            minArea: { $min: "$square_feet" },
            maxArea: { $max: "$square_feet" },
            minNightly: { $min: "$rates.nightly" },
            maxNightly: { $max: "$rates.nightly" },
            minWeekly: { $min: "$rates.weekly" },
            maxWeekly: { $max: "$rates.weekly" },
            minMonthly: { $min: "$rates.monthly" },
            maxMonthly: { $max: "$rates.monthly" },
          },
        },
      ]),
      Property.find(suggestionFilter)
        .select("name type location.city location.state")
        .sort({ is_featured: -1, createdAt: -1 })
        .limit(query ? 8 : 5)
        .lean(),
    ]);

  const locationRows = cleanFacetRows(cityRows, "location");

  return {
    types: cleanFacetRows(typeRows),
    purposes: cleanFacetRows(purposeRows),
    categories: cleanFacetRows(categoryRows),
    locations: locationRows,
    states: cleanFacetRows(stateRows),
    ranges: rangeRows[0] || {},
    suggestions: buildSuggestions(suggestionProperties, locationRows),
  };
};

const buildSuggestions = (properties, locationRows, query = "") => {
  const seenSuggestions = new Set();
  const suggestions = [];
  const normalizedQuery = query.toLocaleLowerCase();

  for (const property of properties) {
    const location = [property.location?.city, property.location?.state]
      .filter(Boolean)
      .join(", ");
    const suggestion = {
      value: property.name,
      label: property.name,
      detail: [property.type, location].filter(Boolean).join(" · "),
      kind: "property",
    };
    const key = suggestion.value.toLocaleLowerCase();
    if (!seenSuggestions.has(key)) {
      seenSuggestions.add(key);
      suggestions.push(suggestion);
    }
  }

  for (const location of locationRows) {
    if (suggestions.length >= 8) break;
    if (normalizedQuery && !location.value.toLocaleLowerCase().includes(normalizedQuery)) {
      continue;
    }
    const key = location.value.toLocaleLowerCase();
    if (!seenSuggestions.has(key)) {
      seenSuggestions.add(key);
      suggestions.push({
        value: location.value,
        label: location.label,
        detail: `${location.count} listing${location.count === 1 ? "" : "s"}`,
        kind: "location",
      });
    }
  }

  return suggestions;
};
