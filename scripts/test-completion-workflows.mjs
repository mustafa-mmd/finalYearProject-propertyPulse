import assert from "node:assert/strict"; import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const checks = [
  ["utils/authOptions.js", ["CredentialsProvider", "UserSession", "mfaVerified"]],
  ["app/api/auth/register/route.js", ["hashPassword", "EMAIL_VERIFY", "checkRateLimit"]],
  ["app/api/auth/mfa/route.js", ["encryptSecret", "recoveryCodes", "mfaRequired"]],
  ["app/api/saved-searches/route.js", ["normalizeSearchFilters", "signature", "alerts"]],
  ["utils/propertySearch.js", ["$centerSphere", "$box", "Polygon"]],
  ["app/api/listings/bulk-import/route.js", ["dryRun", "CSV_INVALID", "DRAFT"]],
  ["app/api/conversations/stream/route.js", ["text/event-stream", "ReadableStream", "heartbeat"]],
  ["app/api/refunds/route.js", ["PROVIDER_REFERENCE_REQUIRED", "writeAuditLog", "emitNotification"]],
  ["app/api/account/export/route.js", ["Content-Disposition", "account.data_export", "ConversationMessage"]],
];
for (const [path, terms] of checks) { const source = await read(path); for (const term of terms) assert.ok(source.includes(term), `${path} must include ${term}`); }
console.log(`Validated ${checks.length} completion workflows.`);
