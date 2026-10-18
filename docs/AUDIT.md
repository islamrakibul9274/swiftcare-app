# SwiftCare baseline audit — 2026-10-17

Baseline: commit a72ddd7, Next 16.2.3, Auth.js 5.0.0-beta.30, Mongoose 9.4.1, Tailwind 4.2.2, Recharts 3.8.1. Root AGENTS.md and CLAUDE.md (which references AGENTS.md) reviewed. Relevant bundled Next documentation for Proxy, route handlers, authentication/data security, forms, server/client boundaries, error handling, images, metadata and environment variables reviewed before implementation.

## Baseline evidence

- `npm ci`: successful; 420 packages installed.
- `npm run build`: successful; TypeScript passed, all 19 pages generated. Node 26 emits DEP0205 from tooling.
- `npm run lint`: **31 errors, 7 warnings** (38 findings), including unsafe `any`, unescaped JSX and unused code.
- `npm audit`: **19 findings**: 3 critical, 12 high, 3 moderate, 1 low. Includes Next, Auth.js and Mongoose; update compatible releases rather than blindly applying the suggested Next 14 downgrade.
- Running baseline: `/`, `/login`, `/register` return 200; `/admin`, `/director`, `/tech` and a tampered profile URL redirect to `/login`; `/api/notes` returns 401, `/api/claims` returns 403.
- Public browser review confirms inactive demo CTA, absent fragment targets, unsupported clinic/testimonial/reimbursement/HIPAA claims, no working mobile navigation. No runtime failure observed during public navigation. Console/hydration and all authenticated flows are **not yet verified** at baseline.
- No safe baseline role accounts or seed workflow were supplied. Authenticated walkthroughs are deferred to isolated synthetic data; no test users or clinical mutations were made in the production database.

## Complete source map

| Surface       | Files/routes                                                                                                       | Baseline behavior                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Root          | `app/layout.tsx`, `app/globals.css`, `next.config.ts`                                                              | Inter, SessionProvider, fixed light theme, no security headers             |
| Public layout | `app/(marketing)/layout.tsx`, `components/Navbar.tsx`, `Footer.tsx`, `Logo.tsx`                                    | Navigation/footer, multiple dead links                                     |
| Landing       | `/`, `SocialProof`, `FeatureAIPilot`, `BillingMetrics`, `Testimonials`                                             | Static marketing and unsupported proof/metrics                             |
| Login         | `/login`, `LoginForm.tsx`                                                                                          | Credentials sign-in, role redirect, no return URL/reset/remember behavior  |
| Register      | `/register`, `RegisterForm.tsx`                                                                                    | Public account creation with caller-selected role/clinic                   |
| Shell         | `app/(dashboard)/layout.tsx`, `components/dashboard/{Sidebar,Header}.tsx`                                          | Session presence only, mobile menu/bell inactive                           |
| RBT           | `/tech`, `/tech/notes`                                                                                             | Hardcoded client/counters, AI editor, own note list                        |
| BCBA          | `/director`, `/director/notes`, `/director/graphs`, `/director/client/[id]`                                        | Note approval, aggregate charts, hardcoded profile regardless of ID        |
| Admin         | `/admin`, `/admin/staff`, `/admin/billing`                                                                         | Claims-based overview, mock staff, read-only ledger                        |
| Denial        | `/unauthorized`                                                                                                    | Access denial screen                                                       |
| Auth          | `auth.ts`, `proxy.ts`, `/api/auth/[...nextauth]`                                                                   | Credentials+bcrypt/JWT, optimistic role redirects; proxy excludes APIs     |
| Action        | `app/actions/auth.ts:logoutAction`                                                                                 | Auth.js sign-out only                                                      |
| APIs          | `POST /api/auth/register`, `POST /api/ai-notes`, `GET/POST /api/notes`, `PATCH /api/notes/[id]`, `GET /api/claims` | Described below                                                            |
| Persistence   | `lib/db.ts`; `models/{User,Client,Session,Note,Claim}.ts`                                                          | Cached Mongo connection; Client/Session models mostly disconnected from UI |

## Findings and remediation

