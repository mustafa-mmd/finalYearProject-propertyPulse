import mongoose from "mongoose";
import connectDB from "@/config/database";
import Message from "@/models/Message";
import Property from "@/models/Property";
import User from "@/models/User";
import ViewingAppointment from "@/models/ViewingAppointment";
import RentalApplication from "@/models/RentalApplication";
import Offer from "@/models/Offer";
import LeadScore from "@/models/LeadScore";
import { listingPublicFilter } from "@/config/listings";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { emitNotification } from "@/utils/events";
import { calculateLeadScore } from "@/utils/recommendations";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const messages = await Message.find({
      recipient: actor.id,
      deletedBy: { $ne: actor.id },
    })
      .sort({ read: 1, createdAt: -1 })
      .populate("sender", "name image verification.status")
      .populate("property", "name listingReference")
      .limit(250)
      .lean();

    return apiSuccess({ messages });
  } catch (error) {
    return handleApiError(error, "messages.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const rate = await checkRateLimit(`message:${actor.id}:${getClientIp(request)}`, {
      limit: 20,
      windowMs: 60_000,
    });

    if (!rate.allowed) {
      return apiError("Too many messages. Please wait a minute.", {
        status: 429,
        code: "RATE_LIMITED",
      });
    }

    const body = await request.json();
    if (!mongoose.isValidObjectId(body.property)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const text = String(body.message || "").trim().slice(0, 5000);
    if (text.length < 2) {
      return apiError("Please enter a message before sending", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectDB();
    const property = await Property.findOne({
      _id: body.property,
      ...listingPublicFilter(),
    });

    if (!property) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    const recipient = property.owner?.[0]?.toString();
    if (!recipient || recipient === actor.id) {
      return apiError("You cannot send an inquiry to your own listing", {
        status: 409,
        code: "SELF_ACTION_DENIED",
      });
    }

    const message = await Message.create({
      tenantId: property.tenantId,
      sender: actor.id,
      recipient,
      property: property._id,
      name: actor.name,
      email: actor.email,
      phone: String(body.phone || "").slice(0, 30),
      body: text,
    });

    await emitNotification({
      recipientId: recipient,
      tenantId: property.tenantId,
      type: "NEW_INQUIRY",
      title: "New property inquiry",
      body: `${actor.name || "A user"} sent an inquiry about ${property.name}.`,
      href: "/messages",
      dedupeKey: `message:${message._id}`,
      channels: ["IN_APP", "EMAIL"],
    });

    const [user, viewing, application, offer] = await Promise.all([
      User.findById(actor.id).select("bookmarks verification.status").lean(),
      ViewingAppointment.exists({ requesterId: actor.id, propertyId: property._id }),
      RentalApplication.exists({ applicantId: actor.id, propertyId: property._id }),
      Offer.exists({ buyerId: actor.id, propertyId: property._id }),
    ]);

    const score = calculateLeadScore({
      hasMessage: true,
      hasViewing: Boolean(viewing),
      hasBookmark: user?.bookmarks?.some((id) => id.toString() === property._id.toString()),
      hasApplication: Boolean(application || offer),
      verified: user?.verification?.status === "VERIFIED",
    });

    await LeadScore.findOneAndUpdate(
      { userId: actor.id, propertyId: property._id },
      {
        $set: {
          tenantId: property.tenantId,
          ...score,
          modelVersion: "rules-v1",
          calculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 180 * 86_400_000),
        },
      },
      { upsert: true, new: true }
    );

    return apiSuccess(
      { message: "Message sent successfully", leadGrade: score.grade, id: message._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "messages.create");
  }
}
