import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import VerificationRequest from "@/models/VerificationRequest";
import { requirePermission } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { recordListingVersion } from "@/utils/listingVersions";

const DECISIONS = Object.freeze({
  APPROVE: { verification: "APPROVED", listing: "PUBLISHED" },
  REJECT: { verification: "REJECTED", listing: "REJECTED" },
  REQUEST_CHANGES: { verification: "CHANGES_REQUESTED", listing: "CHANGES_REQUESTED" },
  SUSPEND: { verification: "REJECTED", listing: "SUSPENDED" },
  ESCALATE: { verification: "ESCALATED", listing: "FLAGGED" },
});

export async function POST(request, { params }) {
  try {
    const actor = await requirePermission("verifications.review");
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Verification request not found", { status: 404, code: "NOT_FOUND" });
    }
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.toUpperCase() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
    const decision = DECISIONS[action];
    if (!decision || (action !== "APPROVE" && reason.length < 10)) {
      return apiError("Select a valid decision and provide a clear reason", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectDB();
    let verification = await VerificationRequest.findById(id);
    let property;

    if (!verification) {
      // Check if id is a Property ID
      property = await Property.findById(id);
      if (!property) {
        return apiError("Verification request or listing not found", { status: 404, code: "NOT_FOUND" });
      }
      // Find or create VerificationRequest for this property
      verification = await VerificationRequest.findOne({
        propertyId: property._id,
      }).sort({ createdAt: -1 });

      if (!verification) {
        const ownerId = Array.isArray(property.owner) ? property.owner[0] : property.owner || actor.id;
        verification = new VerificationRequest({
          propertyId: property._id,
          tenantId: property.tenantId || undefined,
          requestedBy: ownerId,
          status: "MANUAL_REVIEW",
          overallRiskScore: 10,
          riskLevel: "LOW",
          recommendedAction: "STANDARD_MANUAL_REVIEW",
          adminSummary: "Auto-registered verification request for property.",
        });
      }
    } else {
      property = await Property.findById(verification.propertyId);
      if (!property) return apiError("Listing not found", { status: 404, code: "NOT_FOUND" });
    }

    verification.status = decision.verification;
    verification.decision = {
      action,
      reason: reason || "Approved after manual review",
      decidedBy: actor.id,
      decidedAt: new Date(),
    };
    verification.completedAt = action === "ESCALATE" ? undefined : new Date();

    if (action === "APPROVE") {
      property.statusHistory.push({ status: "APPROVED", changedBy: actor.id, reason: "Approved after manual verification" });
      property.approvedAt = new Date();
      property.publishedAt = new Date();
      property.verification.status = "VERIFIED";
      property.verification.verifiedBy = actor.id;
      property.verification.verifiedAt = new Date();
    } else if (action === "REQUEST_CHANGES") {
      property.verification.status = "CHANGES_REQUESTED";
    } else if (action === "REJECT" || action === "SUSPEND") {
      property.verification.status = "REJECTED";
    }

    property.listingStatus = decision.listing;
    property.statusHistory.push({ status: decision.listing, changedBy: actor.id, reason: verification.decision.reason });

    await Promise.all([verification.save(), property.save()]);

    // Secondary logging tasks (best effort)
    recordListingVersion(property, actor.id, "STATUS_CHANGED", { reason: verification.decision.reason }).catch((e) => console.error("[verification.decision] Version record error:", e));
    writeAuditLog({
      actor,
      action: `verification.${action.toLowerCase()}`,
      targetType: "VerificationRequest",
      targetId: verification._id,
      tenantId: property.tenantId || undefined,
      metadata: { propertyId: property._id.toString(), listingStatus: property.listingStatus },
      request,
    }).catch((e) => console.error("[verification.decision] Audit log error:", e));

    return apiSuccess({
      verificationId: verification._id.toString(),
      verificationStatus: verification.status,
      listingId: property._id.toString(),
      listingStatus: property.listingStatus,
    });
  } catch (error) {
    return handleApiError(error, "admin.verifications.decision");
  }
}
