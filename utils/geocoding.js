import { createHash } from "node:crypto";
import connectDB from "../config/database.js";
import GeocodeCache from "../models/GeocodeCache.js";
import {
  buildGeocodingQuery,
  hasCoordinates,
  normalizeLocation,
  serializeLocationForDatabase,
} from "./location.js";

const GEOAPIFY_AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";
const GEOAPIFY_FORWARD_URL = "https://api.geoapify.com/v1/geocode/search";
const GEOAPIFY_REVERSE_URL = "https://api.geoapify.com/v1/geocode/reverse";
const CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_ATTEMPTS = 2;

const inFlightRequests =
  globalThis.__propertyPulseGeocodingRequests ||
  (globalThis.__propertyPulseGeocodingRequests = new Map());

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const geoapifyToken = () =>
  process.env.GEOAPIFY_API_KEY ||
  process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ||
  "";

const requestJson = async (url) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "PropertyPulse/1.0 location-service",
        },
        cache: "no-store",
      });

      if (response.ok) return await response.json();

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        throw new Error(`Geoapify returned ${response.status}`);
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter)
        ? Math.min(retryAfter * 1000, 4_000)
        : 300 * 2 ** attempt;
      lastError = new Error(`Geoapify returned ${response.status}`);
      await wait(delay);
    } catch (error) {
      lastError =
        error.name === "AbortError"
          ? new Error("Geoapify request timed out")
          : error;
      if (attempt < MAX_ATTEMPTS - 1) {
        await wait(300 * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Geoapify request failed");
};

const cacheKey = (mode, value) =>
  createHash("sha256")
    .update(`${mode}:${String(value).trim().toLocaleLowerCase()}`)
    .digest("hex");

const readCache = async (key) => {
  await connectDB();
  const cached = await GeocodeCache.findOne({
    key,
    expiresAt: { $gt: new Date() },
  }).lean();
  return cached?.location ? normalizeLocation(cached.location) : null;
};

const writeCache = async (key, mode, location) => {
  await connectDB();
  const normalized = normalizeLocation(location);
  await GeocodeCache.findOneAndUpdate(
    { key },
    {
      $set: {
        mode,
        provider: "geoapify",
        location: normalized,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    },
    { upsert: true, new: true },
  );
  return normalized;
};

const deduplicate = async (key, operation) => {
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = Promise.resolve()
    .then(operation)
    .finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
};

const geoapifyLocation = (feature) => {
  const properties = feature?.properties || {};

  return normalizeLocation({
    formattedAddress:
      properties.formatted ||
      [properties.address_line1, properties.address_line2]
        .filter(Boolean)
        .join(", "),
    country: properties.country,
    countryCode: properties.country_code,
    state: properties.state || properties.state_district,
    city:
      properties.city ||
      properties.town ||
      properties.village ||
      properties.municipality,
    area:
      properties.suburb ||
      properties.quarter ||
      properties.neighbourhood ||
      properties.locality,
    district: properties.district || properties.county,
    street:
      properties.street || properties.address_line1 || properties.name,
    postalCode: properties.postcode,
    latitude: properties.lat ?? feature?.geometry?.coordinates?.[1],
    longitude: properties.lon ?? feature?.geometry?.coordinates?.[0],
    placeId: properties.place_id
      ? `geoapify:${properties.place_id}`
      : "",
    provider: "geoapify",
    accuracy:
      properties.rank?.confidence?.toString() ||
      properties.result_type ||
      "geocoded",
    resolutionStatus: "resolved",
  });
};

const requireToken = () => {
  const token = geoapifyToken();
  if (!token) {
    throw new Error("Geoapify is not configured");
  }
  return token;
};

const autocomplete = async (query, proximity, language) => {
  const params = new URLSearchParams({
    text: query,
    apiKey: requireToken(),
    format: "geojson",
    limit: "8",
    lang: language || "en",
  });
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(proximity)) {
    params.set("bias", `proximity:${proximity}`);
  }

  const data = await requestJson(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params}`);

  return (data.features || [])
    .map((feature) => {
      const location = geoapifyLocation(feature);
      return {
        id: location.placeId || location.formattedAddress,
        label: location.formattedAddress,
        primaryText:
          feature.properties?.address_line1 ||
          feature.properties?.name ||
          location.formattedAddress,
        secondaryText: feature.properties?.address_line2 || "",
        provider: "geoapify",
        location,
      };
    })
    .filter((suggestion) => suggestion.label);
};

export const autocompleteLocations = async ({
  query,
  proximity = "",
  language = "en",
}) => {
  const normalizedQuery = String(query || "").trim().slice(0, 256);
  if (normalizedQuery.length < 3) return [];

  try {
    return await autocomplete(normalizedQuery, proximity, language);
  } catch (error) {
    console.warn("[geocoding] Geoapify autocomplete failed:", error.message);
    return [];
  }
};

const forwardGeocode = async (query) => {
  const params = new URLSearchParams({
    text: query,
    apiKey: requireToken(),
    format: "geojson",
    limit: "1",
  });
  const data = await requestJson(`${GEOAPIFY_FORWARD_URL}?${params}`);
  return data.features?.[0] ? geoapifyLocation(data.features[0]) : null;
};

const reverseGeocode = async (latitude, longitude) => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    apiKey: requireToken(),
    format: "geojson",
    limit: "1",
  });
  const data = await requestJson(`${GEOAPIFY_REVERSE_URL}?${params}`);
  return data.features?.[0] ? geoapifyLocation(data.features[0]) : null;
};

export const resolveLocation = async ({
  query = "",
  latitude = null,
  longitude = null,
}) => {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const isReverse =
    Number.isFinite(numericLatitude) &&
    numericLatitude >= -90 &&
    numericLatitude <= 90 &&
    Number.isFinite(numericLongitude) &&
    numericLongitude >= -180 &&
    numericLongitude <= 180;
  const normalizedQuery = String(query || "").trim().slice(0, 500);
  const keyValue = isReverse
    ? `${numericLatitude.toFixed(6)},${numericLongitude.toFixed(6)}`
    : normalizedQuery;
  const mode = isReverse ? "reverse" : "forward";

  if (!keyValue) throw new Error("A location or coordinates are required");

  const key = cacheKey(mode, keyValue);
  const cached = await readCache(key);
  if (cached) return { ...cached, cacheHit: true };

  return deduplicate(key, async () => {
    let resolved;

    try {
      resolved = isReverse
        ? await reverseGeocode(numericLatitude, numericLongitude)
        : await forwardGeocode(normalizedQuery);
    } catch (error) {
      console.warn("[geocoding] Geoapify resolution failed:", error.message);
    }

    if ((!resolved || !hasCoordinates(resolved)) && isReverse) {
      resolved = normalizeLocation({
        formattedAddress: `Selected location (${numericLatitude.toFixed(6)}, ${numericLongitude.toFixed(6)})`,
        latitude: numericLatitude,
        longitude: numericLongitude,
        provider: "manual",
        accuracy: "user_selected",
        resolutionStatus: "coordinates_only",
        isManual: true,
      });
    }

    if (!resolved || !hasCoordinates(resolved)) {
      throw new Error("Geoapify could not resolve this location");
    }

    const stored = await writeCache(key, mode, resolved);
    return { ...stored, cacheHit: false };
  });
};

export const ensureResolvedLocation = async (input) => {
  const location = normalizeLocation(input);
  if (hasCoordinates(location)) {
    return serializeLocationForDatabase(location);
  }

  const query = buildGeocodingQuery(location);
  if (!query) return serializeLocationForDatabase(location);

  try {
    const resolved = await resolveLocation({ query });

    return serializeLocationForDatabase({
      ...location,
      ...resolved,
      formattedAddress: resolved.formattedAddress || query,
      street: resolved.street || location.street,
      city: resolved.city || location.city,
      state: resolved.state || location.state,
      postalCode: resolved.postalCode || location.postalCode,
    });
  } catch (error) {
    console.warn("[geocoding] Saving unresolved partial location:", error.message);
    return {
      ...serializeLocationForDatabase({
        ...location,
        formattedAddress: location.formattedAddress || query,
        resolutionStatus: "unresolved",
      }),
      lastGeocodeAttemptAt: new Date(),
    };
  }
};

export const geocodingProviderStatus = () => ({
  primary: geoapifyToken() ? "geoapify" : "not_configured",
});
