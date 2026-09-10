import connectDB from "@/config/database";
import User from "@/models/User";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";
import { valueHash } from "@/utils/accountSecurity";
import { issueAuthToken } from "@/utils/authTokens";

export async function POST(request) {
  try {
    const ip = getClientIp(request); const body = await request.json(); const email = String(body.email || "").trim().toLowerCase();
    const limit = await checkRateLimit(`auth:magic:${valueHash(`${ip}:${email}`)}`, { limit: 5, windowMs: 60 * 60_000 }); let delivery;
    if (limit.allowed) { await connectDB(); const user = await User.findOne({ email, accountStatus: "ACTIVE", deletedAt: { $exists: false } }).lean(); if (user) delivery = await issueAuthToken({ userId: user._id, email, type: "MAGIC_LINK", ipHash: valueHash(ip) }); }
    return apiSuccess({ accepted: true, ...(process.env.NODE_ENV !== "production" && delivery?.previewUrl ? { previewUrl: delivery.previewUrl } : {}) });
  } catch (error) { return handleApiError(error, "auth.magic-link"); }
}
