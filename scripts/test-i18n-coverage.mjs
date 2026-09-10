import { readFile } from "node:fs/promises";
const locales = ["en", "ur", "ar", "fr", "de", "es"];
function paths(value, prefix = "") { return Object.entries(value).flatMap(([key, child]) => typeof child === "object" ? paths(child, `${prefix}${key}.`) : [`${prefix}${key}`]).sort(); }
const dictionaries = await Promise.all(locales.map(async (locale) => JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"))));
const expected = paths(dictionaries[0]); for (let index = 1; index < dictionaries.length; index += 1) { const actual = paths(dictionaries[index]); if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${locales[index]} message keys do not match English`); }
console.log(`Validated ${expected.length} translation keys across ${locales.length} locales, including Urdu and Arabic RTL coverage.`);
