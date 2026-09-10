# Roadmap implementation status

This is the live implementation ledger for `roadmap.txt`. A phase is marked complete only when its repository-deliverable data model, authorization, API, user interface, audit behavior and automated coverage are present. Provider credentials, regulated services and jurisdiction-specific legal approval are tracked separately and will be documented only after the repository work is complete.

Last updated: 2026-08-09

## Status summary

| Phase | Status | Completed foundation | Repository work still in progress |
| --- | --- | --- | --- |
| 0 - Audit and stabilization | Mostly implemented | Google and verified local authentication, passwordless links, recovery, encrypted TOTP MFA/recovery codes, MFA-gated privileged actions, revocable sessions, login alerts, brute-force locks, RBAC, verified PayFast callbacks, idempotency, rate limits, audit/error controls, account export/deletion and deterministic security tests | Broader integration, authorization, tenant-isolation, upload, accessibility, performance, backup and recovery test evidence |
| 1 - Commercial marketplace MVP | Mostly implemented | Buy/rent purposes, listing lifecycle, verification queue, Gemini evidence, structured media, advanced field/geospatial search, saved searches/alerts, comparison, recently viewed history, CSV import/bulk lifecycle actions, viewings, subscriptions, owner analytics, secure location/map flow and server-owned payment pricing | Custom favorite-folder UI, map drawing/bounds UI and complete listing media/document experiences |
| 2 - Multi-tenant SaaS | Mostly implemented | Organizations, agencies, memberships, invitations, roles, branches, quotas, tenant billing, dashboards, portfolio isolation and tenant audit logs | Custom tenant roles/permissions, branding/domains, richer tenant settings and plan/feature overrides, shared team communications and exports |
| 3 - Rentals and property management | Mostly implemented | Availability, concurrency-safe bookings, applications, leases, recurring invoices, portals, maintenance, buildings/units, vendors/work orders, expenses, inspections and reports | Booking modification/dispute/refund operations, electronic signatures, statements, utilities/assets, vendor portal and configurable approval workflows |
| 4 - Property sales marketplace | Mostly implemented | Offers/counteroffers, viewings, reservations, finance-confirmed deposits, sale milestones, commissions and participant documents | Open-house and inquiry workflows, richer buyer/seller timelines, mortgage/proof-of-funds review UX, and operational dispute/cancellation handling; regulated execution remains external |
| 5 - AI, mobile and international | Partial | Human-reviewed fraud cases, recommendations, lead scoring, document extraction, feature flags, PWA, locale dictionaries/RTL wiring, preferences, an Expo client foundation, scoped enterprise APIs and signed webhooks | Full translated product surface, country configuration/rules, complete native workflows, enterprise SSO/SCIM/export/branding, accessibility/performance certification and production AI operations |

## Completed cross-cutting controls

- Next.js 16.3 with the Node proxy convention and clean Turbopack production build.
- Database-backed actor resolution and permission checks for platform and organization roles.
- Protected `PLATFORM_OWNER` assignment through server configuration only.
- Public property queries restricted to publishable records.
- Structured global locations, saved coordinates and legacy text-location compatibility.
- Server-owned PayFast prices, verified callbacks and idempotent webhook records.
- Unique booking-night locks and immutable offer counter chains.
- Private document download authorization and short-lived signed delivery.
- AI outputs remain advisory and never automatically publish, reject, suspend or ban.
- Clean ESLint run, deterministic test suites and `npm audit` with zero vulnerabilities.

## Implementation progress log

- 2026-08-09: Reopened the roadmap after distinguishing domain foundations from complete operational workflows.
- 2026-08-09: Upgraded to Next.js 16.3, migrated middleware to proxy, restored a clean lint command, and removed all dependency vulnerabilities.
- 2026-08-09: Fixed NextAuth module interop, lead-score owner authorization, sale readiness transitions, finance-only deposit confirmation and licensed-conveyancer closing references.
- 2026-08-09: Completed Phase 0 operational error capture, client error ingestion, global error handling and the protected administrator error-triage console.
- 2026-08-09: Completed Phase 1 structured media upload/order/caption/cover workflows and the owner-facing media manager.
- 2026-08-09: Completed Phase 2 member/branch lifecycle controls, tenant dashboard and tenant audit-log interface.
- 2026-08-09: Completed Phase 3 availability, tenant-aware maintenance transitions, buildings, units, vendors, work orders, expenses, inspections, and portfolio reporting; lint, domain tests and the production build pass.
- 2026-08-09: Completed Phase 4 offer/counteroffer controls, participant document collaboration, finance-confirmed reservation evidence, sale milestone operations, commission management and licensed-conveyancer closure; lint, tests and production build pass.
- 2026-08-09: Completed Phase 5 six-locale/RTL delivery, offline/installable PWA, standalone native client and secure device authorization, scoped enterprise APIs, one-time hashed keys, signed retrying webhooks, and advanced AI/risk integrations. Added deterministic i18n, native and enterprise security tests.
- 2026-08-09: Corrected the inaccurate all-complete claim and introduced an acceptance-criteria backlog in `REMAINING_WORK.md`.
- 2026-08-09: Added verified password and magic-link authentication, recovery, encrypted TOTP MFA, recovery codes, session revocation, privileged MFA enforcement, login events, export and delayed deletion.
- 2026-08-09: Added saved searches/alerts, comparisons, recently viewed history, radius/bounds/polygon filtering, CSV dry-run/import and authorized bulk listing lifecycle actions.
- 2026-08-09: Added operational refunds, payouts, disputes and reconciliation plus conversation threads, participants, read receipts, reporting and live SSE updates.

## Current repository state

The repository has strong domain foundations across all six phases, but completion is still in progress. [`REMAINING_WORK.md`](REMAINING_WORK.md) is the authoritative gap ledger. External accounts, secrets, native app-store release, production infrastructure, provider acceptance and licensed legal/financial decisions remain intentionally separated in [`MANUAL_SETUP.md`](MANUAL_SETUP.md).

This file must be updated whenever a remaining workflow is implemented or a phase status changes.
