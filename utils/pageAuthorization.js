import { redirect } from "next/navigation";
import { hasPermission } from "@/config/authorization";
import { canAccessAdmin } from "@/config/admin";
import { getActor } from "@/utils/authorization";

function safeCallbackUrl(value, fallback = "/admin") {
  const callbackUrl = String(value || "");
  return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : fallback;
}

function signInUrl(callbackUrl) {
  return "/auth/signin?callbackUrl=" + encodeURIComponent(callbackUrl);
}

function mfaUrl(callbackUrl) {
  return "/auth/mfa?callbackUrl=" + encodeURIComponent(callbackUrl);
}

export async function requirePagePermission(permission, callbackUrl = "/admin") {
  const safeCallback = safeCallbackUrl(callbackUrl);
  const actor = await getActor();
  if (!actor) redirect(signInUrl(safeCallback));
  if (!hasPermission(actor.roles, permission)) redirect("/");
  if (actor.mfaRequired && !actor.mfaVerified) redirect(mfaUrl(safeCallback));
  return actor;
}

export async function requireAdminPageAccess(callbackUrl = "/admin") {
  const safeCallback = safeCallbackUrl(callbackUrl);
  const actor = await getActor();
  if (!actor) redirect(signInUrl(safeCallback));
  if (!canAccessAdmin(actor.permissions)) redirect("/");
  if (actor.mfaRequired && !actor.mfaVerified) redirect(mfaUrl(safeCallback));
  return actor;
}

export function normalizeInternalCallback(value, fallback = "/admin") {
  return safeCallbackUrl(value, fallback);
}
