export const ORGANIZATION_TYPES = Object.freeze([
  "AGENCY",
  "PROPERTY_MANAGEMENT_COMPANY",
  "LANDLORD_BUSINESS",
  "DEVELOPER",
  "ENTERPRISE",
]);

export const ORGANIZATION_ROLES = Object.freeze([
  "OWNER",
  "ADMIN",
  "AGENT",
  "PROPERTY_MANAGER",
  "ACCOUNTANT",
  "MAINTENANCE_COORDINATOR",
  "STAFF",
  "VIEWER",
]);

export const ORGANIZATION_PERMISSIONS = Object.freeze([
  "organization.read",
  "organization.update",
  "members.read",
  "members.invite",
  "members.update",
  "members.remove",
  "branches.read",
  "branches.manage",
  "listings.read",
  "listings.create",
  "listings.update",
  "listings.submit",
  "leads.read",
  "leads.manage",
  "finance.read",
  "finance.manage",
  "maintenance.read",
  "maintenance.manage",
  "reports.read",
  "settings.manage",
]);

export const ORGANIZATION_ROLE_PERMISSIONS = Object.freeze({
  OWNER: ORGANIZATION_PERMISSIONS,
  ADMIN: ORGANIZATION_PERMISSIONS.filter((permission) => permission !== "settings.manage"),
  AGENT: ["organization.read", "members.read", "branches.read", "listings.read", "listings.create", "listings.update", "listings.submit", "leads.read", "leads.manage"],
  PROPERTY_MANAGER: ["organization.read", "members.read", "branches.read", "listings.read", "listings.create", "listings.update", "listings.submit", "leads.read", "leads.manage", "maintenance.read", "maintenance.manage", "reports.read"],
  ACCOUNTANT: ["organization.read", "members.read", "listings.read", "finance.read", "finance.manage", "reports.read"],
  MAINTENANCE_COORDINATOR: ["organization.read", "members.read", "branches.read", "listings.read", "maintenance.read", "maintenance.manage"],
  STAFF: ["organization.read", "members.read", "branches.read", "listings.read", "leads.read", "maintenance.read"],
  VIEWER: ["organization.read", "branches.read", "listings.read", "reports.read"],
});

export function organizationPermissions(roles = [], customPermissions = []) {
  const permissions = new Set(customPermissions);
  for (const role of roles) {
    for (const permission of ORGANIZATION_ROLE_PERMISSIONS[role] || []) permissions.add(permission);
  }
  return [...permissions].sort();
}
