# Production release — October 23, 2026

Production URL: **https://swiftcare-app.vercel.app/**. The redesigned application is released from `main`. The separate synthetic preview remains at https://swiftcare-preview-rumel9274.vercel.app/.

## Verified migration scope

The owner explicitly confirmed that all four existing accounts belong to one clinic and that their stored roles are correct. The clinic name is **Rumel**, using the existing Admin account's clinic name. The four user IDs are mapped to the stable clinic ID `rumel-clinic`; passwords and account IDs are preserved. Migrated accounts must sign in again with their existing credentials and change their password in Settings before accessing other workflows.

The owner explicitly chose to preserve the five historical notes and two claims unchanged and inaccessible until verified client mappings are supplied. There were no existing client profiles. No client identities, dates of birth, clinical assignments or financial amounts were inferred or fabricated. No historical record was deleted. New authorized client profiles and subsequent sessions can be created through the application.

Before applying the staff mapping, an independent snapshot of all original collections was copied into a separate timestamped `sc_backup_*` database on the same Atlas cluster, with document counts verified. It is a rollback snapshot, not a source of application records. Keep access and retention under the database owner's control. The migration updates staff scope and session versions transactionally, adds a clinic and a metadata-only migration audit event, and creates additive indexes without removing existing ones.

## Runtime and release configuration

- Keep the original production `MONGODB_URI`, `AUTH_SECRET` and `GROQ_API_KEY`.
- Set `AUTH_URL=https://swiftcare-app.vercel.app`, `AUTH_TRUST_HOST=true`, and `SWIFTCARE_DEMO=false` for production only.
- Set `MONGOMS_DISABLE_POSTINSTALL=1` to avoid downloading local test database binaries during cloud builds.
- Preview branch overrides and its synthetic database remain separate.
- Optional email/credential-reminder providers retain their documented setup requirements.

The production build and lint were rerun before release. Deployment readiness and HTTP/auth checks are verified against the production domain; no patient records are created as test fixtures, and existing users' passwords are not reset by the release operator.

## Remaining historical-data work

Create independently verified client profiles and map each historical note ID to its correct client. Then run the guarded migration dry run and apply only the reviewed note/client mapping. The mapping must also preserve author/clinic consistency. Until then, the five notes and two associated claims remain outside application queries. Staff must never attempt to recover visibility by removing server authorization filters.

For rollback, restore the previous Vercel deployment first if necessary, then reconcile the additive staff fields using the verified Atlas snapshot. A rollback must not delete clinical records or new legitimate records created after release. The prior application had known access-control defects; assess those before restoring it.
