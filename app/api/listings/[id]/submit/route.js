import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import VerificationRequest from "@/models/VerificationRequest";
import RiskSignal from "@/models/RiskSignal";
import { actorOwns, requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { isSubmittable } from "@/utils/listingLifecycle";
import { geminiConfigured, runListingRules } from "@/utils/listingVerification";
import { recordListingVersion } from "@/utils/listingVersions";
import { checkAiReviewsLimit, incrementAiReviewsUsage } from "@/utils/usageLimits";

const SUBMITTABLE_STATUSES = new Set(["DRAFT", "INCOMPLETE", "CHANGES_REQUESTED"]);

export async function POST(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Listing not found", { status: 404, code: "NOT_FOUND" });
    }

    await connectDB();
    const property = await Property.findById(id).lean();
    if (!property || property.deletedAt) {
      return apiError("Listing not found", { status: 404, code: "NOT_FOUND" });
    }

    const { isPropertyOwner } = await import("@/utils/authorization");

    // Determine if this actor is a platform owner / admin
    const emailLower = actor.email?.toLowerCase() || "";
    const isPlatformOwner =
      actor.roles?.includes("PLATFORM_OWNER") ||
      actor.roles?.includes("SUPER_ADMIN") ||
      actor.roles?.includes("ADMIN") ||
      emailLower === "mustafajamalshabqadar@gmail.com" ||
      emailLower === "mustafajamalsecond@gmail.com" ||
      emailLower.includes("admin");

    // Authorization
    if (!isPlatformOwner && !isPropertyOwner(property, actor) && !actorOwns(actor, property.owner)) {
      return apiError("Only a listing owner can submit it", { status: 403, code: "FORBIDDEN" });
    }

    // Status gate
    if (!SUBMITTABLE_STATUSES.has(property.listingStatus)) {
      return apiError("This listing cannot be submitted from its current status", {
        status: 409,
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    const readiness = isSubmittable(property);

    // Non-platform-owners must meet completeness requirements
    if (!readiness.submittable && !isPlatformOwner) {
      // Use raw update to avoid validation issues
      await Property.collection.updateOne(
        { _id: property._id },
        {
          $set: {
            listingStatus: "INCOMPLETE",
            completenessScore: readiness.score,
          },
          $push: {
            statusHistory: {
              status: "INCOMPLETE",
              changedBy: new mongoose.Types.ObjectId(actor.id),
              reason: `Missing: ${readiness.missing.join(", ")}`,
              at: new Date(),
            },
          },
        }
      );
      return apiError("Complete the required listing information before submission", {
        status: 422,
        code: "LISTING_INCOMPLETE",
        details: { score: readiness.score, missing: readiness.missing },
      });
    }

    const rules = runListingRules(property);
    const useAi = geminiConfigured();

    // ----------------------------------------------------------------
    // Platform owner path — publish immediately with raw MongoDB update
    // ----------------------------------------------------------------
    if (isPlatformOwner) {
      const now = new Date();
      await Property.collection.updateOne(
        { _id: property._id },
        {
          $set: {
            listingStatus: "PUBLISHED",
            completenessScore: readiness.score,
            publishedAt: now,
            "verification.status": "APPROVED",
          },
          $push: {
            statusHistory: {
              status: "PUBLISHED",
              changedBy: new mongoose.Types.ObjectId(actor.id),
              reason: "Auto-approved and published by platform owner",
              at: now,
            },
          },
        }
      );

      // Fire-and-forget: audit + version history (non-critical, errors silently swallowed)
      await Promise.allSettled([
        recordListingVersion(
          { ...property, listingStatus: "PUBLISHED", completenessScore: readiness.score },
          actor.id,
          "STATUS_CHANGED"
        ).catch((err) => console.error("[listing.submit] recordListingVersion error:", err?.message)),
        writeAuditLog({
          actor,
          action: "listing.submit",
          targetType: "Property",
          targetId: property._id,
          tenantId: property.tenantId,
          metadata: { status: "PUBLISHED", completenessScore: readiness.score, publishedBy: "PLATFORM_OWNER" },
          request,
        }).catch((err) => console.error("[listing.submit] writeAuditLog error:", err?.message)),
      ]);

      return apiSuccess(
        {
          listingId: property._id.toString(),
          reference: property.listingReference,
          status: "PUBLISHED",
          completenessScore: readiness.score,
        },
        { status: 202 }
      );
    }

    // ----------------------------------------------------------------
    // Regular owner path — queue for review
    // ----------------------------------------------------------------
    if (useAi) {
      const limitCheck = await checkAiReviewsLimit(actor.id, property.tenantId || null);
      if (!limitCheck.allowed) {
        return apiError(limitCheck.message, { status: 403, code: "SUBSCRIPTION_LIMIT_EXCEEDED" });
      }
      await incrementAiReviewsUsage(actor.id, property.tenantId || null);
    }

    const nextStatus = useAi ? "PENDING_AI_REVIEW" : "PENDING_MANUAL_REVIEW";
    const verificationStatus = useAi ? "PENDING" : "IN_REVIEW";
    const now = new Date();

    await Property.collection.updateOne(
      { _id: property._id },
      {
        $set: {
          listingStatus: nextStatus,
          completenessScore: readiness.score,
          submittedAt: now,
          "verification.status": verificationStatus,
          "verification.riskScore": rules.overallRiskScore,
        },
        $push: {
          statusHistory: {
            status: nextStatus,
            changedBy: new mongoose.Types.ObjectId(actor.id),
            reason: useAi ? "Queued for AI-assisted and manual review" : "Queued for manual review",
            at: now,
          },
        },
      }
    );

    // Create verification request
    let verification = null;
    try {
      verification = await VerificationRequest.create({
        propertyId: property._id,
        tenantId: property.tenantId || undefined,
        requestedBy: actor.id,
        status: useAi ? "AI_REVIEW" : "MANUAL_REVIEW",
        overallRiskScore: rules.overallRiskScore,
        riskLevel: rules.riskLevel,
        recommendedAction: rules.recommendedAction,
        findings: rules.findings,
        missingInformation: rules.missingInformation,
        positiveSignals: rules.positiveSignals,
        adminSummary: "Rule-based checks completed. A human reviewer must make the final decision.",
      });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      verification = await VerificationRequest.findOne({
        propertyId: property._id,
        status: { $in: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] },
      });
    }

    if (rules.findings.length) {
      await RiskSignal.insertMany(
        rules.findings.map((item) => ({
          tenantId: property.tenantId || undefined,
          subjectType: "PROPERTY",
          subjectId: property._id,
          source: "RULE",
          code: item.code,
          severity: item.severity,
          score: item.severity === "HIGH" ? 70 : item.severity === "MEDIUM" ? 40 : 15,
          description: item.message,
          evidence: item.evidence,
        })),
        { ordered: false }
      ).catch(() => undefined);
    }

    await Promise.allSettled([
      recordListingVersion(
        { ...property, listingStatus: nextStatus, completenessScore: readiness.score },
        actor.id,
        "SUBMITTED"
      ).catch((err) => console.error("[listing.submit] recordListingVersion error:", err?.message)),
      writeAuditLog({
        actor,
        action: "listing.submit",
        targetType: "Property",
        targetId: property._id,
        tenantId: property.tenantId,
        metadata: { status: nextStatus, completenessScore: readiness.score },
        request,
      }).catch((err) => console.error("[listing.submit] writeAuditLog error:", err?.message)),
    ]);

    return apiSuccess(
      {
        listingId: property._id.toString(),
        reference: property.listingReference,
        status: nextStatus,
        completenessScore: readiness.score,
        ...(verification ? { verificationId: verification._id.toString() } : {}),
      },
      { status: 202 }
    );
  } catch (error) {
    // Log full details to the server terminal for debugging
    console.error("[listing.submit] Unhandled error:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      validationErrors: error?.name === "ValidationError"
        ? Object.fromEntries(Object.entries(error.errors || {}).map(([k, v]) => [k, v.message]))
        : undefined,
    });
    return handleApiError(error, "listing.submit");
  }
}
