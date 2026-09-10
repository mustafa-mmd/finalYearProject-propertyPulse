export const ADMIN_NAV_ITEMS = Object.freeze([
  { label: "Overview", href: "/admin", group: "Workspace", permissions: ["properties.review", "users.read", "payments.read", "support.manage", "reports.review", "feature_flags.manage", "risk_rules.manage", "organizations.read", "subscriptions.manage", "audit_logs.read", "system_errors.read"] },
  { label: "Verification queue", href: "/admin/verifications", group: "Marketplace", permissions: ["verifications.read"] },
  { label: "Listings", href: "/admin/listings", group: "Marketplace", permissions: ["properties.review"] },
  { label: "Users", href: "/admin/users", group: "Marketplace", permissions: ["users.read"] },
  { label: "Organizations", href: "/admin/organizations", group: "Marketplace", permissions: ["organizations.read"] },
  { label: "Payments", href: "/admin/payments", group: "Commerce", permissions: ["payments.read"] },
  { label: "Subscriptions", href: "/admin/subscriptions", group: "Commerce", permissions: ["subscriptions.manage", "payments.read"] },
  { label: "Trust reports", href: "/admin/reports", group: "Risk & support", permissions: ["reports.review"] },
  { label: "Fraud cases", href: "/admin/fraud-cases", group: "Risk & support", permissions: ["risk_rules.manage"] },
  { label: "Support", href: "/admin/support", group: "Risk & support", permissions: ["support.manage"] },
  { label: "Feature flags", href: "/admin/feature-flags", group: "Platform", permissions: ["feature_flags.manage"] },
  { label: "Audit logs", href: "/admin/audit-logs", group: "Platform", permissions: ["audit_logs.read"] },
  { label: "System errors", href: "/admin/errors", group: "Platform", permissions: ["system_errors.read"] },
]);

export const ADMIN_ACCESS_PERMISSIONS = Object.freeze([
  ...new Set(ADMIN_NAV_ITEMS.flatMap((item) => item.permissions)),
]);

export function visibleAdminItems(permissions = []) {
  const allowed = new Set(permissions);
  return ADMIN_NAV_ITEMS.filter((item) =>
    item.permissions.some((permission) => allowed.has(permission)),
  );
}

export function canAccessAdmin(permissions = []) {
  return permissions.some((permission) =>
    ADMIN_ACCESS_PERMISSIONS.includes(permission),
  );
}
