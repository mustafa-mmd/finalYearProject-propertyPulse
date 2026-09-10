import connectDB from "@/config/database";
import Property from "@/models/Property";
import VerificationRequest from "@/models/VerificationRequest";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { analyzeListingWithGemini, geminiConfigured } from "@/utils/listingVerification";
import { writeAuditLog } from "@/utils/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  return Boolean(secret && provided === `Bearer ${secret}`);
}

export async function POST(request) {
  if (!authorized(request)) {
    return apiError("Not found", { status: 404, code: "NOT_FOUND" });
  }

  try {
    if (!geminiConfigured()) {
      return apiSuccess({ processed: 0, message: "AI verification is not configured" });
    }

    await connectDB();
    const jobs = await VerificationRequest.find({ status: "AI_REVIEW" })
      .sort({ submittedAt: 1 })
      .limit(3);
    let processed = 0;

    for (const verification of jobs) {
      const property = await Property.findById(verification.propertyId);
      if (!property) {
        verification.status = "CANCELLED";
        verification.completedAt = new Date();
        await verification.save();
        continue;
      }

      const result = await analyzeListingWithGemini(property);
      verification.status = "MANUAL_REVIEW";
      property.listingStatus = "PENDING_MANUAL_REVIEW";
      property.verification.status = "IN_REVIEW";

      if (result) {
        verification.overallRiskScore = result.overallRiskScore;
        verification.riskLevel = result.riskLevel;
        verification.recommendedAction = result.recommendedAction;
        verification.confidenceScore = result.confidenceScore;
        verification.scores = result.scores;
        verification.findings.push(...result.findings);
        verification.missingInformation = [
          ...new Set([...verification.missingInformation, ...result.missingInformation]),
        ];
        verification.positiveSignals = [
          ...new Set([...verification.positiveSignals, ...result.positiveSignals]),
        ];
        verification.adminSummary = result.adminSummary;
        verification.ai = result.ai;
        property.verification.riskScore = result.overallRiskScore;
      } else {
        verification.adminSummary = `${verification.adminSummary || ""}\nAI analysis was unavailable. Continue with manual review.`.trim();
      }

      property.statusHistory.push({
        status: "PENDING_MANUAL_REVIEW",
        reason: result ? "AI-assisted analysis completed; human review required" : "AI unavailable; routed to human review",
      });
      await Promise.all([verification.save(), property.save()]);
      await writeAuditLog({
        action: "verification.ai_processed",
        targetType: "VerificationRequest",
        targetId: verification._id,
        tenantId: property.tenantId,
        metadata: { aiAvailable: Boolean(result), riskScore: verification.overallRiskScore },
        request,
      });
      processed += 1;
    }

    return apiSuccess({ processed });
  } catch (error) {
    return handleApiError(error, "jobs.verification");
  }
}
