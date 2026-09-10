const groups = {
  required: ["MONGO_URI", "NEXTAUTH_SECRET", "AUTH_ENCRYPTION_KEY", "NEXTAUTH_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "CLOUDINERY_CLOUD_NAME", "CLOUDINERY_API_KEY", "CLOUDINERY_API_SECRET", "AUDIT_IP_HASH_SALT"],
  location: ["GEOAPIFY_API_KEY", "NEXT_PUBLIC_GEOAPIFY_API_KEY"],
  payments: ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE", "PAYFAST_NOTIFY_URL"],
  operations: ["CRON_SECRET", "PLATFORM_OWNER_EMAILS"],
  optionalAi: ["GEMINI_API_KEY"],
  optionalPush: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
  optionalDelivery: ["NOTIFICATION_DELIVERY_URL", "NOTIFICATION_DELIVERY_TOKEN"],
  optionalAuthEmail: ["AUTH_EMAIL_DELIVERY_URL", "AUTH_EMAIL_DELIVERY_TOKEN"],
};
let missingRequired = false;
for (const [group, keys] of Object.entries(groups)) { const missing = keys.filter((key) => !process.env[key]); if (group === "required" && missing.length) missingRequired = true; console.log(`${group}: ${missing.length ? `missing ${missing.join(", ")}` : "configured"}`); }
if (missingRequired) process.exitCode = 1;
