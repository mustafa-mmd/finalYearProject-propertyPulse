import connectDB from "@/config/database";
import ApiRateLimit from "@/models/ApiRateLimit";

const fallbackStore = globalThis.__propertyRateLimitStore || new Map();
globalThis.__propertyRateLimitStore = fallbackStore;

export function getClientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function normalizeArgs(keyOrOptions, options) {
  if (keyOrOptions && typeof keyOrOptions === "object") return { key: String(keyOrOptions.key), limit: keyOrOptions.limit ?? 10, windowMs: keyOrOptions.windowMs ?? 300_000 };
  return { key: String(keyOrOptions), limit: options?.limit ?? 10, windowMs: options?.windowMs ?? 300_000 };
}

function fallback(key, limit, windowMs) {
  const now = Date.now(); const current = fallbackStore.get(key);
  if (!current || current.resetAt <= now) { fallbackStore.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, remaining: limit - 1, retryAfter: 0, retryAfterSeconds: 0 }; }
  current.count += 1; const retry = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), retryAfter: retry, retryAfterSeconds: retry };
}

export async function checkRateLimit(keyOrOptions, options) {
  const { key, limit, windowMs } = normalizeArgs(keyOrOptions, options);
  const now = new Date(); const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs); const expiresAt = new Date(windowStart.getTime() + windowMs);
  try {
    await connectDB();
    const record = await ApiRateLimit.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    const retry = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
    return { allowed: record.count <= limit, remaining: Math.max(0, limit - record.count), retryAfter: retry, retryAfterSeconds: retry };
  } catch (error) {
    console.warn("[rate-limit] Distributed limiter unavailable; using process-local fallback", { code: error?.code });
    return fallback(key, limit, windowMs);
  }
}
