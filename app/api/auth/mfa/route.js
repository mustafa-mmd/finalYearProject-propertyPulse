import connectDB from "@/config/database";
import User from "@/models/User";
import SecurityEvent from "@/models/SecurityEvent";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { decryptSecret, encryptSecret, generateRecoveryCodes, generateTotpSecret, valueHash, verifyTotp } from "@/utils/accountSecurity";
import { writeAuditLog } from "@/utils/audit";

const recentlyAuthenticated = (actor) => Number(actor.authTime) > Date.now() - 15 * 60_000;

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const user = await User.findById(actor.id).select("+security.pendingTotpSecretCipher");
    if (!user || !user.security?.pendingTotpSecretCipher) {
      return apiSuccess({ hasPending: false });
    }

    try {
      const secret = decryptSecret(user.security.pendingTotpSecretCipher);
      const issuer = encodeURIComponent("PropertyPulse");
      const label = encodeURIComponent(`PropertyPulse:${user.email}`);
      return apiSuccess({
        hasPending: true,
        secret,
        uri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
      });
    } catch {
      return apiSuccess({ hasPending: false });
    }
  } catch (error) {
    return handleApiError(error, "auth.mfa.get");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    if (!recentlyAuthenticated(actor)) {
      return apiError("Sign in again before changing MFA settings.", { status: 403, code: "RECENT_AUTH_REQUIRED" });
    }

    const body = await request.json().catch(() => ({}));
    const forceNew = Boolean(body?.forceNew);

    await connectDB();
    const user = await User.findById(actor.id).select("+security.pendingTotpSecretCipher");
    if (!user) {
      return apiError("User profile not found.", { status: 404, code: "USER_NOT_FOUND" });
    }

    user.security = user.security || {};
    let secret;

    // Reuse existing pending secret if available unless forceNew is true
    if (!forceNew && user.security.pendingTotpSecretCipher) {
      try {
        secret = decryptSecret(user.security.pendingTotpSecretCipher);
      } catch {
        secret = null;
      }
    }

    if (!secret) {
      secret = generateTotpSecret();
      user.security.pendingTotpSecretCipher = encryptSecret(secret);
      await user.save();
    }

    const issuer = encodeURIComponent("PropertyPulse");
    const label = encodeURIComponent(`PropertyPulse:${user.email}`);
    await writeAuditLog({ actor, action: "account.mfa_setup_started", targetType: "User", targetId: user._id, request });
    return apiSuccess({
      secret,
      uri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
    });
  } catch (error) {
    return handleApiError(error, "auth.mfa.setup");
  }
}

export async function PUT(request) {
  try {
    const actor = await requireActor();
    const body = await request.json().catch(() => ({}));
    const rawCode = String(body?.code || "").trim();
    if (!rawCode || !/^\d{6}$/.test(rawCode)) {
      return apiError("Please enter a valid 6-digit code from your authenticator app.", {
        status: 422,
        code: "INVALID_MFA_CODE",
      });
    }

    await connectDB();
    const user = await User.findById(actor.id).select("+security.pendingTotpSecretCipher +security.recoveryCodeHashes");
    if (!user) {
      return apiError("User profile not found.", { status: 404, code: "USER_NOT_FOUND" });
    }

    user.security = user.security || {};
    if (!user.security.pendingTotpSecretCipher) {
      return apiError("Please start MFA setup first before submitting a code.", {
        status: 409,
        code: "MFA_SETUP_REQUIRED",
      });
    }

    const secret = decryptSecret(user.security.pendingTotpSecretCipher);
    if (!verifyTotp(secret, rawCode)) {
      return apiError("Authenticator code is invalid or expired. Check your device time and try again.", {
        status: 422,
        code: "INVALID_MFA_CODE",
      });
    }

    const recoveryCodes = generateRecoveryCodes();
    user.security.totpSecretCipher = encryptSecret(secret);
    user.security.pendingTotpSecretCipher = undefined;
    user.security.recoveryCodeHashes = recoveryCodes.map((entry) => valueHash(entry.toLowerCase()));
    user.security.mfaEnabled = true;
    user.security.mfaEnabledAt = new Date();
    await user.save();

    await SecurityEvent.create({ userId: user._id, type: "MFA_ENABLED", severity: "WARNING", sessionId: actor.sessionId });
    await writeAuditLog({ actor, action: "account.mfa_enabled", targetType: "User", targetId: user._id, request });
    return apiSuccess({ enabled: true, recoveryCodes });
  } catch (error) {
    return handleApiError(error, "auth.mfa.confirm");
  }
}

export async function DELETE(request) {
  try {
    const actor = await requireActor();
    const body = await request.json().catch(() => ({}));
    const rawCode = String(body?.code || "").trim();
    if (!rawCode || !/^\d{6}$/.test(rawCode)) {
      return apiError("Please enter a valid 6-digit code from your authenticator app.", {
        status: 422,
        code: "INVALID_MFA_CODE",
      });
    }

    if (actor.mfaRequired) {
      return apiError("MFA is mandatory for administrative accounts.", { status: 403, code: "MFA_REQUIRED" });
    }

    await connectDB();
    const user = await User.findById(actor.id).select("+security.totpSecretCipher +security.recoveryCodeHashes");
    if (!user) {
      return apiError("User profile not found.", { status: 404, code: "USER_NOT_FOUND" });
    }

    user.security = user.security || {};
    if (!user.security.totpSecretCipher || !verifyTotp(decryptSecret(user.security.totpSecretCipher), rawCode)) {
      return apiError("Authenticator code is invalid or expired.", { status: 422, code: "INVALID_MFA_CODE" });
    }

    user.security.mfaEnabled = false;
    user.security.totpSecretCipher = undefined;
    user.security.recoveryCodeHashes = [];
    user.security.mfaEnabledAt = undefined;
    await user.save();

    await SecurityEvent.create({ userId: user._id, type: "MFA_DISABLED", severity: "CRITICAL", sessionId: actor.sessionId });
    await writeAuditLog({ actor, action: "account.mfa_disabled", targetType: "User", targetId: user._id, request });
    return apiSuccess({ enabled: false });
  } catch (error) {
    return handleApiError(error, "auth.mfa.disable");
  }
}
