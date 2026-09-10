# Manual launch checklist

This file contains only work that requires accounts, credentials, regulated providers, infrastructure access, physical devices, or licensed professional decisions and therefore cannot be completed safely in source code. Repository gaps remain tracked separately in `REMAINING_WORK.md`.

## 1. Core production environment

- Provision the production MongoDB deployment, create a least-privilege database user, set `MONGO_URI`, enable backups, and test a restore.
- Generate long random values for `NEXTAUTH_SECRET`, `AUTH_ENCRYPTION_KEY`, `AUDIT_IP_HASH_SALT`, and `CRON_SECRET` (use different values).
- Set the canonical HTTPS origin in `NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_URL_INTERNAL`.
- Put secrets in the hosting provider's encrypted environment store. Do not commit `.env.local`.

## 2. Provider credentials

- Google OAuth: create production OAuth credentials, add the production callback URL, then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Geoapify: use the same Geoapify key for `NEXT_PUBLIC_GEOAPIFY_API_KEY` and `GEOAPIFY_API_KEY` if only one key is available. Restrict the browser key by allowed production/localhost origins and monitor quota.
- Cloudinary: set `CLOUDINERY_CLOUD_NAME`, `CLOUDINERY_API_KEY`, and `CLOUDINERY_API_SECRET`; keep authenticated-document delivery enabled.
- PayFast: use production merchant credentials only after sandbox acceptance; set the public HTTPS notify URL and verify the account's callback/IP guidance.
- Gemini (optional): set `GEMINI_API_KEY` and approved model names. AI remains advisory; staff must review every high-risk result.
- Authentication email: configure `AUTH_EMAIL_DELIVERY_URL` and `AUTH_EMAIL_DELIVERY_TOKEN` for verification, magic-link, recovery and login-alert messages. Development preview links are intentionally disabled in production.
- Push/notifications (optional): generate VAPID keys and configure the email/SMS delivery adapter credentials.

## 3. Platform owner and operations

- Set `PLATFORM_OWNER_EMAILS` only to a minimal list of trusted accounts. Enable MFA for each before production administration.
- Schedule authenticated POST calls using `CRON_SECRET` to `/api/internal/jobs/verification`, `/api/internal/jobs/fraud-cases`, `/api/internal/jobs/rent-invoices`, `/api/internal/jobs/search-alerts`, `/api/internal/jobs/account-deletions`, `/api/internal/jobs/outbox`, and `/api/internal/jobs/webhooks`.
- Connect centralized logs, uptime checks, alerting, and an external error/observability destination. The in-app operational error console is already available as a fallback.

## 4. Database rollout

- Take a verified backup.
- Run `npm run migrate:commercial` and review its dry-run output.
- Run `npm run migrate:commercial:apply` only after approval.
- Run the location migration/verification only when Geoapify credentials and quota are ready.

## 5. Native mobile release

- In `mobile/`, copy `.env.example` to `.env`, set the production API URL, and run `npm install`. Dependency download could not complete in the restricted development network, but the package definition and native structural test are committed.
- Create Apple and Google developer accounts, configure Expo/EAS signing credentials, replace placeholder app identifiers/icons, build on real iOS/Android devices, and complete App Store/Play Store privacy and review forms.
- Verify deep-link/device authorization, secure token storage, logout/revocation, accessibility, slow networks, and store release builds on physical devices.

## 6. Legal, financial, and marketplace approval

- Have qualified counsel approve terms, privacy/cookie policy, fair-housing/anti-discrimination rules, rental/sales/refund policies, data retention/deletion, electronic signatures, and each launch jurisdiction.
- Use licensed KYC/AML, conveyancing, escrow/marketplace-payment, tax, and property-verification professionals where legally required. PropertyPulse must not directly hold regulated customer funds without the appropriate licensed structure.
- Confirm commission, deposit, refund, payout, and tax workflows with the payment provider/accountant before enabling them for real money.

## 7. Final release gate

- Run `npm run check:env`, `npm run lint`, `npm run test`, `npm audit`, and `npm run build` in CI.
- Complete staging browser, accessibility, payment sandbox, provider-connectivity, backup-restore, load, and physical-device tests.
- Start with a controlled beta, review fraud/verification queues daily, and keep high-risk decisions human-approved.
