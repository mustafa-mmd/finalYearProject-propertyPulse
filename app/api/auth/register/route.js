import connectDB from "@/config/database";
import User from "@/models/User";
import SecurityEvent from "@/models/SecurityEvent";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";
import { hashPassword, validatePassword, valueHash } from "@/utils/accountSecurity";
import { issueAuthToken } from "@/utils/authTokens";

export async function POST(request) {
  try {
    const ip = getClientIp(request); const limit = await checkRateLimit(`auth:register:${valueHash(ip)}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!limit.allowed) return apiError("Too many registration attempts", { status: 429, code: "RATE_LIMITED" });
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase(); const name = String(body.name || "").trim().slice(0, 100); const passwordCheck = validatePassword(body.password);
    if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || !passwordCheck.valid) return apiError("Registration details are invalid", { status: 422, code: "VALIDATION_ERROR", details: passwordCheck.errors });
    await connectDB();
    let user = await User.findOne({ email }).select("+passwordHash");
    if (user?.verification?.emailVerified) return apiSuccess({ accepted: true });
    if (!user) user = await User.create({ email, name, passwordHash: hashPassword(body.password), passwordChangedAt: new Date(), roles: ["USER"] });
    else { user.name = name; user.passwordHash = hashPassword(body.password); user.passwordChangedAt = new Date(); await user.save(); }
    const delivery = await issueAuthToken({ userId: user._id, email, type: "EMAIL_VERIFY", ipHash: valueHash(ip) });
    await SecurityEvent.create({ userId: user._id, type: "REGISTRATION_CREATED", ipHash: valueHash(ip) });
    return apiSuccess({ accepted: true, ...(process.env.NODE_ENV !== "production" ? { previewUrl: delivery.previewUrl } : {}) }, { status: 202 });
  } catch (error) { return handleApiError(error, "auth.register"); }
}
