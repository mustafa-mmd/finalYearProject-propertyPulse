import crypto from "node:crypto";
import MobileSession from "@/models/MobileSession";
import User from "@/models/User";
export const hashMobileSecret = (value) => crypto.createHash("sha256").update(value).digest("hex");
export async function authenticateMobileRequest(request) { const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); if (!token?.startsWith("ppm_")) return null; const session = await MobileSession.findOne({ tokenHash: hashMobileSecret(token), status: "ACTIVE", expiresAt: { $gt: new Date() } }); if (!session) return null; const user = await User.findOne({ _id: session.userId, accountStatus: "ACTIVE" }).select("name email image roles preferences").lean(); if (!user) return null; session.lastUsedAt = new Date(); await session.save(); return { session, user }; }
