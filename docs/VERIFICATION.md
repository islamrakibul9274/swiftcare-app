# Release verification — October 18, 2026

All verification used command-line tools and headless Playwright. No Computer Use was used for this release pass. Mutating tests used a fresh, isolated local MongoDB replica set with synthetic records; they did not run against the production database.

| Check                             | Result                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                   | Passed; Next.js 16.4.2 production build                                                                                             |
| `npm run typecheck`               | Passed                                                                                                                              |
| `npm run lint`                    | Passed, no warnings                                                                                                                 |
| `npm run test`                    | 11 passed                                                                                                                           |
| `npm run test:e2e`                | 26 passed in 3.2 minutes, zero retries                                                                                              |
| `npm run format:check`            | Passed                                                                                                                              |
| `npm audit --omit=dev`            | Zero vulnerabilities                                                                                                                |
| Full development dependency audit | 5 high findings in the development-only `braces`/`micromatch`/`fast-glob`/Next ESLint dependency chain; no compatible automatic fix |

The browser/API suite covers three role sign-in/sign-out flows, generic credential failures, clinic and assignment boundaries, direct role access, malformed IDs/JSON, cross-origin mutations, single-use invitations, session revocation and idle expiry, booking conflicts, revision checks, idempotent approval, session autosave/reload, edited AI drafts, clinician approval and a billing action. The Admin regression confirms clinical draft/ABC/behavior fields never reach the operational session payload.

Responsive checks visit all public and role-specific workspace routes at 375, 768 and 1440 pixels in both light and dark modes. Checks include overflow, runtime and hydration errors, failed requests, skeleton completion, and dead `#` links. Automated WCAG 2.1 AA checks cover representative screens; keyboard command palette focus and escape behavior are exercised. A separate check confirms a white default even when the operating system prefers dark mode, and the chart export test checks a real PNG signature.

AI UI workflows use explicit deterministic test fixtures, including provider failure and manual fallback. A separate earlier live Groq smoke using synthetic numeric observations returned HTTP 200 in 881 ms with a 456-character draft. This is a single provider observation, not a reliability guarantee or clinical evaluation. No patient information was used.

## Deployment boundary

Read-only production inspection found 4 accounts, 5 notes and 2 claims missing verified clinic relationships. No production records or indexes were changed. The user explicitly chose to retain the current production deployment and publish an isolated preview.

The preview uses a separate `swiftcare_preview_20261018` database, a new Auth.js secret and branch-specific environment overrides. Its records and sign-in credentials are visibly labeled synthetic demo data. Do not enter patient information. The guarded preview seed refuses the source database and any target that already contains collections. It never resets or deletes records.

The release README will link to the verified Vercel preview after its build reaches `READY`. Production cutover requires independently reviewed account/client/note mappings; clinic names alone are insufficient evidence of ownership. See [deployment and migration instructions](DEPLOYMENT.md).

## Limits

- Automated accessibility and layout checks are not a manual accessibility certification. No Computer Use or manual browser verification was performed in this release pass.
- Scheduling uses the device timezone. Local tests use Asia/Dhaka; a multi-timezone clinic policy and deployed server/client alignment need review.
- Browser Print / Save as PDF depends on the browser's print destination. The export image path is tested; OS print dialogs are not automated.
- No field Core Web Vitals or production load test was performed. Local lab observations do not establish field performance.
- Email delivery requires a verified Resend sender; payer transmission, payment collection, MFA/SSO, durable offline PHI storage, guardian access and external calendar integration are not implemented.
- Workspace snapshots have visible bounded result limits; historical server-side pagination remains future work.
- Qualified clinical, privacy, security and legal owners must review real-data deployment and vendor agreements. This software does not establish HIPAA compliance.
