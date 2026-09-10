import crypto from "node:crypto";
import connectDB from "@/config/database";
import Notification from "@/models/Notification";
import OutboxEvent from "@/models/OutboxEvent";

export async function emitNotification({ recipientId, tenantId, type, title, body, href, dedupeKey, channels = ["IN_APP"] }) {
  await connectDB();
  const values = { tenantId, recipientId, type, title, body, href, channels, dedupeKey, delivery: { email: channels.includes("EMAIL") ? "PENDING" : "NOT_REQUESTED", sms: channels.includes("SMS") ? "PENDING" : "NOT_REQUESTED" } };
  const notification = dedupeKey
    ? await Notification.findOneAndUpdate({ recipientId, dedupeKey }, { $setOnInsert: values }, { upsert: true, new: true })
    : await Notification.create(values);
  await OutboxEvent.updateOne(
    { eventId: `notification:${notification._id}` },
    { $setOnInsert: { eventId: `notification:${notification._id}`, type: "notification.delivery_requested", aggregateType: "Notification", aggregateId: notification._id.toString(), tenantId, payload: { notificationId: notification._id.toString(), recipientId: String(recipientId), channels } } },
    { upsert: true }
  );
  return notification;
}

export async function publishDomainEvent({ type, aggregateType, aggregateId, tenantId, payload, eventId }) {
  await connectDB();
  const id = eventId || crypto.randomUUID();
  const event = await OutboxEvent.findOneAndUpdate({ eventId: id }, { $setOnInsert: { eventId: id, type, aggregateType, aggregateId: String(aggregateId), tenantId, payload } }, { upsert: true, new: true });
  if (tenantId) { const { queueEnterpriseWebhooks } = await import("@/utils/webhooks"); await queueEnterpriseWebhooks({ tenantId, eventId: id, eventType: type, payload }); }
  return event;
}
