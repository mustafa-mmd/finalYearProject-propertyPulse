import assert from "node:assert/strict";
import {
  buildLocationLabel,
  hasCoordinates,
  normalizeLocation,
  serializeLocationForDatabase,
  validateLocationCoordinates,
} from "../utils/location.js";

const globalCases = [
  {
    name: "Pakistan",
    location: {
      formattedAddress: "F-8 Markaz, Islamabad, Pakistan",
      country: "Pakistan",
      state: "Islamabad Capital Territory",
      city: "Islamabad",
      area: "F-8 Markaz",
      latitude: 33.7104,
      longitude: 73.0394,
    },
  },
  {
    name: "Saudi Arabia",
    location: {
      formattedAddress: "Al Masjid Al Haram, Makkah, Saudi Arabia",
      country: "Saudi Arabia",
      state: "Makkah Province",
      city: "Makkah",
      latitude: 21.4225,
      longitude: 39.8262,
    },
  },
  {
    name: "United States",
    location: {
      formattedAddress: "350 5th Ave, New York, NY 10118, United States",
      country: "United States",
      state: "New York",
      city: "New York",
      postalCode: "10118",
      latitude: 40.7484,
      longitude: -73.9857,
    },
  },
  {
    name: "United Kingdom",
    location: {
      formattedAddress: "10 Downing Street, London SW1A 2AA, United Kingdom",
      country: "United Kingdom",
      city: "London",
      postalCode: "SW1A 2AA",
      latitude: 51.5034,
      longitude: -0.1276,
    },
  },
  {
    name: "United Arab Emirates",
    location: {
      formattedAddress: "Burj Khalifa, Downtown Dubai, Dubai, UAE",
      country: "United Arab Emirates",
      state: "Dubai",
      city: "Dubai",
      area: "Downtown Dubai",
      latitude: 25.1972,
      longitude: 55.2744,
    },
  },
  {
    name: "Europe",
    location: {
      formattedAddress: "Eiffel Tower, 5 Avenue Anatole France, Paris, France",
      country: "France",
      state: "Île-de-France",
      city: "Paris",
      latitude: 48.8584,
      longitude: 2.2945,
    },
  },
  {
    name: "Remote coordinates",
    location: {
      formattedAddress: "Remote property near Skardu, Gilgit-Baltistan, Pakistan",
      country: "Pakistan",
      state: "Gilgit-Baltistan",
      city: "Skardu",
      latitude: 35.2971,
      longitude: 75.6333,
      isManual: true,
    },
  },
];

for (const testCase of globalCases) {
  const normalized = normalizeLocation(testCase.location);
  assert.equal(hasCoordinates(normalized), true, `${testCase.name}: coordinates`);
  assert.ok(
    normalized.formattedAddress,
    `${testCase.name}: formatted address is required`,
  );

  const stored = serializeLocationForDatabase(normalized);
  assert.deepEqual(
    stored.coordinates.coordinates,
    [normalized.longitude, normalized.latitude],
    `${testCase.name}: GeoJSON must use longitude, latitude order`,
  );
}

const legacy = normalizeLocation({
  street: "456 Oakridge Avenue",
  city: "New York",
  state: "NY",
  zipcode: "10010",
});
assert.equal(legacy.postalCode, "10010");
assert.equal(
  buildLocationLabel(legacy),
  "456 Oakridge Avenue, New York, NY, 10010",
);

const zeroCoordinates = normalizeLocation({
  latitude: 0,
  longitude: 0,
});
assert.equal(hasCoordinates(zeroCoordinates), true);

assert.deepEqual(validateLocationCoordinates({ latitude: 90, longitude: 180 }), []);
assert.deepEqual(validateLocationCoordinates({ latitude: -90, longitude: -180 }), []);
assert.equal(
  validateLocationCoordinates({ latitude: 91, longitude: 0 }).length,
  1,
);
assert.equal(
  validateLocationCoordinates({ latitude: 0, longitude: -181 }).length,
  1,
);
assert.equal(
  validateLocationCoordinates({ latitude: "not-a-number", longitude: 0 }).length,
  1,
);
assert.equal(
  validateLocationCoordinates({ latitude: 10, longitude: "" }).length,
  1,
);

console.log(`Validated ${globalCases.length} global structured-location cases.`);
console.log("Validated legacy text compatibility and zero coordinates.");
console.log("Validated coordinate boundaries, invalid numbers, and partial pairs.");
