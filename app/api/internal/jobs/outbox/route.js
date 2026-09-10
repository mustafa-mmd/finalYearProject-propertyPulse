import connectDB from "@/config/database";
import OutboxEvent from "@/models/OutboxEvent";
import Notification from "@/models/Notification";
import NotificationDeliveryAttempt from "@/models/NotificationDeliveryAttempt";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

async function deliverExternal(notification, event) {
  const channels = notification.channels.filter((channel) => channel !== "IN_APP");
  if (!channels.length) return;
  const endpoint = process.env.NOTIFICATION_DELIVERY_URL; const token = process.env.NOTIFICATION_DELIVERY_TOKEN;
  if (!endpoint || !token) throw new Error("NOTIFICATION_PROVIDER_NOT_CONFIGURED");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Idempotency-Key": event.eventId }, body: JSON.stringify({ notificationId: notification._id, recipientId: notification.recipientId, channels, type: notification.type, title: notification.title, body: notification.body, href: notification.href }), signal: controller.signal });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`NOTIFICATION_PROVIDER_${response.status}`);
    for (const channel of channels) await NotificationDeliveryAttempt.updateOne({ notificationId: notification._id, channel, attempt: event.attempts }, { $setOnInsert: { outboxEventId: event._id, provider: result.provider || "DELIVERY_ADAPTER", status: "SENT", providerReference: result.reference } }, { upsert: true });
    if (channels.includes("EMAIL")) notification.delivery.email = "SENT";
    if (channels.includes("SMS")) notification.delivery.sms = "SENT";
    await notification.save();
  } catch (error) {
    for (const channel of channels) await NotificationDeliveryAttempt.updateOne({ notificationId: notification._id, channel, attempt: event.attempts }, { $setOnInsert: { outboxEventId: event._id, provider: "DELIVERY_ADAPTER", status: "FAILED", errorCode: String(error.message).slice(0, 200) } }, { upsert: true });
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function POST(request) {
  try {
    const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return apiError("Unauthorized", { status: 401, code: "UNAUTHORIZED" });
    await connectDB(); const worker = `outbox-${process.pid}`; const processed = [];
    for (let i = 0; i < 25; i += 1) {
      const event = await OutboxEvent.findOneAndUpdate({ status: { $in: ["PENDING", "FAILED"] }, availableAt: { $lte: new Date() }, attempts: { $lt: 8 } }, { $set: { status: "PROCESSING", lockedAt: new Date(), lockedBy: worker }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, new: true });
      if (!event) break;
      try {
        if (event.type === "notification.delivery_requested") { const notification = await Notification.findById(event.payload.notificationId); if (notification) await deliverExternal(notification, event); }
        event.status = "PROCESSED"; event.processedAt = new Date(); event.lockedAt = undefined; event.lockedBy = undefined; await event.save(); processed.push(event.eventId);
      } catch (error) { event.status = event.attempts >= 8 ? "DEAD_LETTER" : "FAILED"; event.availableAt = new Date(Date.now() + Math.min(3_600_000, 2 ** event.attempts * 1000)); event.lastError = String(error.message || "Delivery failed").slice(0, 1000); event.lockedAt = undefined; event.lockedBy = undefined; await event.save(); }
    }
    return apiSuccess({ processed: processed.length });
  } catch (error) { return handleApiError(error, "outbox.worker"); }
}
