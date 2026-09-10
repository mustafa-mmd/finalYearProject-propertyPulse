import mongoose from "mongoose";
import connectDB from "../config/database.js";
import Property from "../models/Property.js";
import {
  ensureResolvedLocation,
  geocodingProviderStatus,
} from "../utils/geocoding.js";
import {
  buildGeocodingQuery,
  hasCoordinates,
  hasUsableLocation,
  normalizeLocation,
} from "../utils/location.js";

const writeChanges = process.argv.includes("--write");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const parsedLimit = Number.parseInt(limitArgument?.split("=")[1] || "0", 10);
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

await connectDB();

const providers = geocodingProviderStatus();
console.log("Location providers:", providers);
console.log(
  writeChanges
    ? "WRITE mode: resolved coordinates will be saved."
    : "DRY RUN: no records will be changed. Add --write to migrate.",
);

const query = {
  $and: [
    {
      $or: [
        { "location.latitude": { $exists: false } },
        { "location.latitude": null },
        { "location.longitude": { $exists: false } },
        { "location.longitude": null },
      ],
    },
    {
      $or: [
        { "location.formattedAddress": { $nin: [null, ""] } },
        { "location.street": { $nin: [null, ""] } },
        { "location.city": { $nin: [null, ""] } },
        { "location.state": { $nin: [null, ""] } },
      ],
    },
  ],
};

let cursorQuery = Property.find(query).sort({ _id: 1 });
if (limit) cursorQuery = cursorQuery.limit(limit);

let inspected = 0;
let migrated = 0;
let unresolved = 0;

for await (const property of cursorQuery.cursor()) {
  inspected += 1;
  const currentLocation = normalizeLocation(property.location?.toObject?.() || property.location);
  const label = buildGeocodingQuery(currentLocation);

  if (!hasUsableLocation(currentLocation)) {
    unresolved += 1;
    console.log(`[skip] ${property._id}: insufficient location data`);
    continue;
  }

  if (!writeChanges) {
    console.log(`[would migrate] ${property._id}: ${label}`);
    continue;
  }

  const resolved = await ensureResolvedLocation(currentLocation);
  if (!hasCoordinates(resolved)) {
    unresolved += 1;
    console.log(`[unresolved] ${property._id}: ${label}`);
    continue;
  }

  property.location = resolved;
  await property.save();
  migrated += 1;
  console.log(
    `[migrated] ${property._id}: ${resolved.formattedAddress} (${resolved.latitude}, ${resolved.longitude})`,
  );

  // Keep batch migration comfortably below the Geoapify free-tier rate limit.
  await wait(250);
}

console.log({ inspected, migrated, unresolved, writeChanges });
await mongoose.disconnect();
