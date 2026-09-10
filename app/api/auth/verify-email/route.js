import connectDB from "@/config/database";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";
import SecurityEvent from "@/models/SecurityEvent";
import { tokenHash } from "@/utils/accountSecurity";

export async function GET(request) {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
  const target = new URL("/auth/signin", base);
  try {
    const token = new URL(request.url).searchParams.get("token");
    await connectDB();
    const record = await AuthToken.findOneAndUpdate({ tokenHash: tokenHash(token), type: "EMAIL_VERIFY", usedAt: { $exists: false }, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() } }, { new: true });
    if (!record) { target.searchParams.set("error", "VerificationLinkInvalid"); return Response.redirect(target); }
    await User.updateOne({ _id: record.userId }, { $set: { "verification.emailVerified": true } });
    await SecurityEvent.create({ userId: record.userId, type: "EMAIL_VERIFIED" });
    target.searchParams.set("verified", "true");
    return Response.redirect(target);
  } catch { target.searchParams.set("error", "VerificationFailed"); return Response.redirect(target); }
}
