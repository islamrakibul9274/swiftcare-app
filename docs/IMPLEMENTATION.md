# Implementation record

Branch: `feat/swiftcare-platform`. Original baseline: `a72ddd7`. Release target is an isolated Vercel preview. The existing production deployment and data remain unchanged by explicit user choice; verified legacy mapping is required before production cutover.

## Phase 1 — audit

**Fixed:** no code was edited before completing the baseline audit.

**Improved:** reviewed the source routes, components, actions, models, auth rules and installed framework guidance; measured install/build/lint behavior; browsed the public app and checked anonymous access.

**Added:** [AUDIT.md](AUDIT.md), including severity, affected files, route/model map, evidence, remediation and the explicit limit that no safe baseline role accounts were available.

**Checkpoint:** baseline build and TypeScript passed; lint failed with 31 errors / 7 warnings. Dependency audit reported 19 findings, including 3 critical. Authenticated verification was moved to isolated synthetic records.

## Phase 2 — authentication and security

**Fixed:** public caller-selected roles, unauthenticated AI access, global clinic reads, loose note approval permissions, missing validation, raw error logging, stale/revocable sessions, duplicate financial records, and build/lint errors.

**Improved:** authoritative database actor checks for all protected reads/mutations; clinician assignments; origin/JSON/body-size checks; generic credential/reset errors; safe role return URLs; password policy including bcrypt's UTF-8 byte bound; database-backed rate limits; security headers.

**Added:** hashed one-time invitations/reset tokens, Admin account provisioning, first-login password change, session-version revocation, absolute/idle session records, sensitive-access audit events, and guarded credential-reminder jobs. Account links use URL fragments so tokens are not included in server request URLs.

**Checkpoint:** production build and lint passed after replacing baseline unsafe types and resolving the upgraded toolchain's checks. Later browser tests exercise success and denial paths. Compatible security upgrades: Next 16.4.2, Auth.js 5.0.0-beta.32, Mongoose 9.11.2. Exact lockfile versions are authoritative.

## Phase 3 — repair existing workflows

**Fixed:** the note editor now submits the edited value; manual documentation works when AI fails; session observations persist across reloads; note approval is transactional/idempotent; profiles respect real IDs; staff metrics and records come from the database; errors are shown instead of being represented as empty data.

**Improved:** loading, validation, pending/success/error feedback, note revision comments, record locks, role-aware redirects, no direct clinical text in AI requests, and correct HTTP status handling.

**Added:** revision numbers and serialized autosave, actual session relationships, duplicate-source keys, internal claim status transitions and billing review. Removed mock staff, hardcoded client profiles, invented fixed charges, inactive exports, unsupported marketing/testimonial/compliance claims and unused Google AI dependency.

**Checkpoint:** build, type-check and lint passed. Anonymous route protection and authenticated demo rendering were checked. Browser workflow verification continues in Phase 7.

## Phase 4 — interface redesign

**Fixed:** mobile navigation, missing accessible control labels, inaccessible mobile sign-in heading, keyboard focus in the command palette, stale color styling and dead navigation targets.

**Improved:** the final direction follows the user's preference for a **white interface**: light neutral navigation, black/dark controls, readable hierarchy, subtle borders and restrained surfaces. Earlier green and purple directions were removed. Light is the default; optional system/dark modes remain neutral.

**Added:** shared tokens/components, responsive shell, global search/command palette, notification center, accessible native dialogs with focus management, toasts, real empty states, loading skeletons, client cards/timelines, common sorting/filtering/pagination, and reduced-motion behavior. The public landing page shows an actual labeled synthetic workspace screenshot. Updated brand mark and Open Graph PNG route use a neutral palette.

**References reviewed:** [Linear's March 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh), [shadcn dashboard patterns](https://ui.shadcn.com/blocks), and [Attio workspace navigation](https://attio.com/help/reference/productivity-collaborating/navigating-your-workspace). These informed structure and consistency; no third-party screenshots or visual assets were copied into the product.

**Checkpoint:** build and lint passed after the white theme implementation. Desktop browser rendering showed no page errors and a white canvas. Phase 7 checks all routes at 375, 768 and 1440 pixels in both themes and fixes issues found by those checks.

## Phase 5 — complete high-value features

**Improved:** every existing workflow now uses scoped records and useful feedback. AI templates include tone/length, original-versus-edit, explicit review, timeout/rate-limit handling, and a manual path. The retired developer-tier Groq model was replaced with its documented successor.

**Added:** frequency/duration/interval/ABC observation tools, server-saved drafts, assigned schedules, note review/bulk approval/revisions, treatment goals/aim/phase dates, caseload flags, supervision records, day/week booking conflict detection, staff invitation/deactivation/roles/certification dates, credential reminders, internal claim aging/filter/export, notifications, search, profile/password/appearance settings, client timelines, CSV and image export, and browser PDF printing.

**Data behavior:** approval creates one billing draft; no payer transmission takes place. Completed observation data and approved notes are locked. Completing a session reduces recorded remaining authorization hours within the same transaction. Concurrent edits/starts/bookings are rejected rather than silently overwriting records.

**Checkpoint:** production build passed. One lint issue in a newly added test fixture was corrected; subsequent source lint passed. All 11 unit tests passed after correcting a test password that lacked the policy's required ASCII lowercase character.

**Optional features deliberately deferred:** durable offline PHI storage/background sync, a guardian portal, external calendar/payer integrations, and AI-generated progress summaries. No inactive buttons advertise these capabilities.

## Phase 6 — data, performance and maintenance

**Fixed:** rejected Mongo connection promises no longer poison later requests; legacy arrays/revisions are normalized; unsafe client/server imports are blocked; generated test reports are excluded from source linting.

**Improved:** typed inferred Mongoose models, additive query/relationship/partial unique/TTL indexes, transactional writes, optimistic document concurrency, bounded projected queries, code-split feature modules/charts, optimized local product imagery, metadata, error/loading/not-found boundaries, and consistent formatting. All application TypeScript avoids `any`.

**Added:** a guarded local replica-set demo/seed launcher, read-only migration planning with verified mappings, explicit additive index creation, first-Admin bootstrap, `.env.example`, README, deployment/rollback/privacy notes and test scripts.

**Checkpoint:** production build, TypeScript and lint passed before final browser corrections. Final check results are recorded in [VERIFICATION.md](VERIFICATION.md).

## Phase 7 — verification

11 unit tests cover real access filters, redirects, expiry boundaries, input/operator injection, password byte limits, observation consistency, clinical attestation, scheduling bounds, AI data minimization, billing units and CSV injection protection.

Browser/API tests cover role logins/sign-out, clinic/assignment denial, bad origins/IDs/bodies, idempotent approval, revision/resubmission, concurrent scheduling, invitation replay, session revocation/expiry, autosave/reload, edited AI drafts, manual AI fallback, clinician approval and a billing action. Responsive tests visit the page map in both themes; accessibility checks and Cmd/Ctrl+K/escape focus are exercised.

The first browser pass exposed a hidden mobile sign-in heading, command input focus, and selectors that included Next 16's retained hidden route DOM. The heading/focus behavior was corrected; tests now query visible accessibility roles. The final results, remaining limits and live-provider check are reported separately, without treating mocked AI output as a live Groq success.

Final verification corrections also gated interactive actions until hydration, used POST fallbacks for client forms, supplied valid initial chart dimensions, normalized stored ABC entries before resubmission, and flushed pending online draft changes on navigation/unload. Public marketing routes bypass the JWT proxy; protected pages and all API authorization remain enforced. This reduces unnecessary cold-start work on the public landing page.
