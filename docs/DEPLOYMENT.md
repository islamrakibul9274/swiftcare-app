# Deployment and data stewardship

## Before updating the existing Vercel deployment

1. Back up the database using the clinic's approved process and verify restore access.
2. Review the baseline audit and the legacy mapping with the clinic administrator. A display name is not sufficient evidence that records belong to the same clinic.
3. Keep the rollout isolated until every user/client/note relationship is verified. The new server policy blocks unmapped access. Existing production data has not been migrated by this development task.
4. Use the migration dry run. It disables Mongoose automatic collection/index creation and performs no writes. The explicit apply mode creates collections, applies verified mappings in a transaction, records a metadata-only migration event, and adds indexes.
5. Resolve case-normalized email collisions manually before applying. The script refuses to guess which account owns an address. Historical duplicate claims are reported and preserved; resolve them through the clinic's financial reconciliation process.
6. Mapped staff must sign in again and change their passwords. This also addresses the original public role-selection exposure; administrators should verify all existing privileged accounts independently.
7. In Vercel, set the exact deployment `AUTH_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `MONGODB_URI`, and optional provider variables. Preview environments need their own database, secrets, origin and verified demo/staging users.
8. Keep `SWIFTCARE_DEMO=false` and omit `BOOTSTRAP_PASSWORD` in deployed runtime environments after initial provisioning.
9. Build and verify the preview before any production rollout. The October 18 release uses `feat/swiftcare-platform` and a separate synthetic preview database; production remains unchanged by explicit user choice.

## Isolated hosted preview

The hosted preview uses the `swiftcare_preview_20261018` database on the existing Atlas cluster, with synthetic demo records only. Production records are never copied. Vercel environment overrides are scoped to the `feat/swiftcare-platform` preview branch: `MONGODB_URI`, a separate `AUTH_SECRET`, the preview `AUTH_URL`, `AUTH_TRUST_HOST=true`, and `SWIFTCARE_DEMO=true`. `MONGOMS_DISABLE_POSTINSTALL=1` avoids downloading the local test database binary during cloud builds. Production environment variables are unchanged.

To prepare another explicitly named, empty preview database from configured Atlas connectivity:

```bash
# Read-only emptiness and target validation
npx tsx scripts/seed-preview.ts --database=swiftcare_preview_your_unique_name
# Writes synthetic data only to that separate empty database
npx tsx scripts/seed-preview.ts --database=swiftcare_preview_your_unique_name --apply
```

The seed refuses an existing collection, the source database, or a database without the `swiftcare_preview_` prefix. It has no reset/delete behavior. Local demo seeding still requires a loopback `swiftcare_demo` database. Preview changes persist until its database is separately retired; unlike local demos, they do not reset when a process exits. Restrict preview access and never enter real patient information.

## Environment and vendor setup

- MongoDB must support transactions (Atlas / replica set). Give the app only the permissions its collections need. Configure network access, encrypted transport, backups, retention and operational monitoring separately.
- `AUTH_SECRET` must be a high-entropy secret. Rotating it signs out all sessions. Auth is database-rechecked for every API/page data operation; the JWT proxy is an optimistic navigation check only.
- Session records expire absolutely after 8 hours. The server enforces a 15-minute inactivity limit; activity heartbeats are throttled to once per minute. Public auth attempts have account/IP rate buckets with TTL cleanup.
- `RESEND_API_KEY` and `MAIL_FROM` enable email delivery. Verify the sender domain in the provider. Password reset returns the same public message for unknown accounts or unavailable delivery. Admins can issue a secure manual link if delivery is not configured.
- `GROQ_MODEL` defaults to `openai/gpt-oss-20b` after the original Llama model's developer-tier retirement. Review model availability and prompts as providers change. API timeout is 25 seconds with no automatic retries; failure preserves the manual documentation path.
- Set a random `CRON_SECRET` to enable the daily reminder route. `vercel.json` schedules `/api/cron/reminders` at 03:00 UTC. Vercel supplies `Authorization: Bearer <CRON_SECRET>`; the endpoint uses a constant-time digest comparison. Manual Admin checks work without cron configuration. Reminders are deduplicated for the 30-day, 7-day, and expired windows.

References: [Vercel cron authorization](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Groq retirement history](https://console.groq.com/docs/deprecations).

## Additive indexes

The migration creates the schema-declared indexes without dropping existing ones. Do not run `syncIndexes()` against production without a separate reviewed change.

- Users: unique email; clinic/role/active.
- Clients: clinic/assigned BCBA and clinic/assigned RBT.
- Sessions: clinic/technician/date; clinic/client/date; partial unique clinic/technician for `IN_PROGRESS` sessions.
- Notes: clinic/client/date; clinic/author/status; partial unique `sourceKey` for new session-linked notes.
- Claims: clinic/status/service date; partial unique `sourceKey` for new note-linked drafts.
- Audit events: clinic/creation date.
- Account tokens, login sessions, rate buckets: expiry TTL indexes. Expiry is also checked in queries; TTL deletion timing is not relied upon for authorization.
- Notifications: clinic/user/creation date and partial unique reminder `sourceKey`.
- Supervision: clinic/supervisor/date.

The old `Note.rbtId` string relationship is retained. New records add `clientId`, `sessionId`, and `clinicId`. New draft billing values never rewrite historical claim amounts. No records are deleted by migration.

## Healthcare and privacy review

Qualified clinical, privacy, security, and legal owners should review the intended deployment before real patient data is used. In particular:

- Establish organizational policies, workforce access reviews, incident response, retention and deletion rules, patient access processes, consent and permitted disclosures.
- Review vendor terms and any required agreements, including hosting, database, email and AI providers. Data minimization does not by itself establish permission to use a provider.
- Confirm treatment definitions, mastery criteria, time/unit calculation and payer documentation rules with clinical and billing owners. Charts describe observations; they do not diagnose, infer medical necessity or determine mastery automatically.
- Configure MFA/SSO or another stronger identity layer where required. The current application uses email/password credentials plus session revocation; MFA is not implemented.
- Audit events exclude clinical bodies and credentials. Application users cannot edit/delete them, but database administrators still can. Add external tamper-evident storage, retention policies and monitoring for production assurance.
- Review CSP hardening with per-request nonces if required. Current CSP blocks framing and restricts sources, but permits inline application scripts/styles required by the present Next.js rendering setup.
- The application uses server-backed draft persistence. Durable offline PHI storage and cross-device conflict merging are not implemented.
- Review exports and shared-device practices. CSV exports are formula-safe; users remain responsible for approved storage and sharing of exported clinical information.

## Rollback

Keep the previous deployment and database backup available. Code rollback does not require deleting new optional fields or collections. Reassess the previous version's public registration, unscoped data access, and duplicate-claim bugs before restoring it. Never re-enable vulnerable access solely to avoid completing verified mappings.

Primary healthcare guidance for qualified reviewers: [HHS cloud-computing guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html), [HHS business-associate guidance](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html). Applicability and agreements require review for the actual organization and vendors.

Local verification uses Asia/Dhaka, matching this device. Scheduling currently follows the device timezone. Validate server/client timezone alignment in the actual preview deployment; practices with staff in multiple timezones should add an explicit clinic-timezone policy before rollout. Local lab measurements are not field Core Web Vitals or an accessibility/compliance certification.