| ID  | Severity | Issue / evidence                                                                                 | Files                                               | Proposed fix                                                                                   |
| --- | -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S01 | Critical | Public registration trusts role (including ADMIN) and clinicName                                 | `app/api/auth/register/route.ts`, registration form | Disable public staff registration; Admin invitations with hashed, expiring single-use tokens   |
| S02 | Critical | Groq endpoint has no authentication/limit, exposing paid API usage                               | `app/api/ai-notes/route.ts`                         | Actor authorization, strict schema, distributed rate limit, timeout                            |
| S03 | Critical | Global notes/claims reads; no clinic scope or client assignment checks                           | notes/claims APIs, all models                       | Authoritative DB actor + clinic and assignment filters; fail closed on unmapped legacy records |
| S04 | Major    | Approval denies only RBT, accepts malformed IDs, creates duplicate claims on repeated PATCH      | note PATCH                                          | BCBA assignment check, valid IDs, transaction, idempotent draft claim                          |
| S05 | Major    | Every approval invents a $150 charge/CPT without configured rate or units                        | note PATCH, Claim model                             | Clinic-configured rate and units, manual billing review before submission                      |
| S06 | Major    | No input schemas, field bounds, CSRF origin checks on custom JSON mutations, auth/AI throttling  | every API, auth.ts                                  | Shared Zod/API layer, request bounds, origin checks, Mongo TTL rate limiter                    |
| S07 | Major    | JWT role persists indefinitely; deactivation/password changes cannot revoke sessions             | auth.ts, User                                       | Recheck DB actor/session version, absolute and idle expiry                                     |
| S08 | Major    | No invite/reset/password change; weak password policy; email enumeration                         | register API/login                                  | Account lifecycle with bcrypt byte bounds, generic auth/reset messages                         |
| S09 | Major    | Clinical identifiers sent to Groq; broad error objects logged                                    | ai-notes and API catch blocks                       | Fixed field-only numeric payload, no identifiers/free text; safe error codes, clinician review |
| S10 | Major    | No sensitive-access/admin audit log                                                              | all clinical APIs                                   | Metadata-only scoped audit events and Admin viewer                                             |
| F01 | Major    | Note textarea uses defaultValue without onChange; edited text never submitted                    | `/tech`                                             | Controlled editor, validation, review checkbox                                                 |
| F02 | Major    | Timer/counters lost on refresh; AI failure blocks manual workflow; no actual Session persistence | `/tech`, Session model                              | Server draft autosave, timer from timestamps, manual note path, explicit submit                |
| F03 | Major    | All profile IDs render Leo M.; fixed DOB/goals/duration; directory uses `/123`                   | director profile/graphs/notes                       | Real scoped client records, IDs, goals and timeline                                            |
| F04 | Major    | Mock staff and active counts, dead invite/revoke/edit/export/revision controls                   | admin screens, director dashboard                   | Fully implement or remove controls; derive metrics from persisted data                         |
| F05 | Major    | Failed fetches appear as empty data, duplicate approval clicks possible                          | dashboard pages                                     | Shared loading/error/retry states, pending mutation feedback                                   |
| U01 | Major    | Unsupported testimonials, clinic logos, financial performance and compliance claims              | public components                                   | Replace with factual feature copy and labeled product preview                                  |
| U02 | Minor    | Hidden mobile sidebar with inert toggle, fake notification dot, no theme/accessibility system    | shell, globals                                      | Responsive drawer, role nav, real alerts, focus management and tokens                          |
| U03 | Minor    | Missing labels on counters/selects/forms, long unbounded animations, nested main landmarks       | multiple UI files                                   | Semantic controls, 44px targets, reduced motion and single main                                |
| Q01 | Major    | Vulnerable dependency lock; 31 lint errors; any-rich model/query code                            | package files, sources                              | Compatible security updates, typed models/DTOs and meaningful tests                            |
| Q02 | Minor    | No route boundaries, test suite, migration/seed/index/deployment docs                            | app, README                                         | loading/error/not-found, isolated seed, migration dry-run, verification report                 |
| Q03 | Minor    | Connection failures cache a rejected promise; no timeout                                         | lib/db.ts                                           | Reset failed connection promise, bounded selection timeout                                     |

## Data and implementation assumptions

- Preserve collections and existing fields. Add optional relationship/scope fields; never guess a clinic when evidence is ambiguous. A dry-run migration reports unresolved data and applies only when explicitly invoked with `--apply`.
- New runtime writes require clinic and assignment scope. Existing password hashes continue to work. Existing clinical records are never deleted by setup or seed scripts.
- Local verification uses a separate MongoDB replica set and synthetic `.example` accounts. External AI is tested independently with synthetic observations; deterministic test doubles must be labeled and never used as production AI.
- No claim of HIPAA compliance. Organizational policies, vendor agreements, deployment controls, legal and clinical review remain external requirements.

## Reference checks

- Auth.js: https://authjs.dev/reference/nextjs and https://authjs.dev/guides/role-based-access-control
- Mongoose: https://mongoosejs.com/docs/transactions.html and https://mongoosejs.com/docs/validation.html
- Tailwind: https://tailwindcss.com/docs/dark-mode and https://tailwindcss.com/docs/theme
- Recharts: installed v3 types and https://github.com/recharts/recharts/blob/main/storybook/stories/API/Accessibility.mdx
- New test/validation packages verified against npm metadata (current releases and Node engine compatibility). See final verification report for installed versions.
