import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import WebhookEvent from "@/models/WebhookEvent";
import {
  amountsMatch,
  createPayloadHash,
  createPayfastSignature,
  createWebhookEventId,
  getPayfastConfig,
  signaturesMatch,
  validateWithPayfast,
} from "@/utils/payfast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 100_000;

function text(message, status) {
  return new Response(message, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain" },
  });
}

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_WEBHOOK_BYTES) return text("Payload too large", 413);

    const config = getPayfastConfig();
    const formData = await request.formData();
    const body = {};

    for (const [key, rawValue] of formData.entries()) {
      if (typeof rawValue !== "string" || key.length > 100 || rawValue.length > 2000) {
        return text("Invalid payload", 400);
      }
      body[key] = rawValue;
    }

    if (
      !body.signature ||
      !body.m_payment_id ||
      !body.pf_payment_id ||
      !body.payment_status
    ) {
      return text("Missing required fields", 400);
    }

    const calculatedSignature = createPayfastSignature(body, config.passphrase);
    if (!signaturesMatch(body.signature, calculatedSignature)) {
      return text("Invalid signature", 400);
    }

    if (body.merchant_id !== config.merchantId) {
      return text("Invalid merchant", 400);
    }

    await connectDB();
    const payment = await Payment.findOne({ paymentId: body.m_payment_id });
    if (!payment) return text("Payment not found", 404);

    if (!amountsMatch(body.amount_gross, payment.amount)) {
      return text("Amount mismatch", 400);
    }

    const providerVerified = await validateWithPayfast(body, config.gatewayUrl);
    if (!providerVerified) return text("Provider validation failed", 400);

    const eventId = createWebhookEventId(body);
    const existingEvent = await WebhookEvent.exists({
      provider: "payfast",
      eventId,
    });
    if (existingEvent) return text("OK", 200);

    const providerStatus = body.payment_status.toUpperCase();
    const payfastData = {
      merchant_id: body.merchant_id,
      pf_payment_id: body.pf_payment_id,
      payment_status: body.payment_status,
      item_name: body.item_name,
      amount_gross: body.amount_gross,
      amount_fee: body.amount_fee,
      amount_net: body.amount_net,
    };

    let nextStatus = "pending";
    let allowedCurrentStatuses = ["pending"];
    const setFields = { payfastData };

    if (providerStatus === "COMPLETE") {
      nextStatus = "completed";
      allowedCurrentStatuses = ["pending", "failed", "cancelled"];
      setFields.paymentStatus = "completed";
      setFields.paidAt = new Date();
      setFields.cancelledAt = null;
    } else if (providerStatus === "FAILED") {
      nextStatus = "failed";
      setFields.paymentStatus = "failed";
    } else if (providerStatus === "CANCELLED") {
      nextStatus = "cancelled";
      setFields.paymentStatus = "cancelled";
      setFields.cancelledAt = new Date();
    }

    if (nextStatus !== "pending") {
      await Payment.updateOne(
        {
          _id: payment._id,
          paymentStatus: { $in: allowedCurrentStatuses },
        },
        {
          $set: setFields,
          $push: {
            statusHistory: {
              status: nextStatus,
              source: "payfast_webhook",
              reference: body.pf_payment_id || eventId,
              at: new Date(),
            },
          },
        }
      );
    }

    try {
      await WebhookEvent.create({
        provider: "payfast",
        eventId,
        paymentId: body.m_payment_id,
        payloadHash: createPayloadHash(body),
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }

    return text("OK", 200);
  } catch (error) {
    console.error("[payment] PayFast notification failed", {
      name: error?.name,
      code: error?.code,
    });
    return text("Server error", 500);
  }
}
