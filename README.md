# SwiftCare

A Next.js 16 workspace for ABA care teams: session observations, clinician-reviewed documentation, treatment goals, scheduling, staff access, and an internal billing ledger.

The interface uses a **white canvas, neutral sidebar, dark typography, and monochrome controls**. Light mode is the default. Optional system/dark appearance is available in Settings. No green or purple brand palette is used.

## Run the isolated demo

```bash
nvm use
npm ci
npx playwright install chromium
npm run dev:demo
```

Open **http://localhost:3000**.

The launcher starts a separate local MongoDB replica set, seeds synthetic records, and overrides the production database settings **only in the child process**. It does not edit `.env.local`. The first launch downloads an official MongoDB binary. Demo data is ephemeral and resets when the launcher stops.

| Role  | Email                          | Demo password        |
| ----- | ------------------------------ | -------------------- |
| RBT   | `rbt@demo.swiftcare.example`   | `SwiftCareDemo2026!` |
| BCBA  | `bcba@demo.swiftcare.example`  | `SwiftCareDemo2026!` |
| Admin | `admin@demo.swiftcare.example` | `SwiftCareDemo2026!` |

These are intentionally public synthetic demo credentials, valid only in the isolated local or hosted preview database. Never create these accounts in a real production database. The interface visibly labels the demo. No real patient records are included.

`DEMO_PORT=3001 npm run demo:production` runs the same isolated demo against a completed production build on another port. `.local/demo-runtime-<port>.json` contains only the loopback test database address and process ID; it is ignored by Git.

## Features

- Separate RBT, BCBA, and Admin workspaces with database-enforced clinic and assignment boundaries.
- RBT session start/end, elapsed timer, frequency counters, duration timers, interval observations, ABC entries, ordered autosave, and revision-conflict protection.
- Server-saved note drafts, manual documentation, SOAP/session AI drafts, tone/length controls, original-versus-edited draft, author attestation, and BCBA approval or revision comments.
- Single and bulk note review. Approved records are locked; approval creates one **draft** billing record per note.
- Client profiles, goals, aim values, mastery criteria, phase dates, session timelines, and authorization-hour tracking.
- Client/target-specific charts with date windows, prior-session comparison, aim/phase lines, PNG/SVG export, and browser Print / Save as PDF.
- Day/week scheduling with transactional conflict checks for clients and technicians.
- Staff invitations, one-time password setup/reset links, immediate server-side access revocation, roles, credential expiry, and reminders.
- Internal claim pipeline: draft → submitted → paid/denied; search, sorting, pagination, aging totals, payer references, and CSV export.
- Supervision observations, optional observed-session relationships, hours, and a descriptive recorded-hour ratio.
- Role-scoped global search and Cmd/Ctrl+K navigation, notifications, profile/password preferences, and optional appearance modes.
- Metadata-only sensitive-access/admin audit viewer. Credentials and clinical note bodies are excluded from logs.
- Loading skeletons, retry boundaries, empty/error feedback, keyboard-accessible dialogs, reduced motion, and responsive layouts.

**Billing scope:** this is an internal ledger. It does not transmit claims to payers, collect payments, validate coverage, or determine billability. Default units use completed 15-minute periods; an administrator must review the coding and charge against applicable payer requirements before recording a submission.

## Configure a development database

Copy `.env.example` to `.env.local` and supply your own values. `npm run dev` uses that configured database directly. A database copied from production must not be used as a test fixture.

| Variable                      | Purpose                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `MONGODB_URI`                 | MongoDB connection; transactions require Atlas or another replica set             |
| `AUTH_SECRET`                 | Auth.js encryption/signing secret; generate with `openssl rand -base64 32`        |
| `AUTH_URL`                    | Exact application origin for the current deployment, e.g. `http://localhost:3000` |
| `AUTH_TRUST_HOST`             | `true` when running behind the trusted deployment proxy                           |
| `GROQ_API_KEY`                | Enables optional AI drafting; manual note submission works without it             |
| `GROQ_MODEL`                  | Defaults to `openai/gpt-oss-20b`; choose a supported Groq model                   |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional invitation/reset email delivery from your verified sender                |
| `CRON_SECRET`                 | Optional random bearer secret for scheduled credential reminders                  |
| `BOOTSTRAP_PASSWORD`          | Only the explicitly invoked first-Admin setup script                              |
| `SWIFTCARE_DEMO`              | Set automatically by the isolated launcher; keep false in real deployments        |
| `DEMO_PORT`                   | Optional local demo port, default 3000                                            |

All environment files containing values are ignored. `.env.example` contains descriptions and empty secrets only. There are no `NEXT_PUBLIC_` secrets.

