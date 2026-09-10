import crypto from "node:crypto";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import AIAnalysis from "@/models/AIAnalysis";
import LeadScore from "@/models/LeadScore";
import Message from "@/models/Message";
import Offer from "@/models/Offer";
import RentalApplication from "@/models/RentalApplication";
import User from "@/models/User";
import ViewingAppointment from "@/models/ViewingAppointment";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { actorOwns, requireActor } from "@/utils/authorization";
import { scoreInquiryLead } from "@/utils/leadScoring";
import { calculateLeadScore } from "@/utils/recommendations";

export const dynamic = "force-dynamic";

function hashInput(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const { messageId } = await request.json();

    if (!mongoose.isValidObjectId(messageId)) {
      return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    }

    await connectDB();
    const message = await Message.findById(messageId)
      .populate("property", "name listingPurpose listingCategory owner tenantId")
      .lean();

    if (!message?.property) {
      return apiError("Message not found", { status: 404, code: "NOT_FOUND" });
    }

    const isOwner = actorOwns(actor, message.property.owner || []);
    const canReview = actor.permissions.includes("properties.review");
    if (!isOwner && !canReview) {
      return apiError("You do not own this property", { status: 403, code: "FORBIDDEN" });
    }

    const [sender, viewing, application, offer] = await Promise.all([
      User.findById(message.sender).select("bookmarks verification.status").lean(),
      ViewingAppointment.exists({ requesterId: message.sender, propertyId: message.property._id }),
      RentalApplication.exists({ applicantId: message.sender, propertyId: message.property._id }),
      Offer.exists({ buyerId: message.sender, propertyId: message.property._id }),
    ]);

    const deterministic = calculateLeadScore({
      hasMessage: true,
      hasViewing: Boolean(viewing),
      hasBookmark: sender?.bookmarks?.some(
        (id) => id.toString() === message.property._id.toString()
      ),
      hasApplication: Boolean(application || offer),
      verified: sender?.verification?.status === "VERIFIED",
    });

    const inquiry = {
      senderName: message.name || "Unknown",
      messageBody: message.body || "",
      propertyTitle: message.property.name || "",
      propertyPurpose: message.property.listingPurpose || "",
      propertyCategory: message.property.listingCategory || "",
    };
    const aiResult = await scoreInquiryLead(inquiry);
    const score = aiResult?.score ?? deterministic.score;
    const grade = aiResult
      ? aiResult.tier === "SPAM"
        ? "COLD"
        : aiResult.tier
      : deterministic.grade;
    const modelVersion = aiResult?.ai?.promptVersion || "rules-v1";

    await LeadScore.findOneAndUpdate(
      { userId: message.sender, propertyId: message.property._id },
      {
        $set: {
          tenantId: message.property.tenantId,
          score,
          grade,
          factors: deterministic.factors,
          modelVersion,
          calculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 180 * 86_400_000),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    if (aiResult) {
      const inputHash = hashInput(inquiry);
      await AIAnalysis.findOneAndUpdate(
        { analysisType: "LEAD_SCORE", entityId: message._id, inputHash },
        {
          $set: {
            tenantId: message.property.tenantId,
            entityType: "Message",
            provider: aiResult.ai.provider,
            model: aiResult.ai.modelName,
            promptVersion: aiResult.ai.promptVersion,
            status: "HUMAN_REVIEW_REQUIRED",
            result: aiResult,
            riskScore: aiResult.tier === "SPAM" ? 100 - aiResult.score : undefined,
            retentionExpiresAt: new Date(Date.now() + 180 * 86_400_000),
          },
          $setOnInsert: { analysisType: "LEAD_SCORE", entityId: message._id, inputHash },
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    return apiSuccess({
      messageId,
      leadScore: {
        score,
        grade,
        factors: deterministic.factors,
        ai: aiResult || null,
        requiresHumanReview: Boolean(aiResult),
      },
      scoringMode: aiResult ? "AI_WITH_RULE_FALLBACK" : "DETERMINISTIC_RULES",
    });
  } catch (error) {
    return handleApiError(error, "lead-scores.create");
  }
}
