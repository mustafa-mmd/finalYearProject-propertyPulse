import dns from "node:dns";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable in .env.local");
}

const configuredDnsServers = (process.env.MONGODB_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

const needsWindowsDevelopmentDnsFallback =
  process.env.NODE_ENV === "development" &&
  process.platform === "win32" &&
  MONGO_URI.startsWith("mongodb+srv://");

if (configuredDnsServers.length > 0) {
  dns.setServers(configuredDnsServers);
} else if (needsWindowsDevelopmentDnsFallback) {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

const MAX_CONNECT_ATTEMPTS = 3;
const RETRYABLE_CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEOUT",
  "EAI_AGAIN",
]);

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      return await mongoose.connect(MONGO_URI);
    } catch (error) {
      const errorCode = error.code || error.cause?.code;
      const isRetryable =
        RETRYABLE_CONNECTION_CODES.has(errorCode) ||
        error.message?.includes("querySrv");

      if (!isRetryable || attempt === MAX_CONNECT_ATTEMPTS) throw error;
      await wait(attempt * 400);
    }
  }

  throw new Error("MongoDB connection attempts were exhausted");
}

const cached = globalThis.__propertyPulseMongoose || {
  conn: null,
  promise: null,
};
globalThis.__propertyPulseMongoose = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = connectWithRetry().catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}
