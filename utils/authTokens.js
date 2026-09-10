import connectDB from "@/config/database";
import AuthToken from "@/models/AuthToken";
import { randomToken, tokenHash } from "@/utils/accountSecurity";
import { deliverAuthEmail } from "@/utils/authEmail";

const lifetimes = { EMAIL_VERIFY: 24 * 60 * 60_000, PASSWORD_RESET: 30 * 60_000, MAGIC_LINK: 15 * 60_000 };

export async function issueAuthToken({ userId, email, type, ipHash }) {
  await connectDB();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + lifetimes[type]);
  await AuthToken.updateMany({ userId, type, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } });
  await AuthToken.create({ userId, email, type, tokenHash: tokenHash(token), expiresAt, requestedIpHash: ipHash });
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
  const paths = { EMAIL_VERIFY: "/api/auth/verify-email", PASSWORD_RESET: "/auth/reset-password", MAGIC_LINK: "/auth/magic" };
  const url = new URL(paths[type], base); url.searchParams.set("token", token);
  const delivery = await deliverAuthEmail({ email, type, url: url.toString(), expiresAt });
  return { expiresAt, ...(delivery.previewUrl ? { previewUrl: delivery.previewUrl } : {}) };
}
