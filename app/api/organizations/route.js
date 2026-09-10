import connectDB from "@/config/database";
import Organization from "@/models/Organization";
import OrganizationMember from "@/models/OrganizationMember";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { cleanEmail, cleanOrganizationType, cleanText, slugifyOrganization } from "@/utils/organizationValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireActor();
    await connectDB();
    const memberships = await OrganizationMember.find({ userId: actor.id, status: "ACTIVE" })
      .populate("organizationId")
      .sort({ createdAt: -1 })
      .lean();
    return apiSuccess({
      items: memberships
        .filter((entry) => entry.organizationId && !entry.organizationId.deletedAt)
        .map((entry) => ({ organization: entry.organizationId, membership: entry })),
    });
  } catch (error) {
    return handleApiError(error, "organizations.list");
  }
}

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const name = cleanText(body.name, 150);
    if (name.length < 2) return apiError("Organization name is required", { status: 422, code: "VALIDATION_ERROR" });

    await connectDB();
    const baseSlug = slugifyOrganization(body.slug || name) || "organization";
    let slug = baseSlug;
    let sequence = 1;
    while (await Organization.exists({ slug })) slug = `${baseSlug}-${++sequence}`;

    const organization = await Organization.create({
      name,
      slug,
      type: cleanOrganizationType(body.type),
      ownerId: actor.id,
      status: "PENDING_VERIFICATION",
      contact: { email: cleanEmail(body.email) || actor.email, phone: cleanText(body.phone, 30) },
      settings: {
        timezone: cleanText(body.timezone, 100) || "UTC",
        locale: cleanText(body.locale, 10) || "en",
        currency: /^[A-Z]{3}$/.test(body.currency || "") ? body.currency : "ZAR",
      },
    });
    await OrganizationMember.create({ organizationId: organization._id, userId: actor.id, roles: ["OWNER"], status: "ACTIVE" });
    await writeAuditLog({ actor, action: "organization.create", targetType: "Organization", targetId: organization._id, tenantId: organization._id, request });
    return apiSuccess({ organization }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "organizations.create");
  }
}
