import connectDB from "@/config/database";
import cloudinary from "@/config/cloudinery";
import Property from "@/models/Property";
import User from "@/models/User";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
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
  validateImages,
} from "@/utils/propertyValidation";
import { recordListingVersion } from "@/utils/listingVersions";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { validCurrency } from "@/config/international";
import { checkActiveListingsLimit } from "@/utils/usageLimits";
import { publishDomainEvent } from "@/utils/events";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "12", 10)));
    const purpose = searchParams.get("purpose");
    const filter = {
      ...listingPublicFilter(),
      ...(purpose ? { listingPurpose: purpose } : {}),
    };
    const [total, properties] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .sort({ is_featured: -1, publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);
    return Response.json(
      { properties, total, page, pageSize, pages: Math.ceil(total / pageSize) },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
    );
  } catch (error) {
    return handleApiError(error, "properties.list");
  }
}

export async function POST(request) {
  const uploadedPublicIds = [];

  try {
    const actor = await requireActor();
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 105 * 1024 * 1024) {
      return apiError("Upload is too large", { status: 413, code: "PAYLOAD_TOO_LARGE" });
    }

    const formData = await request.formData();
    const organizationId = cleanText(formData.get("organizationId"), 64);
    const organizationAccess = organizationId
      ? await requireOrganizationPermission(organizationId, "listings.create")
      : null;
    const limitCheck = await checkActiveListingsLimit(actor.id, organizationId || null);
    if (!limitCheck.allowed) {
      return apiError(limitCheck.message, { status: 403, code: "SUBSCRIPTION_LIMIT_EXCEEDED" });
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

    const { values: numbers, invalid: invalidNumbers } = parsePropertyNumbers(formData);
    if (invalidNumbers.length) {
      return apiError("One or more property numbers are invalid", {
        status: 422,
        code: "VALIDATION_ERROR",
        details: invalidNumbers,
      });
    }

    const images = formData
      .getAll("images")
      .filter((image) => image && typeof image.arrayBuffer === "function" && image.size > 0);
    const imageError = validateImages(images);
    if (imageError) return apiError(imageError, { status: 422, code: "INVALID_MEDIA" });

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

    const uploaded = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const result = await cloudinary.uploader.upload(
          `data:${image.type};base64,${buffer.toString("base64")}`,
          {
            folder: "PropertyPulse/listings",
            resource_type: "image",
            transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto", fetch_format: "auto" }],
          }
        );
        uploadedPublicIds.push(result.public_id);
        return { url: result.secure_url, publicId: result.public_id };
      })
    );

    // Platform owners and super admins bypass the review queue — their properties publish instantly
    const isPlatformOwner =
      actor.roles?.includes("PLATFORM_OWNER") ||
      actor.roles?.includes("SUPER_ADMIN") ||
      actor.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com";

    const initialStatus = isPlatformOwner ? "PUBLISHED" : "DRAFT";
    const initialStatusReason = isPlatformOwner ? "Auto-published by platform owner" : "Listing created";

    await connectDB();
    const property = new Property({
      tenantId: organizationAccess?.organization?._id,
      owner: [actor.id],
      name,
      type,
      description,
      listingPurpose: normalizePurpose(formData.get("listingPurpose")),
      listingCategory: normalizeCategory(formData.get("listingCategory"), type),
      listingStatus: initialStatus,
      publishedAt: isPlatformOwner ? new Date() : undefined,
      location: resolvedLocation,
      beds: numbers.beds,
      baths: numbers.baths,
      square_feet: numbers.square_feet,
      amenities: formData.getAll("amenities[]").map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 100),
      rates: {
        nightly: numbers.nightly,
        weekly: numbers.weekly,
        monthly: numbers.monthly,
      },
      pricing: {
        salePrice: numbers.salePrice,
        monthlyRent: numbers.monthlyRent,
      },
      currency: validCurrency(formData.get("currency")),
      seller_info: {
        name: cleanText(formData.get("seller_info[name]"), 100, actor.name),
        email: cleanText(formData.get("seller_info[email]"), 254, actor.email).toLowerCase(),
        phone: cleanText(formData.get("seller_info[phone]"), 30),
      },
      images: uploaded.map((item) => item.url),
      media: uploaded.map((item, index) => ({
        type: "IMAGE",
        url: item.url,
        publicId: item.publicId,
        order: index,
        isCover: index === 0,
      })),
      statusHistory: [{ status: initialStatus, changedBy: actor.id, reason: initialStatusReason }],
    });
    property.completenessScore = calculateListingCompleteness(property).score;
    await property.save();

    if (!actor.roles.includes("PROPERTY_OWNER")) {
      await User.updateOne({ _id: actor.id }, { $addToSet: { roles: "PROPERTY_OWNER" } });
    }

    await Promise.all([
      recordListingVersion(property, actor.id, "CREATED"),
      publishDomainEvent({ type: "listing.created", aggregateType: "Property", aggregateId: property._id, tenantId: property.tenantId, eventId: `listing.created:${property._id}`, payload: { propertyId: property._id.toString(), reference: property.listingReference, status: property.listingStatus } }),
      writeAuditLog({
        actor,
        action: "listing.create",
        targetType: "Property",
        targetId: property._id,
        tenantId: organizationAccess?.organization?._id,
        metadata: { reference: property.listingReference, status: property.listingStatus, organizationId: organizationId || null },
        request,
      }),
    ]);

    return apiSuccess(
      {
        propertyId: property._id.toString(),
        reference: property.listingReference,
        status: property.listingStatus,
        completenessScore: property.completenessScore,
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedPublicIds.length) {
      await Promise.allSettled(uploadedPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
    }
    return handleApiError(error, "properties.create");
  }
}
