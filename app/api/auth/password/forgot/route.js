import connectDB from "@/config/database";
import User from "@/models/User";
import { apiSuccess, handleApiError } from "@/utils/apiResponse";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";
import { valueHash } from "@/utils/accountSecurity";
import { issueAuthToken } from "@/utils/authTokens";

export async function POST(request) {
  try {
    const ip = getClientIp(request); const body = await request.json(); const email = String(body.email || "").trim().toLowerCase();
    const limit = await checkRateLimit(`auth:recovery:${valueHash(`${ip}:${email}`)}`, { limit: 5, windowMs: 60 * 60_000 });
    if (limit.allowed) { await connectDB(); const user = await User.findOne({ email, accountStatus: "ACTIVE", deletedAt: { $exists: false } }).lean(); if (user) await issueAuthToken({ userId: user._id, email, type: "PASSWORD_RESET", ipHash: valueHash(ip) }); }
    return apiSuccess({ accepted: true });
  } catch (error) { return handleApiError(error, "auth.password.forgot"); }
}
