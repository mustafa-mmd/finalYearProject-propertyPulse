import mongoose from "mongoose";
import Organization from "@/models/Organization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { requireOrganizationPermission } from "@/utils/tenantAuthorization";
import { cleanEmail, cleanText } from "@/utils/organizationValidation";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Organization not found", { status: 404, code: "NOT_FOUND" });
    const access = await requireOrganizationPermission(id, "organization.read");
    return apiSuccess({ organization: access.organization, membership: access.member, permissions: access.permissions });
  } catch (error) {
    return handleApiError(error, "organizations.read");
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireOrganizationPermission(id, "organization.update");
    const body = await request.json();
    const update = {};
    const name = cleanText(body.name, 150);
    if (name) update.name = name;
    if (body.contact) update.contact = { email: cleanEmail(body.contact.email), phone: cleanText(body.contact.phone, 30), website: cleanText(body.contact.website, 2000) };
    if (body.settings) {
      update.settings = {
        ...access.organization.settings,
        timezone: cleanText(body.settings.timezone, 100) || access.organization.settings?.timezone,
        locale: cleanText(body.settings.locale, 10) || access.organization.settings?.locale,
        currency: /^[A-Z]{3}$/.test(body.settings.currency || "") ? body.settings.currency : access.organization.settings?.currency,
        requireListingApproval: body.settings.requireListingApproval !== false,
        allowAgentPublishing: body.settings.allowAgentPublishing === true,
      };
    }
    const organization = await Organization.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    await writeAuditLog({ actor: access.actor, action: "organization.update", targetType: "Organization", targetId: id, tenantId: id, metadata: { fields: Object.keys(update) }, request });
    return apiSuccess({ organization });
  } catch (error) {
    return handleApiError(error, "organizations.update");
  }
}
