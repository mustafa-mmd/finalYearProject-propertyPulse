import mongoose from "mongoose";
import cloudinary from "@/config/cloudinery";
import Property from "@/models/Property";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { actorOwns, requireActor } from "@/utils/authorization";
import { writeAuditLog } from "@/utils/audit";
import { recordListingVersion } from "@/utils/listingVersions";

const LINK_MEDIA_TYPES = new Set(["VIDEO", "VIRTUAL_TOUR", "FLOOR_PLAN", "BROCHURE"]);
const UPLOAD_TYPES = new Map([
  ["image/jpeg", { type: "IMAGE", resourceType: "image" }],
  ["image/png", { type: "IMAGE", resourceType: "image" }],
  ["image/webp", { type: "IMAGE", resourceType: "image" }],
  ["image/avif", { type: "IMAGE", resourceType: "image" }],
  ["video/mp4", { type: "VIDEO", resourceType: "video" }],
  ["video/webm", { type: "VIDEO", resourceType: "video" }],
  ["application/pdf", { type: "BROCHURE", resourceType: "raw" }],
]);

async function editableProperty(id, actor) {
  if (!mongoose.isValidObjectId(id)) return null;
  const property = await Property.findOne({ _id: id, deletedAt: { $exists: false } });
  if (!property) return null;
  const allowed = actorOwns(actor, property.owner) || actor.permissions.includes("properties.review");
  if (!allowed) return false;
  if (!property.media.length && property.images.length) {
    property.media.push(...property.images.map((url, index) => ({
      type: "IMAGE",
      url,
      order: index,
      isCover: index === 0,
    })));
    await property.save();
  }
  return property;
}

function syncLegacyImages(property) {
  const imageMedia = property.media
    .filter((item) => item.type === "IMAGE")
    .sort((a, b) => a.order - b.order);
  property.images = imageMedia.map((item) => item.url);
}

function requireReverification(property, actorId) {
  if (!["DRAFT", "INCOMPLETE", "CHANGES_REQUESTED"].includes(property.listingStatus)) {
    property.listingStatus = "DRAFT";
    property.verification.status = "NOT_SUBMITTED";
    property.statusHistory.push({
      status: "DRAFT",
      changedBy: actorId,
      reason: "Listing media changed; verification is required again",
    });
  }
}

export async function GET(_request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    const property = await editableProperty(id, actor);
    if (property === false) return apiError("Media access denied", { status: 403, code: "FORBIDDEN" });
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    return apiSuccess({
      items: [...property.media]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item._id.toString(),
          type: item.type,
          url: item.url,
          caption: item.caption || "",
          order: item.order,
          isCover: item.isCover,
        })),
    });
  } catch (error) {
    return handleApiError(error, "property.media.list");
  }
}

