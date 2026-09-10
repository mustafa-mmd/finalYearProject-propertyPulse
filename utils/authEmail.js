export async function deliverAuthEmail({ email, type, url, expiresAt }) {
  const endpoint = process.env.AUTH_EMAIL_DELIVERY_URL;
  const token = process.env.AUTH_EMAIL_DELIVERY_TOKEN;
  if (!endpoint || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_EMAIL_PROVIDER_NOT_CONFIGURED");
    return { delivered: false, previewUrl: url };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ template: type, to: email, actionUrl: url, expiresAt }), signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`AUTH_EMAIL_PROVIDER_${response.status}`);
    return { delivered: true };
  } finally { clearTimeout(timeout); }
}
