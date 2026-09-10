import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { actorOwns, getActor, requireActor } from "@/utils/authorization";
import { apiError, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { ensureResolvedLocation } from "@/utils/geocoding";
import { listingPublicFilter } from "@/config/listings";
import { calculateListingCompleteness } from "@/utils/listingLifecycle";
import { hasCoordinates, hasUsableLocation, parseLocationFormData } from "@/utils/location";
import {
  cleanText,
  normalizeCategory,
  normalizePurpose,
  parsePropertyNumbers,
} from "@/utils/propertyValidation";
import { recordListingVersion } from "@/utils/listingVersions";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    const actor = await getActor();
    const canReview = actor?.permissions?.includes("properties.review");
    const visibility = canReview
      ? { _id: id, deletedAt: { $exists: false } }
      : {
          _id: id,
          deletedAt: { $exists: false },
          $or: [
            ...listingPublicFilter().$or,
            ...(actor ? [{ owner: actor.id }] : []),
          ],
        };

    await connectDB();
    const property = await Property.findOne(visibility).lean();
    if (!property) return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    return Response.json(property, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error, "properties.get");
  }
}

export async function DELETE(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    await connectDB();
    const property = await Property.findById(id);
    if (!property || property.deletedAt) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    if (!actorOwns(actor, property.owner) && !actor.permissions.includes("properties.delete")) {
      return apiError("You cannot delete this listing", { status: 403, code: "FORBIDDEN" });
    }

    property.deletedAt = new Date();
    property.archivedAt = new Date();
    property.listingStatus = "ARCHIVED";
    property.statusHistory.push({ status: "ARCHIVED", changedBy: actor.id, reason: "Listing deleted by authorized user" });
    await property.save();
    await Promise.all([
      recordListingVersion(property, actor.id, "STATUS_CHANGED", { reason: "Soft deleted" }),
      writeAuditLog({
        actor,
        action: "listing.delete",
        targetType: "Property",
        targetId: property._id,
        tenantId: property.tenantId,
        request,
      }),
    ]);

    return Response.json({ success: true, message: "Property archived" });
  } catch (error) {
    return handleApiError(error, "properties.delete");
  }
}

export async function PUT(request, { params }) {
  try {
    const actor = await requireActor();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }

    await connectDB();
    const property = await Property.findById(id);
    if (!property || property.deletedAt) {
      return apiError("Property not found", { status: 404, code: "NOT_FOUND" });
    }
    if (!actorOwns(actor, property.owner)) {
      return apiError("Only the listing owner can edit it", { status: 403, code: "FORBIDDEN" });
    }
    if (["SUSPENDED", "FLAGGED", "SOLD"].includes(property.listingStatus)) {
      return apiError("This listing cannot be edited in its current status", {
        status: 409,
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    const formData = await request.formData();
    const { location: submittedLocation, errors: locationErrors } = parseLocationFormData(formData);
    if (locationErrors.length || !hasUsableLocation(submittedLocation)) {
      return apiError("Choose a valid address or map position", {
        status: 422,
        code: "INVALID_LOCATION",
        details: locationErrors,
      });
    }
    const resolvedLocation = await ensureResolvedLocation(submittedLocation);
    if (!hasCoordinates(resolvedLocation)) {
      return apiError("Place the property pin on the map before saving", {
        status: 422,
        code: "COORDINATES_REQUIRED",
      });
    }

    const { values: numbers, invalid } = parsePropertyNumbers(formData);
    if (invalid.length) {
      return apiError("One or more property numbers are invalid", {
        status: 422,
        code: "VALIDATION_ERROR",
        details: invalid,
      });
    }
    const name = cleanText(formData.get("name"), 120);
    const description = cleanText(formData.get("description"), 10_000);
    const type = cleanText(formData.get("type"), 80);
    if (name.length < 8 || description.length < 20 || !type) {
      return apiError("Provide a title, property type, and meaningful description", {
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    const priorStatus = property.listingStatus;
    const previousPrices = {
      NIGHTLY: property.rates?.nightly,
      WEEKLY: property.rates?.weekly,
      MONTHLY: property.rates?.monthly,
      SALE: property.pricing?.salePrice,
    };
    property.name = name;
    property.type = type;
    property.description = description;
    property.listingPurpose = normalizePurpose(formData.get("listingPurpose") || property.listingPurpose);
    property.listingCategory = normalizeCategory(formData.get("listingCategory") || property.listingCategory, type);
    property.location = resolvedLocation;
    property.beds = numbers.beds;
    property.baths = numbers.baths;
    property.square_feet = numbers.square_feet;
    property.amenities = formData.getAll("amenities").map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 100);
    property.rates = {
      nightly: numbers.nightly,
      weekly: numbers.weekly,
      monthly: numbers.monthly,
    };
    property.pricing.salePrice = numbers.salePrice;
    property.pricing.monthlyRent = numbers.monthlyRent;
    property.seller_info = {
      name: cleanText(formData.get("seller_info.name"), 100, actor.name),
      email: cleanText(formData.get("seller_info.email"), 254, actor.email).toLowerCase(),
      phone: cleanText(formData.get("seller_info.phone"), 30),
    };
    property.completenessScore = calculateListingCompleteness(property).score;
    const nextPrices = { NIGHTLY: numbers.nightly, WEEKLY: numbers.weekly, MONTHLY: numbers.monthly, SALE: numbers.salePrice };
    for (const [period, amount] of Object.entries(nextPrices)) {
      if (Number(amount) >= 0 && Number(amount) !== Number(previousPrices[period])) {
        property.priceHistory.push({ period, amount: Number(amount), currency: property.currency, changedBy: actor.id });
      }
    }

    if (!["DRAFT", "INCOMPLETE", "CHANGES_REQUESTED"].includes(priorStatus)) {
      property.listingStatus = "DRAFT";
      property.verification.status = "NOT_SUBMITTED";
      property.statusHistory.push({
        status: "DRAFT",
        changedBy: actor.id,
        reason: "Material listing details changed; verification is required again",
      });
    }

    await property.save();
    await Promise.all([
      recordListingVersion(property, actor.id, "UPDATED", {
        changedFields: ["listing", "location", "pricing", "contact"],
      }),
      writeAuditLog({
        actor,
        action: "listing.update",
        targetType: "Property",
        targetId: property._id,
        tenantId: property.tenantId,
        metadata: { priorStatus, newStatus: property.listingStatus },
        request,
      }),
    ]);

    return Response.json(property);
  } catch (error) {
    return handleApiError(error, "properties.update");
  }
}
