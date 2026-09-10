export const EMPTY_LOCATION = Object.freeze({
  formattedAddress: "",
  country: "",
  countryCode: "",
  state: "",
  city: "",
  area: "",
  district: "",
  street: "",
  postalCode: "",
  zipcode: "",
  latitude: null,
  longitude: null,
  placeId: "",
  provider: "",
  accuracy: "",
  resolutionStatus: "unresolved",
  isManual: false,
});

const cleanText = (value, maxLength = 300) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const coordinate = (value, minimum, maximum) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
};

export const hasCoordinates = (location) =>
  coordinate(location?.latitude, -90, 90) !== null &&
  coordinate(location?.longitude, -180, 180) !== null;

export const normalizeLocation = (value = {}) => {
  const location =
    value && typeof value === "object"
      ? value
      : typeof value === "string" && value.trim()
        ? { formattedAddress: value.trim() }
        : {};

  const latitude = coordinate(location.latitude, -90, 90);
  const longitude = coordinate(location.longitude, -180, 180);
  const postalCode = cleanText(location.postalCode || location.zipcode, 40);

  const normalized = {
    formattedAddress: cleanText(location.formattedAddress, 500),
    country: cleanText(location.country, 100),
    countryCode: cleanText(location.countryCode, 3).toUpperCase(),
    state: cleanText(location.state, 120),
    city: cleanText(location.city, 120),
    area: cleanText(location.area, 120),
    district: cleanText(location.district, 120),
    street: cleanText(location.street, 200),
    postalCode,
    zipcode: postalCode,
    latitude,
    longitude,
    placeId: cleanText(location.placeId, 300),
    provider: cleanText(location.provider, 40),
    accuracy: cleanText(location.accuracy, 40),
    resolutionStatus: cleanText(location.resolutionStatus, 30) || "unresolved",
    isManual: Boolean(location.isManual),
  };

  if (!normalized.formattedAddress) {
    normalized.formattedAddress = buildLocationLabel(normalized);
  }

  if (hasCoordinates(normalized) && normalized.resolutionStatus === "unresolved") {
    normalized.resolutionStatus = "resolved";
  }

  return normalized;
};

export const buildLocationLabel = (location = {}) => {
  const parts = [
    location.street,
    location.area || location.district,
    location.city,
    location.state,
    location.postalCode || location.zipcode,
    location.country,
  ]
    .map((part) => cleanText(part))
    .filter(Boolean);

  return [...new Set(parts)].join(", ");
};

export const buildGeocodingQuery = (location = {}) =>
  cleanText(location.formattedAddress, 500) || buildLocationLabel(location);

const rawLocationFromFormData = (formData) => {
  const serialized = formData.get("location");
  if (typeof serialized === "string" && serialized.trim()) {
    try {
      const parsed = JSON.parse(serialized);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to legacy form field names.
    }
  }

  const read = (...names) => {
    for (const name of names) {
      const value = formData.get(name);
      if (typeof value === "string" && value.trim()) return value;
    }
    return "";
  };

  return {
    formattedAddress: read(
      "location[formattedAddress]",
      "location.formattedAddress",
    ),
    country: read("location[country]", "location.country"),
    countryCode: read("location[countryCode]", "location.countryCode"),
    state: read("location[state]", "location.state"),
    city: read("location[city]", "location.city"),
    area: read("location[area]", "location.area"),
    district: read("location[district]", "location.district"),
    street: read("location[street]", "location.street"),
    postalCode: read(
      "location[postalCode]",
      "location.postalCode",
      "location[zipcode]",
      "location.zipcode",
    ),
    latitude: read("location[latitude]", "location.latitude"),
    longitude: read("location[longitude]", "location.longitude"),
    placeId: read("location[placeId]", "location.placeId"),
    provider: read("location[provider]", "location.provider"),
    accuracy: read("location[accuracy]", "location.accuracy"),
    resolutionStatus: read(
      "location[resolutionStatus]",
      "location.resolutionStatus",
    ),
    isManual: read("location[isManual]", "location.isManual") === "true",
  };
};

export const validateLocationCoordinates = (value = {}) => {
  const errors = [];
  const latitudeProvided = !["", null, undefined].includes(value.latitude);
  const longitudeProvided = !["", null, undefined].includes(value.longitude);

  if (latitudeProvided !== longitudeProvided) {
    errors.push("Latitude and longitude must be provided together.");
    return errors;
  }

  if (!latitudeProvided) return errors;

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push("Latitude must be a number between -90 and 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push("Longitude must be a number between -180 and 180.");
  }

  return errors;
};

export const parseLocationFormData = (formData) => {
  const rawLocation = rawLocationFromFormData(formData);
  return {
    location: normalizeLocation(rawLocation),
    errors: validateLocationCoordinates(rawLocation),
  };
};

export const locationFromFormData = (formData) =>
  parseLocationFormData(formData).location;

export const serializeLocationForDatabase = (location) => {
  const normalized = normalizeLocation(location);

  return {
    ...normalized,
    coordinates: hasCoordinates(normalized)
      ? {
          type: "Point",
          coordinates: [normalized.longitude, normalized.latitude],
        }
      : undefined,
    geocodedAt: hasCoordinates(normalized) ? new Date() : undefined,
  };
};

export const hasUsableLocation = (location) => {
  if (typeof location === "string" && location.trim().length > 0) return true;
  if (!location) return false;
  const normalized = typeof location === "object" ? location : normalizeLocation(location);
  return (
    hasCoordinates(normalized) ||
    Boolean(buildGeocodingQuery(normalized)) ||
    Boolean(normalized.formattedAddress || normalized.city || normalized.state || normalized.street)
  );
};

