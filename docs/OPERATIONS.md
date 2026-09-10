# Operations runbook

## Deployment gates

1. Run environment validation.
2. Back up MongoDB and run the commercial migration in dry-run mode.
3. Apply migrations once, then run all tests and a production build.
4. Configure provider webhook URLs over public HTTPS.
5. Schedule the verification and outbox jobs with `Authorization: Bearer <CRON_SECRET>`.
6. Verify indexes were created, especially booking night uniqueness and webhook idempotency.

## Incident controls

- Disable risky functionality with feature flags or suspend the affected listing/account.
- Never edit audit logs or ledger entries; create compensating records.
- Failed outbox events retry with exponential backoff and stop in `DEAD_LETTER` after eight attempts.
- Booking locks in `HELD` expire after 48 hours. Confirmed locks have no expiry.
- Rotate a compromised provider credential and redeploy; never place it in client code unless it is explicitly a restricted browser key.

## Privacy and retention

Store only required personal data, use the audit IP hash salt, keep provider secrets server-side, and define jurisdiction-specific retention/deletion periods before production. Analytics events use a TTL expiry. Legal consent text and policy versions must be supplied by qualified counsel for launch jurisdictions.
