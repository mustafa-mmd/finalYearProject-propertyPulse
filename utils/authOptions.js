import crypto from "node:crypto";
import * as GoogleProviderModule from "next-auth/providers/google";
import * as CredentialsProviderModule from "next-auth/providers/credentials";
import connectDB from "@/config/database";
import User from "@/models/User";
import AuthToken from "@/models/AuthToken";
import UserSession from "@/models/UserSession";
import SecurityEvent from "@/models/SecurityEvent";
import { configuredPlatformOwnerEmails, permissionsForRoles } from "@/config/authorization";
import { decryptSecret, tokenHash, valueHash, verifyPassword, verifyTotp } from "@/utils/accountSecurity";
import { emitNotification } from "@/utils/events";
import { getHighResProfileImage } from "@/utils/avatar";

function resolveCallable(moduleValue, label) {
  let candidate = moduleValue;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof candidate === "function") return candidate;
    candidate = candidate?.default ?? candidate?.["module.exports"];
  }
  throw new TypeError(`${label} could not be resolved as a function`);
}

const GoogleProvider = resolveCallable(GoogleProviderModule, "GoogleProvider");
const CredentialsProvider = resolveCallable(CredentialsProviderModule, "CredentialsProvider");
const sessionLifetime = 8 * 60 * 60;

async function verifyUserMfa(user, code, recoveryCode) {
  if (!user.security?.mfaEnabled && !user.security?.mfaRequired) return true;
  if (user.security?.totpSecretCipher && verifyTotp(decryptSecret(user.security.totpSecretCipher), code)) return true;
  const recoveryHash = recoveryCode ? valueHash(String(recoveryCode).toLowerCase().trim()) : "";
  const index = user.security?.recoveryCodeHashes?.indexOf(recoveryHash) ?? -1;
  if (index >= 0) {
    user.security.recoveryCodeHashes.splice(index, 1);
    await user.save();
    return true;
  }
  return false;
}

