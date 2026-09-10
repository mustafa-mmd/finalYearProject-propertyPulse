# Architecture and domain boundaries

PropertyPulse is implemented as a modular monolith so core transactions remain consistent while provider adapters and background jobs can later be extracted without rewriting the domain.

## Trust boundaries

- Public listing reads only return published, reserved or under-offer records (plus unmigrated legacy records until migration).
- Authenticated actors are resolved from the database on every protected request; session claims alone do not grant authorization.
- Platform roles and organization roles are separate. Organization access always resolves an active membership and scoped permissions.
- `PLATFORM_OWNER` can only be assigned through server configuration. Public/admin APIs cannot grant it.
- Listing publication and verification decisions require human-authorized roles. AI only provides structured evidence and recommendations.
- Provider webhooks are verified and idempotently recorded before state changes.

## Transactional workflows

- Listing lifecycle: draft → submission → AI evidence → manual decision → publication.
- Short stay: booking request acquires unique property/night inventory records, preventing concurrent double booking.
- Long stay: eligible application → owner decision → draft lease → signatures/activation.
- Sale: immutable offer/counteroffer lineage → atomic acceptance → sale milestones.
- Operations: tenant/owner maintenance request → triage/work order/vendor → resolution.
- Notifications: domain action → in-app notification + durable outbox event → scheduled delivery worker.

## Data ownership

Personal records have no `tenantId`. Organization-owned records carry a `tenantId` and are accessed through organization membership permissions. Platform operators use separately audited global permissions.
