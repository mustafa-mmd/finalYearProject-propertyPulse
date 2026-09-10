import crypto from "node:crypto";
import connectDB from "@/config/database";
import MobileDeviceCode from "@/models/MobileDeviceCode";
import MobileSession from "@/models/MobileSession";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { requireActor } from "@/utils/authorization";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";
import { hashMobileSecret } from "@/utils/mobileAuth";

function userCode() { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 8 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("").replace(/(.{4})/, "$1-"); }

export async function POST(request) {
  try {
    const rate = await checkRateLimit(`mobile-device:${getClientIp(request)}`, { limit: 15, windowMs: 60_000 });
    if (!rate.allowed) return apiError("Too many device authorization requests", { status: 429, code: "RATE_LIMITED" });
    const body = await request.json();
    await connectDB();
    if (body.action === "exchange") {
      const codeHash = hashMobileSecret(String(body.deviceCode || ""));
      const current = await MobileDeviceCode.findOne({ deviceCodeHash: codeHash }).lean();
      if (!current || current.expiresAt <= new Date()) return apiError("Device code expired", { status: 400, code: "EXPIRED_TOKEN" });
      if (current.status === "PENDING") return apiError("Authorization pending", { status: 428, code: "AUTHORIZATION_PENDING" });
      const record = await MobileDeviceCode.findOneAndUpdate(
        { deviceCodeHash: codeHash, status: "APPROVED", userId: { $exists: true }, expiresAt: { $gt: new Date() } },
        { $set: { status: "CONSUMED", consumedAt: new Date() } },
        { new: true }
      );
      if (!record) return apiError("Device authorization denied or already consumed", { status: 403, code: "ACCESS_DENIED" });
      const token = `ppm_${crypto.randomBytes(40).toString("base64url")}`;
      const session = await MobileSession.create({ userId: record.userId, tokenHash: hashMobileSecret(token), deviceName: record.deviceName, platform: record.platform, expiresAt: new Date(Date.now() + 90 * 86_400_000) });
      return apiSuccess({ accessToken: token, tokenType: "Bearer", expiresIn: 90 * 86_400, sessionId: session._id.toString() });
    }
    const deviceCode = crypto.randomBytes(32).toString("base64url");
    let code;
    do { code = userCode(); } while (await MobileDeviceCode.exists({ userCode: code }));
    const record = await MobileDeviceCode.create({ deviceCodeHash: hashMobileSecret(deviceCode), userCode: code, deviceName: String(body.deviceName || "Mobile device").slice(0, 120), platform: String(body.platform || "unknown").slice(0, 40), expiresAt: new Date(Date.now() + 10 * 60_000) });
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
    return apiSuccess({ deviceCode, userCode: record.userCode, verificationUri: `${domain}/mobile/authorize`, verificationUriComplete: `${domain}/mobile/authorize?code=${encodeURIComponent(record.userCode)}`, expiresIn: 600, interval: 5 }, { status: 201 });
  } catch (error) { return handleApiError(error, "mobile.device"); }
}

export async function PATCH(request) {
  try {
    const actor = await requireActor(); const body = await request.json(); const code = String(body.userCode || "").trim().toUpperCase();
    await connectDB();
    const record = await MobileDeviceCode.findOne({ userCode: code, status: "PENDING", expiresAt: { $gt: new Date() } });
    if (!record) return apiError("Authorization code is invalid or expired", { status: 404, code: "NOT_FOUND" });
    record.status = body.approve === false ? "DENIED" : "APPROVED"; record.userId = body.approve === false ? undefined : actor.id; record.approvedAt = new Date(); await record.save();
    return apiSuccess({ status: record.status, deviceName: record.deviceName });
  } catch (error) { return handleApiError(error, "mobile.device.approve"); }
}