Groq retired `llama-3.1-8b-instant` for free/developer accounts on August 16, 2026. The new default follows its [documented replacement](https://console.groq.com/docs/deprecations). Requests include numeric observations and anonymous `Target N` labels only: no names, dates of birth, client IDs, ABC text, or authored note text. Generated output is assistive and requires author review plus the assigned BCBA's final approval.

## First administrator and legacy records

Public staff registration is disabled. A verified Admin provisions staff using invitations. Password-setup links are stored as SHA-256 digests, expire after 24 hours for invitations / 30 minutes for resets, and work once. Without email delivery, an Admin can copy a fresh secure link for approved manual delivery. Public reset responses do not reveal whether an account exists.

For a **new clinic**, set `MONGODB_URI` and `BOOTSTRAP_PASSWORD` in the process environment, then run:

```bash
npm run bootstrap:admin -- --apply --name="Clinic Administrator" --email="admin@yourclinic.example" --clinic-id="verified-clinic-id" --clinic-name="Your clinic"
```

The script refuses to create a second initial Admin for an already provisioned clinic. It requires a password change on first sign-in. Never place an actual password in command arguments or Git.

For **existing production data**, read [the migration instructions](docs/DEPLOYMENT.md) before deployment. Old records lack trustworthy clinic/client relationships. The application denies access to unmapped accounts and records rather than guessing ownership from clinic names or client display names. Password hashes and legacy fields are preserved. No migration has been applied to the connected production database.

```bash
# Read-only counts; no index or data writes
npm run migrate:legacy

# Validate an explicitly reviewed mapping; still no writes
npm run migrate:legacy -- --mapping=/secure/path/verified-mapping.json

# Apply only after verifying the database and the mapping
npm run migrate:legacy -- --mapping=/secure/path/verified-mapping.json --apply --actor=VERIFIED_ADMIN_OBJECT_ID
```

See [the example mapping](docs/legacy-mapping.example.json). It contains example IDs only. Unmapped records and historical duplicate claims remain intact and require review. Applying a verified mapping invalidates prior sessions and requires mapped users to change passwords.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:e2e
npm run format:check
npm audit --omit=dev
```

Playwright starts or reuses **only a synthetic demo**; fixtures verify its banner before performing mutations. Use a fresh demo process for a complete test run, because tests intentionally change demo records and exercise rate limits. The suite covers authorization denial, invalid origins/IDs/JSON, invitation replay, session expiry, concurrent bookings, note approval idempotency, role logins, autosave/reload, edited AI drafts, manual fallback, clinician review, and a billing action. Responsive checks visit all workspace routes at 375, 768, and 1440 pixels in light and dark modes, with automated accessibility checks on representative pages.

AI UI tests use clearly identified deterministic fixtures. Live-provider results are reported separately; tests do not fabricate a successful Groq response. Browser Print / PDF uses the browser's PDF destination rather than a separate PDF dependency.

Results and remaining constraints: [verification report](docs/VERIFICATION.md). Baseline issues and route map: [audit](docs/AUDIT.md). Phase-by-phase changes: [implementation notes](docs/IMPLEMENTATION.md).

## Architecture

- `app/`: server-rendered role pages, route boundaries, thin validated API handlers, public/auth pages.
- `components/workspace/`: shared shell and feature screens; charts and feature modules load separately.
- `components/ui/`: buttons, badges, tables, dialogs, toasts, skeletons and empty states.
- `lib/security.ts`, `policy.ts`: authoritative actors, client access filters, expiry and redirect rules.
- `lib/clinical.ts`: transactional clinical review and idempotent billing-draft creation.
- `lib/api.ts`, `validation.ts`: origin checks, bounded JSON bodies, typed schemas and safe error responses.
- `models/`: typed additive schemas, relationship/query indexes, audit/token/session/rate-limit storage.
- `scripts/`: guarded synthetic seed/launcher, verified mapping migration, initial Admin setup.
- `tests/`: pure policy/validation/privacy utilities and browser/API workflows.

## Operational limits

Workspace snapshots are bounded to the most recent 250 records per collection (100 supervision observations, 50 notifications). A visible notice appears at the limit; this is not a complete historical reporting system. Large practices should add server-side historical pagination and dedicated reporting queries.

Autosave is server-backed and serialized with revision checks. When disconnected, unsaved changes remain in the **open tab only**. Keep it open and retry before leaving. Durable offline PHI storage, background synchronization, a guardian portal, external calendar integration, and assistive AI progress summaries are deferred.

Deployment and healthcare/privacy review requirements are described in [deployment notes](docs/DEPLOYMENT.md). Software controls alone do not establish HIPAA compliance.
