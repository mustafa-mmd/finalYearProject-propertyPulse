import crypto from "node:crypto";

const SCRYPT_OPTIONS = Object.freeze({ N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function validatePassword(password) {
  const value = String(password || "");
  const errors = [];
  if (value.length < 12) errors.push("Use at least 12 characters");
  if (value.length > 128) errors.push("Use no more than 128 characters");
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) errors.push("Include uppercase and lowercase letters");
  if (!/\d/.test(value)) errors.push("Include at least one number");
  return { valid: errors.length === 0, errors };
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password), salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, salt, expected] = String(encoded || "").split("$");
    if (algorithm !== "scrypt") return false;
    const expectedBuffer = Buffer.from(expected, "base64url");
    const actual = crypto.scryptSync(String(password), Buffer.from(salt, "base64url"), expectedBuffer.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
    return expectedBuffer.length === actual.length && crypto.timingSafeEqual(expectedBuffer, actual);
  } catch {
    return false;
  }
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
export const tokenHash = (token) => crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET || "development-only-secret").update(String(token)).digest("hex");
export const valueHash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

function encryptionKey() {
  const source = process.env.AUTH_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!source) throw new Error("AUTH_ENCRYPTION_KEY is not configured");
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(encoded) {
  const [iv, tag, encrypted] = String(encoded || "").split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function base32Encode(buffer) {
  let bits = 0; let value = 0; let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(value) {
  let bits = 0; let accumulator = 0; const bytes = [];
  for (const character of String(value || "").toUpperCase().replace(/=|\s|-/g, "")) {
    const index = BASE32.indexOf(character); if (index < 0) continue;
    accumulator = (accumulator << 5) | index; bits += 5;
    if (bits >= 8) { bytes.push((accumulator >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret() { return base32Encode(crypto.randomBytes(20)); }

function totpAt(secret, counter) {
  const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255)) % 1_000_000).padStart(6, "0");
}

export function generateTotpCode(secret, now = Date.now()) { return totpAt(secret, Math.floor(now / 30_000)); }

export function verifyTotp(secret, code, now = Date.now()) {
  const supplied = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(supplied)) return false;
  const counter = Math.floor(now / 30_000);
  // Allow ±4 steps (±120s) to tolerate clock skew between authenticator app/extension and server (RFC 6238 recommendation)
  return [-4, -3, -2, -1, 0, 1, 2, 3, 4].some((offset) => {
    const expected = Buffer.from(totpAt(secret, counter + offset));
    const actual = Buffer.from(supplied);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  });
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => `${crypto.randomBytes(3).toString("hex")}-${crypto.randomBytes(3).toString("hex")}`);
}
