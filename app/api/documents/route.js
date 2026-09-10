import crypto from "node:crypto";
import connectDB from "@/config/database";
import cloudinary from "@/config/cloudinery";
import Document from "@/models/Document";
import AIAnalysis from "@/models/AIAnalysis";
import { requireActor } from "@/utils/authorization";
import { resolveEntityAccess } from "@/utils/entityAccess";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { analyzeDocumentBuffer } from "@/utils/documentAnalysis";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const TYPES = ["PROPERTY", "LEASE", "OFFER", "SALE", "APPLICATION", "BOOKING", "MAINTENANCE", "ORGANIZATION", "USER"];
const CATEGORIES = ["IDENTITY", "OWNERSHIP", "LEASE", "PROOF_OF_FUNDS", "MORTGAGE_PREAPPROVAL", "SALE_AGREEMENT", "INSPECTION", "RECEIPT", "OTHER"];
const MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function GET(request) {
  try {
    const actor = await requireActor(); const { searchParams } = new URL(request.url); const entityType = searchParams.get("entityType"), entityId = searchParams.get("entityId");
    if (!TYPES.includes(entityType)) return apiError("Invalid document entity", { status: 422, code: "VALIDATION_ERROR" });
    await connectDB(); const access = await resolveEntityAccess(entityType, entityId, actor);
    if (!access?.canRead) return apiError("Document access denied", { status: 403, code: "FORBIDDEN" });
    const items = await Document.find({ entityType, entityId, status: "ACTIVE", deletedAt: { $exists: false }, $or: [{ visibility: "TRANSACTION_PARTICIPANTS" }, { visibility: "TENANT_TEAM", tenantId: access.tenantId }, { ownerId: actor.id }, { allowedUserIds: actor.id }] }).select("name mimeType size category ownerId visibility analysisStatus createdAt").sort({ createdAt: -1 }).lean();
    return apiSuccess({ items });
  } catch (error) { return handleApiError(error, "documents.list"); }
}

export async function POST(request) {
  let uploadedPublicId;
  try {
    const actor = await requireActor(); const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 16 * 1024 * 1024) return apiError("Document is too large", { status: 413, code: "PAYLOAD_TOO_LARGE" });
    const form = await request.formData(); const entityType = String(form.get("entityType") || ""), entityId = String(form.get("entityId") || ""), file = form.get("file");
    if (!TYPES.includes(entityType) || !file || typeof file.arrayBuffer !== "function") return apiError("Document and related record are required", { status: 422, code: "VALIDATION_ERROR" });
    if (!MIME_TYPES.includes(file.type) || file.size <= 0 || file.size > 15 * 1024 * 1024) return apiError("Only PDF, JPEG, PNG or WebP files up to 15 MB are accepted", { status: 422, code: "INVALID_DOCUMENT" });
    await connectDB(); const access = await resolveEntityAccess(entityType, entityId, actor);
    if (!access?.canWrite) return apiError("Document upload access denied", { status: 403, code: "FORBIDDEN" });
    const buffer = Buffer.from(await file.arrayBuffer()); const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const existing = await Document.findOne({ entityType, entityId, checksum, status: "ACTIVE" }).lean();
    if (existing) return apiSuccess({ id: existing._id.toString(), duplicate: true });
    const result = await cloudinary.uploader.upload(`data:${file.type};base64,${buffer.toString("base64")}`, { folder: "PropertyPulse/private-documents", resource_type: "raw", type: "authenticated", use_filename: false, unique_filename: true });
    uploadedPublicId = result.public_id; const category = CATEGORIES.includes(form.get("category")) ? form.get("category") : "OTHER"; const analysisRequested = ["OWNERSHIP", "PROOF_OF_FUNDS", "MORTGAGE_PREAPPROVAL"].includes(category);
    const document = await Document.create({ tenantId: access.tenantId, ownerId: actor.id, entityType, entityId, category, name: String(file.name || "document").slice(0, 200), mimeType: file.type, size: file.size, publicId: result.public_id, secureUrl: result.secure_url, checksum, visibility: entityType === "USER" ? "PRIVATE" : "TRANSACTION_PARTICIPANTS", allowedUserIds: access.participantIds, analysisStatus: analysisRequested ? "PENDING" : "NOT_REQUESTED" });
    if (analysisRequested) {
      try {
        const analysis = await analyzeDocumentBuffer({ buffer, mimeType: file.type, category, name: file.name });
        if (analysis) {
          await AIAnalysis.create({ tenantId: access.tenantId, analysisType: "DOCUMENT_EXTRACTION", entityType: "Document", entityId: document._id, ...analysis, status: "HUMAN_REVIEW_REQUIRED", retentionExpiresAt: new Date(Date.now() + 180 * 86_400_000) });
          document.analysisStatus = "HUMAN_REVIEW_REQUIRED"; await document.save();
        }
      } catch (error) { document.analysisStatus = "FAILED"; await document.save(); console.warn("[document-analysis] Provider analysis failed", { code: error?.message }); }
    }
    await writeAuditLog({ actor, action: "document.upload", targetType: "Document", targetId: document._id, tenantId: access.tenantId, metadata: { entityType, entityId, category, checksum, humanReviewRequired: analysisRequested }, request });
    return apiSuccess({ id: document._id.toString(), analysisStatus: document.analysisStatus }, { status: 201 });
  } catch (error) { if (uploadedPublicId) await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "raw", type: "authenticated" }).catch(() => {}); return handleApiError(error, "documents.upload"); }
}
