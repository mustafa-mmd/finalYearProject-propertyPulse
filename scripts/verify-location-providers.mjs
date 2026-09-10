import {
  autocompleteLocations,
  geocodingProviderStatus,
} from "../utils/geocoding.js";

const queries = [
  ["Pakistan", "F-8 Markaz, Islamabad, Pakistan"],
  ["Saudi Arabia", "Al Masjid Al Haram, Makkah, Saudi Arabia"],
  ["United States", "350 5th Avenue, New York, NY 10118, USA"],
  ["United Kingdom", "10 Downing Street, London SW1A 2AA, UK"],
  ["United Arab Emirates", "Burj Khalifa, Downtown Dubai, UAE"],
  ["Europe", "Eiffel Tower, Paris, France"],
  ["Remote area", "Shigar Valley, Gilgit-Baltistan, Pakistan"],
];

const providers = geocodingProviderStatus();
console.log("Configured providers:", providers);

if (providers.primary === "not_configured") {
  throw new Error(
    "Configure NEXT_PUBLIC_GEOAPIFY_API_KEY or GEOAPIFY_API_KEY before live verification.",
  );
}

let failures = 0;

for (const [region, query] of queries) {
  const suggestions = await autocompleteLocations({ query, language: "en" });
  const first = suggestions[0];

  if (!first?.location?.latitude || !first?.location?.longitude) {
    failures += 1;
    console.error(`[FAIL] ${region}: no coordinate-bearing suggestion`);
    continue;
  }

  console.log(
    `[PASS] ${region}: ${first.label} (${first.location.latitude}, ${first.location.longitude}) via ${first.provider}`,
  );
}

if (failures > 0) {
  throw new Error(`${failures} live provider coverage checks failed.`);
}
