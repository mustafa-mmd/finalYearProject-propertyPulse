# Remaining repository work

This ledger converts the broad recommendations in `roadmap.txt` into verifiable repository deliverables. A checkbox is closed only when the model, authorization, API or server action, operational UI, audit behavior, migration compatibility and relevant automated coverage exist. Items explicitly described as future-stage choices in the roadmap are not required for the commercial modular-monolith launch.

Last audited: 2026-08-09

## Phase 0 - Audit and stabilization

- [x] Add verified email/password registration and login without weakening Google OAuth.
- [x] Add passwordless email links, email verification and secure account recovery.
- [x] Add TOTP MFA, recovery codes, recent-auth checks and mandatory protection for privileged users.
- [x] Add revocable session/device records, login alerts, brute-force controls and suspicious-login signals.
- [ ] Expand automated integration, authorization, tenant-isolation, upload, accessibility, performance and recovery coverage.

## Phase 1 - Commercial marketplace MVP

- [x] Add comparison lists and 90-day recently viewed properties.
- [ ] Add user-facing custom favorite collection/folder management on top of the collection API.
- [x] Add saved searches plus scheduled new-listing and price-change alerts.
- [x] Add server-side radius, map-boundary and polygon-capable geospatial filtering plus “search near me”.
- [ ] Add visible map-boundary and draw-a-polygon controls to the search-results interface.
- [x] Add validated CSV import, dry-run reporting and authorized bulk listing lifecycle edits.
- [ ] Complete richer property-detail conversion modules and professional downloadable/virtual media paths.

## Phase 2 - Multi-tenant SaaS

- [ ] Add tenant-defined roles/permissions within a safe platform permission ceiling.
- [ ] Add organization branding, settings, feature overrides, custom-domain verification records and exports.
- [ ] Add shared team inbox ownership, assignment and internal notes.

## Phase 3 - Advanced rentals and property management

- [ ] Add booking modification, cancellation, dispute and refund-request workflows.
- [ ] Add lease template/signature-provider workflow and jurisdiction warnings.
- [ ] Add owner/tenant statements, utilities, asset inventory and configurable approvals.
- [ ] Complete vendor portal and operational staff-assignment interfaces.

## Phase 4 - Property sales marketplace

- [ ] Add open-house scheduling and dedicated buyer-inquiry workflow.
- [ ] Add document review states for proof of funds and mortgage preapproval.
- [ ] Complete participant timelines, reservation cancellation/disputes and external-provider handoff tracking.

## Phase 5 - AI, mobile and international expansion

- [ ] Translate the complete user-facing product surface and enforce locale-aware dates, numbers, currencies and units.
- [ ] Add admin-managed countries, currencies, taxes, categories, amenities, templates, provider configuration and country rules.
- [ ] Complete native mobile discovery, property detail, bookmarks, messaging, bookings, notifications and account flows.
- [ ] Add enterprise SSO/SCIM, organization export/retention controls, white-label settings and stronger API operations.
- [ ] Complete accessibility, performance, load, disaster-recovery and physical-device release evidence.

## Cross-cutting operational gaps

- [x] Implement audited refund requests/decisions, payout state transitions, payment disputes and reconciliation runs.
- [ ] Replace single-provider checkout branching with provider adapters and add payment-attempt, receipt and credit-note workflows.
- [x] Replace inbox-style messages with conversations, participants, threaded messages, read receipts, moderation controls and real-time SSE delivery.
- [ ] Add conversation attachments/audio, reactions, search, assignment, internal notes, saved replies and shared team-inbox UI.
- [ ] Add platform-owner operational pages for countries, currencies, taxes, providers, templates, CMS/legal content, jobs, API usage and system health.
- [x] Add data export/account deletion workflows and retention/anonymization jobs.

## Intentionally external or future-stage

- Payment/KYC/AML/escrow licensing, conveyancing, legal documents and jurisdiction approval require qualified providers or professionals.
- Provider accounts, DNS verification, production secrets, monitoring destinations, backups, load infrastructure and app-store submission require deployment-owner action.
- Dedicated microservices, Elasticsearch/OpenSearch, Redis/event infrastructure and global multi-region operation remain growth-stage decisions until measured scale justifies them.
- SMS, WhatsApp, phone login, Apple/Facebook login and native push delivery require third-party enrollment and credentials; repository adapters can be completed, but activation cannot.
