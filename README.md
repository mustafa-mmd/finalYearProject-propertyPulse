# PropertyPulse

PropertyPulse is a Next.js App Router PropTech marketplace and SaaS operations platform. It supports public property discovery, structured global locations, saved searches and alerts, listing verification, organization workspaces, bookings, rental applications, leases, viewings, offers, live property conversations, maintenance, subscriptions, payment/refund/dispute operations, trust and safety, and audited platform administration.

## Roadmap status

The six roadmap phases have substantial working foundations, but they are not all complete. The current evidence-based phase status and acceptance criteria live in [`docs/ROADMAP_IMPLEMENTATION.md`](docs/ROADMAP_IMPLEMENTATION.md); the exact repository backlog is tracked in [`docs/REMAINING_WORK.md`](docs/REMAINING_WORK.md). Provider, infrastructure, legal and app-store actions that cannot be completed in source code are separated in [`docs/MANUAL_SETUP.md`](docs/MANUAL_SETUP.md).

## Local development

1. Copy `.env.example` to `.env.local` and configure the required values.
2. Install dependencies with `npm install`.
3. Run `npm run check:env` and address required configuration.
4. Start the fixed-port development server with `npm run dev`.

The development server intentionally uses port 3000. Stop the existing process on that port instead of silently starting a second application on a different origin.

## Verification

```text
npm run lint
npm run test
npm run build
```

`npm run test` runs deterministic, non-browser structural/security tests. Provider connectivity is separate because it needs real credentials and network access.

The native Expo client lives in `mobile/` and has its own package definition, configuration example and validation command. The web application also provides an installable offline-fallback PWA.

## Data migration

The commercial migration is dry-run by default:

```text
npm run migrate:commercial
npm run migrate:commercial:apply
```

Review dry-run counts and take a database backup before using the apply command. Existing text-only property locations remain readable; the dedicated location migration can enrich them with coordinates.

## Architecture

- Next.js App Router modular monolith
- MongoDB/Mongoose transactional domain records
- server-side RBAC plus organization-scoped permissions
- append-only audit records and outbox events
- scoped enterprise API keys, signed webhooks, retry/backoff and dead-letter handling
- six locales (`en`, `ur`, `ar`, `fr`, `de`, `es`) with Urdu/Arabic RTL layout
- standalone Expo/React Native client with device authorization and revocable secure-storage sessions
- provider adapters for Geoapify, Cloudinary, Google authentication, Gemini and PayFast
- public reads filtered to publishable listing statuses

See `roadmap.txt` for the product specification and `docs/ROADMAP_IMPLEMENTATION.md` for verified implementation status. A roadmap phase is not marked complete merely because its database foundations exist. Secrets are never committed and all provider/admin setup is environment-controlled.
