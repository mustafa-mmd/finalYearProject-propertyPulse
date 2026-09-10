import connectDB from "@/config/database";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";
import UserSession from "@/models/UserSession";
import SecurityEvent from "@/models/SecurityEvent";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { hashPassword, tokenHash, validatePassword } from "@/utils/accountSecurity";

export async function POST(request) {
  try {
    const body = await request.json(); const check = validatePassword(body.password);
    if (!check.valid) return apiError("Password does not meet the security requirements", { status: 422, code: "WEAK_PASSWORD", details: check.errors });
    await connectDB();
    const record = await AuthToken.findOneAndUpdate({ tokenHash: tokenHash(body.token), type: "PASSWORD_RESET", usedAt: { $exists: false }, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() }, $inc: { attempts: 1 } }, { new: true });
    if (!record) return apiError("This reset link is invalid or expired", { status: 410, code: "TOKEN_EXPIRED" });
    await User.updateOne({ _id: record.userId }, { $set: { passwordHash: hashPassword(body.password), passwordChangedAt: new Date(), "security.failedLoginCount": 0 }, $unset: { "security.lockedUntil": 1 } });
    await UserSession.updateMany({ userId: record.userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date(), revokeReason: "PASSWORD_RESET" } });
    await SecurityEvent.create({ userId: record.userId, type: "PASSWORD_RESET", severity: "WARNING" });
    return apiSuccess({ reset: true });
  } catch (error) { return handleApiError(error, "auth.password.reset"); }
}