async function authorizeCredentials(credentials, request) {
  await connectDB();
  const now = new Date();
  let user;
  let provider = "credentials";
  if (credentials?.magicToken) {
    const record = await AuthToken.findOneAndUpdate(
      { tokenHash: tokenHash(credentials.magicToken), type: "MAGIC_LINK", usedAt: { $exists: false }, expiresAt: { $gt: now } },
      { $set: { usedAt: now }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!record) return null;
    user = await User.findById(record.userId).select("+security.totpSecretCipher +security.recoveryCodeHashes");
    if (user && !user.verification.emailVerified) { user.verification.emailVerified = true; await user.save(); }
    provider = "magic-link";
  } else {
    const email = String(credentials?.email || "").trim().toLowerCase();
    user = await User.findOne({ email, deletedAt: { $exists: false } }).select("+passwordHash +security.totpSecretCipher +security.recoveryCodeHashes");
    if (!user?.passwordHash || user.security?.lockedUntil > now) return null;
    if (!verifyPassword(credentials?.password, user.passwordHash)) {
      user.security.failedLoginCount = (user.security.failedLoginCount || 0) + 1;
      if (user.security.failedLoginCount >= 8) user.security.lockedUntil = new Date(Date.now() + 15 * 60_000);
      await user.save();
      return null;
    }
  }
  if (!user || user.accountStatus !== "ACTIVE" || !user.verification?.emailVerified) return null;
  const mfaVerified = await verifyUserMfa(user, credentials?.totp, credentials?.recoveryCode);
  if (!mfaVerified) return null;
  user.security.failedLoginCount = 0;
  user.security.lockedUntil = undefined;
  user.security.lastLoginAt = now;
  await user.save();
  return { id: user._id.toString(), name: user.name, email: user.email, image: user.image, _provider: provider, _mfaVerified: mfaVerified, _ipHash: valueHash(request?.headers?.get?.("x-forwarded-for") || "unknown"), _userAgentHash: valueHash(request?.headers?.get?.("user-agent") || "unknown") };
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
    }),
    CredentialsProvider({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, totp: { label: "Authenticator code", type: "text" }, recoveryCode: { label: "Recovery code", type: "text" }, magicToken: { label: "Magic token", type: "text" } },
      authorize: authorizeCredentials,
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async signIn({ user: providerUser, account, profile }) {
      if (account?.provider === "credentials") return true;
      const emailValue = profile?.email || providerUser?.email;
      if (!emailValue || profile?.email_verified === false) return false;
      try {
        await connectDB();
        const email = emailValue.toLowerCase();
        const platformOwner = configuredPlatformOwnerEmails().has(email);
        const rawImage = profile?.picture || providerUser?.image || profile?.avatar_url || "";
        const image = getHighResProfileImage(rawImage) || rawImage;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile?.name || providerUser?.name || email.split("@")[0],
            email,
            image,
            roles: platformOwner ? ["USER", "PLATFORM_OWNER"] : ["USER"],
            verification: { emailVerified: true },
            security: { lastLoginAt: new Date(), mfaRequired: platformOwner },
          });
        } else {
          user.verification.emailVerified = true;
          user.security.lastLoginAt = new Date();
          if (image) user.image = image;
          if (platformOwner && !user.roles.includes("PLATFORM_OWNER")) {
            user.roles.push("PLATFORM_OWNER");
            user.security.mfaRequired = true;
          }
          await user.save();
        }
        return user.accountStatus === "ACTIVE";
      } catch (error) {
        console.error("[auth] Sign-in persistence failed", { name: error?.name, code: error?.code });
        return false;
      }
    },
    async jwt({ token, user: providerUser, account, trigger, session }) {
      try {
        await connectDB();
        if (providerUser) {
          const databaseUser = await User.findOne({ email: String(providerUser.email).toLowerCase() }).select("+security.totpSecretCipher");
          if (!databaseUser) return token;
          if (providerUser?.image && !databaseUser.image) {
            databaseUser.image = providerUser.image;
            await databaseUser.save();
          }
          token.uid = databaseUser._id.toString();
          token.name = databaseUser.name || providerUser.name || "";
          token.email = databaseUser.email || providerUser.email || "";
          token.picture = databaseUser.image || providerUser.image || "";
          token.sessionId = crypto.randomUUID();
          token.authTime = Date.now();
          token.mfaVerified = account?.provider === "credentials" ? providerUser._mfaVerified === true : !(databaseUser.security?.mfaEnabled || databaseUser.security?.mfaRequired);
          const expiresAt = new Date(Date.now() + sessionLifetime * 1000);
          await UserSession.create({ userId: databaseUser._id, sessionId: token.sessionId, provider: providerUser._provider || account?.provider || "unknown", ipHash: providerUser._ipHash, userAgentHash: providerUser._userAgentHash, mfaVerifiedAt: token.mfaVerified ? new Date() : undefined, authenticatedAt: new Date(), lastSeenAt: new Date(), expiresAt });
          await SecurityEvent.create({ userId: databaseUser._id, type: "LOGIN_SUCCEEDED", severity: "INFO", sessionId: token.sessionId, ipHash: providerUser._ipHash, userAgentHash: providerUser._userAgentHash });
          await emitNotification({ recipientId: databaseUser._id, type: "SECURITY_LOGIN", title: "New sign-in to your PropertyPulse account", body: `A new session was created using ${providerUser._provider || account?.provider || "an authentication provider"}.`, href: "/settings", dedupeKey: `login:${token.sessionId}`, channels: ["IN_APP", "EMAIL"] });
        }
        if (trigger === "update") {
          if (session?.user?.name) token.name = session.user.name;
          if (session?.user?.image !== undefined) token.picture = session.user.image;
          if (session?.mfaCode || session?.recoveryCode) {
            if (token.uid && token.sessionId) {
              const databaseUser = await User.findById(token.uid).select("+security.totpSecretCipher +security.recoveryCodeHashes");
              const verified = databaseUser
                ? await verifyUserMfa(databaseUser, session.mfaCode, session.recoveryCode)
                : false;
              if (verified) {
                token.mfaVerified = true;
                token.authTime = Date.now();
                await UserSession.updateOne({ sessionId: token.sessionId, userId: token.uid, revokedAt: { $exists: false } }, { $set: { mfaVerifiedAt: new Date(), lastSeenAt: new Date() } });
              }
            }
          }
        }
      } catch (error) { console.error("[auth] JWT persistence failed", { name: error?.name, code: error?.code }); }
      return token;
    },
    async session({ session, token }) {
      if (!token?.uid || !token?.sessionId) { if (session?.user) session.user.id = null; return session; }
      try {
        await connectDB();
        const [user, activeSession] = await Promise.all([
          User.findOne({ _id: token.uid, deletedAt: { $exists: false } }).select("_id name email image roles accountStatus verification security.mfaEnabled security.mfaRequired preferences").lean(),
          UserSession.findOne({ sessionId: token.sessionId, userId: token.uid, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).lean(),
        ]);
        if (!user || !activeSession || user.accountStatus !== "ACTIVE") { session.user.id = null; session.user.roles = []; session.user.permissions = []; return session; }
        const roles = user.roles?.length ? user.roles : ["USER"];
        // If user has no image stored in DB but token has one (from OAuth), save it to DB now
        const freshImage = token.picture || null;
        if (!user.image && freshImage) {
          await User.updateOne({ _id: user._id }, { $set: { image: freshImage } });
          user.image = freshImage;
        }
        session.user.id = user._id.toString();
        session.user.name = user.name || token.name || null;
        session.user.email = user.email || token.email || null;
        session.user.image = user.image || token.picture || null;
        session.user.roles = roles;
        session.user.permissions = permissionsForRoles(roles);
        session.user.verification = user.verification;
        session.user.preferences = user.preferences;
        session.user.mfaEnabled = Boolean(user.security?.mfaEnabled);
        session.user.mfaRequired = Boolean(user.security?.mfaRequired);
        session.user.mfaVerified = token.mfaVerified === true;
        session.user.authTime = token.authTime;
        session.user.sessionId = token.sessionId;
        if (Date.now() - new Date(activeSession.lastSeenAt).getTime() > 5 * 60_000) await UserSession.updateOne({ _id: activeSession._id }, { $set: { lastSeenAt: new Date() } });
        return session;
      } catch (error) { console.error("[auth] Session persistence check failed", { name: error?.name, code: error?.code }); session.user.id = null; session.user.roles = []; session.user.permissions = []; return session; }
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) await UserSession.updateOne({ sessionId: token.sessionId }, { $set: { revokedAt: new Date(), revokeReason: "USER_SIGN_OUT" } }).catch(() => undefined);
    },
  },
  session: { strategy: "jwt", maxAge: sessionLifetime, updateAge: 30 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};