export async function POST(request, { params }) {
  const uploadedPublicIds = [];
  try {
    const actor = await requireActor();
    const { id } = await params;
    const property = await editableProperty(id, actor);
    if (property === false) return apiError("Media access denied", { status: 403, code: "FORBIDDEN" });
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    if (property.media.length >= 30) {
      return apiError("A listing can contain up to 30 media items", { status: 422, code: "MEDIA_LIMIT" });
    }

    const contentType = request.headers.get("content-type") || "";
    let newItems = [];
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("files").filter((file) => file instanceof File && file.size > 0);
      if (!files.length || files.length + property.media.length > 30) {
        return apiError("Choose valid media files within the 30-item limit", { status: 422, code: "INVALID_MEDIA" });
      }
      for (const file of files) {
        const config = UPLOAD_TYPES.get(file.type);
        if (!config || file.size > 25 * 1024 * 1024) {
          return apiError("Use JPEG, PNG, WebP, AVIF, MP4, WebM or PDF files up to 25 MB", { status: 422, code: "INVALID_MEDIA" });
        }
      }
      newItems = await Promise.all(files.map(async (file, index) => {
        const config = UPLOAD_TYPES.get(file.type);
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await cloudinary.uploader.upload(
          `data:${file.type};base64,${buffer.toString("base64")}`,
          {
            folder: "PropertyPulse/listing-media",
            resource_type: config.resourceType,
            ...(config.type === "IMAGE" ? { transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto", fetch_format: "auto" }] } : {}),
          }
        );
        uploadedPublicIds.push({ publicId: result.public_id, resourceType: config.resourceType });
        return {
          type: config.type,
          url: result.secure_url,
          publicId: result.public_id,
          caption: String(formData.get("caption") || "").trim().slice(0, 300),
          order: property.media.length + index,
          isCover: property.media.length === 0 && index === 0 && config.type === "IMAGE",
        };
      }));
    } else {
      const body = await request.json();
      const type = String(body.type || "").toUpperCase();
      let url;
      try {
        url = new URL(String(body.url || ""));
      } catch {
        return apiError("Enter a valid HTTPS media URL", { status: 422, code: "VALIDATION_ERROR" });
      }
      if (url.protocol !== "https:" || !LINK_MEDIA_TYPES.has(type)) {
        return apiError("Enter a supported HTTPS video, tour, floor-plan or brochure URL", { status: 422, code: "VALIDATION_ERROR" });
      }
      newItems = [{
        type,
        url: url.toString().slice(0, 2000),
        caption: String(body.caption || "").trim().slice(0, 300),
        order: property.media.length,
      }];
    }

    property.media.push(...newItems);
    syncLegacyImages(property);
    requireReverification(property, actor.id);
    await property.save();
    await Promise.all([
      recordListingVersion(property, actor.id, "UPDATED", { changedFields: ["media"] }),
      writeAuditLog({ actor, action: "listing.media_add", targetType: "Property", targetId: property._id, tenantId: property.tenantId, metadata: { count: newItems.length }, request }),
    ]);
    return apiSuccess({ count: newItems.length }, { status: 201 });
  } catch (error) {
    await Promise.allSettled(uploadedPublicIds.map((item) => cloudinary.uploader.destroy(item.publicId, { resource_type: item.resourceType })));
    return handleApiError(error, "property.media.add");
  }
}

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    const property = await editableProperty(id, actor);
    if (property === false) return apiError("Media access denied", { status: 403, code: "FORBIDDEN" });
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    if (!Array.isArray(body.items) || body.items.length !== property.media.length) {
      return apiError("Submit the complete media order", { status: 422, code: "VALIDATION_ERROR" });
    }
    const submittedIds = new Set(body.items.map((item) => String(item.id)));
    if (submittedIds.size !== property.media.length || property.media.some((item) => !submittedIds.has(item._id.toString()))) {
      return apiError("Media list does not match the listing", { status: 422, code: "VALIDATION_ERROR" });
    }
    const requestedCover = body.items.find((item) => item.isCover);
    const coverId = requestedCover?.id;
    body.items.forEach((submitted, index) => {
      const item = property.media.id(submitted.id);
      item.order = index;
      item.caption = String(submitted.caption || "").trim().slice(0, 300);
      item.isCover = item.type === "IMAGE" && item._id.toString() === coverId;
    });
    if (!property.media.some((item) => item.type === "IMAGE" && item.isCover)) {
      const firstImage = property.media.filter((item) => item.type === "IMAGE").sort((a, b) => a.order - b.order)[0];
      if (firstImage) firstImage.isCover = true;
    }
    syncLegacyImages(property);
    requireReverification(property, actor.id);
    await property.save();
    await recordListingVersion(property, actor.id, "UPDATED", { changedFields: ["media"] });
    await writeAuditLog({ actor, action: "listing.media_update", targetType: "Property", targetId: property._id, tenantId: property.tenantId, request });
    return apiSuccess({ updated: true });
  } catch (error) {
    return handleApiError(error, "property.media.update");
  }
}

export async function DELETE(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    const property = await editableProperty(id, actor);
    if (property === false) return apiError("Media access denied", { status: 403, code: "FORBIDDEN" });
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json();
    const item = property.media.id(body.mediaId);
    if (!item) return apiError("Media item not found", { status: 404, code: "NOT_FOUND" });
    const publicId = item.publicId;
    const resourceType = item.type === "VIDEO" ? "video" : item.type === "IMAGE" ? "image" : "raw";
    item.deleteOne();
    property.media.forEach((entry, index) => { entry.order = index; });
    syncLegacyImages(property);
    requireReverification(property, actor.id);
    await property.save();
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    await Promise.all([
      recordListingVersion(property, actor.id, "UPDATED", { changedFields: ["media"] }),
      writeAuditLog({ actor, action: "listing.media_delete", targetType: "Property", targetId: property._id, tenantId: property.tenantId, request }),
    ]);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "property.media.delete");
  }
}
