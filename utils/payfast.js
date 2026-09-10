import crypto from "crypto";

export const PAYFAST_CURRENCY = "ZAR";
export const PAYMENT_TYPES = Object.freeze(["nightly", "weekly", "monthly"]);

const PAYFAST_HOSTS = new Set([
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
]);

function encodePayfastValue(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/[!'()~]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/%20/g, "+");
}

export function createPayfastSignature(data, passphrase = "") {
  const parameterString = Object.entries(data)
    .filter(
      ([key, value]) =>
        key !== "signature" &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    )
    .map(([key, value]) => `${key}=${encodePayfastValue(value)}`)
    .join("&");

  const valueToHash = passphrase
    ? `${parameterString}&passphrase=${encodePayfastValue(passphrase)}`
    : parameterString;

  return crypto.createHash("md5").update(valueToHash).digest("hex");
}

export function signaturesMatch(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") {
    return false;
  }

  const receivedBuffer = Buffer.from(received.toLowerCase());
  const expectedBuffer = Buffer.from(expected.toLowerCase());

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function getPayfastConfig() {
  const config = {
    merchantId: process.env.PAYFAST_MERCHANT_ID?.trim(),
    merchantKey: process.env.PAYFAST_MERCHANT_KEY?.trim(),
    passphrase: process.env.PAYFAST_PASSPHRASE?.trim(),
    returnUrl: process.env.PAYFAST_RETURN_URL?.trim(),
    cancelUrl: process.env.PAYFAST_CANCEL_URL?.trim(),
    notifyUrl: process.env.PAYFAST_NOTIFY_URL?.trim(),
    gatewayUrl: process.env.PAYFAST_URL?.trim(),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing PayFast configuration: ${missing.join(", ")}`);
  }

  const gateway = new URL(config.gatewayUrl);
  if (gateway.protocol !== "https:" || !PAYFAST_HOSTS.has(gateway.hostname)) {
    throw new Error("PAYFAST_URL must use an approved PayFast HTTPS host");
  }

  for (const callbackUrl of [config.returnUrl, config.cancelUrl, config.notifyUrl]) {
    const parsed = new URL(callbackUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("PayFast callback URLs must use HTTP or HTTPS");
    }
    if (
      process.env.NODE_ENV === "production" &&
      parsed.protocol !== "https:"
    ) {
      throw new Error("PayFast callback URLs must use HTTPS in production");
    }
  }

  return config;
}

export function getTrustedPropertyRate(property, paymentType) {
  if (!PAYMENT_TYPES.includes(paymentType)) {
    return null;
  }

  const value = Number(property?.rates?.[paymentType]);
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) {
    return null;
  }

  return Number(value.toFixed(2));
}

export function validateCustomer(input = {}) {
  const userName = typeof input.userName === "string" ? input.userName.trim() : "";
  const userEmail =
    typeof input.userEmail === "string" ? input.userEmail.trim().toLowerCase() : "";
  const userPhone = typeof input.userPhone === "string" ? input.userPhone.trim() : "";

  if (userName.length < 2 || userName.length > 100) {
    return { error: "Enter a valid full name" };
  }

  if (
    userEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
  ) {
    return { error: "Enter a valid email address" };
  }

  if (userPhone.length > 30 || (userPhone && !/^[+\d\s().-]+$/.test(userPhone))) {
    return { error: "Enter a valid phone number" };
  }

  return { value: { userName, userEmail, userPhone } };
}

export function amountsMatch(received, expected) {
  const receivedAmount = Number(received);
  const expectedAmount = Number(expected);
  return (
    Number.isFinite(receivedAmount) &&
    Number.isFinite(expectedAmount) &&
    Math.abs(receivedAmount - expectedAmount) < 0.01
  );
}

export async function validateWithPayfast(data, gatewayUrl) {
  const validationUrl = new URL("/eng/query/validate", gatewayUrl);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) body.append(key, String(value));
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(validationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: controller.signal,
      });
      const result = (await response.text()).trim();
      if (response.ok && result === "VALID") return true;
      if (response.status < 500) return false;
    } catch (error) {
      if (attempt === 1) return false;
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return false;
}

export function createWebhookEventId(data) {
  const source = `${data.m_payment_id || "unknown"}:${data.pf_payment_id || "unknown"}:${data.payment_status || "unknown"}`;
  return crypto.createHash("sha256").update(source).digest("hex");
}

export function createPayloadHash(data) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}
