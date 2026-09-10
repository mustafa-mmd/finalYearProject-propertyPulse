export const ACCOUNT_STATUSES = Object.freeze([
  "ACTIVE",
  "SUSPENDED",
  "BANNED",
  "DELETED",
]);

export const ROLES = Object.freeze([
  "USER",
  "RENTER",
  "BUYER",
  "TENANT",
  "PROPERTY_OWNER",
  "LANDLORD",
  "AGENT",
  "AGENCY_OWNER",
  "AGENCY_ADMIN",
  "AGENCY_STAFF",
  "PROPERTY_MANAGER",
  "MAINTENANCE_WORKER",
  "VENDOR",
  "ACCOUNTANT",
  "SUPPORT_ADMIN",
  "LISTING_MODERATOR",
  "VERIFICATION_ADMIN",
  "FRAUD_ANALYST",
  "FINANCE_ADMIN",
  "SUBSCRIPTION_ADMIN",
  "CONTENT_ADMIN",
  "TECHNICAL_OPERATIONS_ADMIN",
  "SUPER_ADMIN",
  "PLATFORM_OWNER",
]);

export const PERMISSIONS = Object.freeze([
  "profile.read",
  "profile.update",
  "properties.create",
  "properties.read_own",
  "properties.update_own",
  "properties.delete_own",
  "properties.submit",
  "properties.read",
  "properties.review",
  "properties.approve",
  "properties.reject",
  "properties.suspend",
  "properties.delete",
  "verifications.read",
  "verifications.review",
  "verifications.approve",
  "verifications.reject",
  "bookings.create",
  "bookings.read_own",
  "bookings.manage",
  "applications.create",
  "applications.read_own",
  "applications.manage",
  "offers.create",
  "offers.read_own",
  "offers.manage",
  "maintenance.create",
  "maintenance.read_own",
  "maintenance.manage",
  "messages.create",
  "messages.read_own",
  "organizations.create",
  "organizations.read",
  "organizations.manage",
  "users.read",
  "users.update",
  "users.suspend",
  "users.ban",
  "users.delete",
  "payments.read",
  "refunds.review",
  "refunds.approve",
  "payouts.review",
  "subscriptions.manage",
  "reports.review",
  "disputes.manage",
  "support.manage",
  "admins.manage",
  "settings.manage",
  "feature_flags.manage",
  "audit_logs.read",
  "risk_rules.manage",
  "analytics.read_platform",
  "system_errors.read",
  "system_errors.manage",
]);

const CUSTOMER_PERMISSIONS = [
  "profile.read",
  "profile.update",
  "bookings.create",
  "bookings.read_own",
  "applications.create",
  "applications.read_own",
  "offers.create",
  "offers.read_own",
  "maintenance.create",
  "maintenance.read_own",
  "messages.create",
  "messages.read_own",
];

const OWNER_PERMISSIONS = [
  ...CUSTOMER_PERMISSIONS,
  "properties.create",
  "properties.read_own",
  "properties.update_own",
  "properties.delete_own",
  "properties.submit",
  "bookings.manage",
  "applications.manage",
  "offers.manage",
  "maintenance.manage",
];

export const ROLE_PERMISSIONS = Object.freeze({
  USER: CUSTOMER_PERMISSIONS,
  RENTER: CUSTOMER_PERMISSIONS,
  BUYER: CUSTOMER_PERMISSIONS,
  TENANT: CUSTOMER_PERMISSIONS,
  PROPERTY_OWNER: OWNER_PERMISSIONS,
  LANDLORD: OWNER_PERMISSIONS,
  AGENT: OWNER_PERMISSIONS,
  AGENCY_OWNER: [...OWNER_PERMISSIONS, "organizations.create", "organizations.read", "organizations.manage"],
  AGENCY_ADMIN: [...OWNER_PERMISSIONS, "organizations.read", "organizations.manage"],
  AGENCY_STAFF: [...OWNER_PERMISSIONS, "organizations.read"],
  PROPERTY_MANAGER: [...OWNER_PERMISSIONS, "organizations.read"],
  MAINTENANCE_WORKER: ["profile.read", "profile.update", "maintenance.read_own", "maintenance.manage"],
  VENDOR: ["profile.read", "profile.update", "maintenance.read_own", "maintenance.manage"],
  ACCOUNTANT: ["profile.read", "payments.read", "payouts.review"],
  SUPPORT_ADMIN: ["profile.read", "users.read", "properties.read", "support.manage", "reports.review"],
  LISTING_MODERATOR: ["profile.read", "properties.read", "properties.review", "properties.approve", "properties.reject", "properties.suspend"],
  VERIFICATION_ADMIN: ["profile.read", "properties.read", "properties.review", "verifications.read", "verifications.review", "verifications.approve", "verifications.reject"],
  FRAUD_ANALYST: ["profile.read", "users.read", "properties.read", "verifications.read", "reports.review", "risk_rules.manage"],
  FINANCE_ADMIN: ["profile.read", "payments.read", "refunds.review", "refunds.approve", "payouts.review", "disputes.manage"],
  SUBSCRIPTION_ADMIN: ["profile.read", "subscriptions.manage", "payments.read"],
  CONTENT_ADMIN: ["profile.read", "settings.manage"],
  TECHNICAL_OPERATIONS_ADMIN: ["profile.read", "feature_flags.manage", "audit_logs.read", "analytics.read_platform", "system_errors.read", "system_errors.manage"],
  SUPER_ADMIN: PERMISSIONS.filter((permission) => permission !== "admins.manage"),
  PLATFORM_OWNER: PERMISSIONS,
});

export function permissionsForRoles(roles = []) {
  const permissions = new Set();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] || []) permissions.add(permission);
  }
  return [...permissions].sort();
}

export function hasPermission(roles, permission) {
  return permissionsForRoles(roles).includes(permission);
}

export function configuredPlatformOwnerEmails() {
  const set = new Set(
    (process.env.PLATFORM_OWNER_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
  set.add("mustafajamalshabqadar@gmail.com");
  return set;
}
