import { ORGANIZATION_ROLES, ORGANIZATION_TYPES } from "@/config/organizations";

export function cleanText(value, max = 200) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export function cleanEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function cleanOrganizationType(value) {
  return ORGANIZATION_TYPES.includes(value) ? value : "LANDLORD_BUSINESS";
}

export function cleanOrganizationRoles(value) {
  const roles = Array.isArray(value) ? value : [];
  const allowed = [...new Set(roles.filter((role) => ORGANIZATION_ROLES.includes(role) && role !== "OWNER"))];
  return allowed.length ? allowed : ["VIEWER"];
}

export function slugifyOrganization(value) {
  return cleanText(value, 120)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}
