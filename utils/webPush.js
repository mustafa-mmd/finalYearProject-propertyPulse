const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

export function webPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export function buildPushPayload({
  title,
  body,
  icon = "/globe.svg",
  url = "/",
  tag = "default",
}) {
  return JSON.stringify({ title, body, icon, url, tag });
}

// Web Push requires RFC 8291 payload encryption. This repository does not
// report a successful delivery until the signed notification adapter handles it.
export async function sendPushNotification() {
  console.warn(
    "[webPush] Direct delivery is disabled; configure NOTIFICATION_DELIVERY_URL for push"
  );
  return false;
}

export async function broadcastPushNotification(subscriptions) {
  return { sent: 0, failed: subscriptions.length };
}
