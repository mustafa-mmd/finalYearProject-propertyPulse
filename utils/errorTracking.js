import crypto from "node:crypto";
import connectDB from "@/config/database";
import OperationalError from "@/models/OperationalError";

function safeText(value, length) {
  return String(value || "").replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[database-url]").slice(0, length);
}

export async function reportOperationalError(error, options = {}) {
  try {
    const context = safeText(options.context || "unknown", 200);
    const errorName = safeText(error?.name || options.errorName || "Error", 120);
    const errorCode = safeText(error?.code || options.errorCode || "", 120);
    const message = safeText(error?.message || options.message || "Unexpected error", 1000);
    const fingerprint = crypto
      .createHash("sha256")
      .update([options.source || "API", context, errorName, errorCode, message].join("|"))
      .digest("hex");

    await connectDB();
    return await OperationalError.findOneAndUpdate(
      { fingerprint },
      {
        $set: {
          source: options.source || "API",
          severity: options.severity || "ERROR",
          context,
          errorName,
          errorCode,
          message,
          stack: safeText(error?.stack, 8000),
          path: safeText(options.path, 1000),
          requestId: safeText(options.requestId, 120),
          metadata: options.metadata,
          lastOccurredAt: new Date(),
        },
        $setOnInsert: { firstOccurredAt: new Date(), status: "OPEN" },
        $inc: { occurrenceCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: false }
    );
  } catch (trackingError) {
    console.error("[error-tracking] Failed to persist operational error", {
      name: trackingError?.name,
      code: trackingError?.code,
    });
    return null;
  }
}
