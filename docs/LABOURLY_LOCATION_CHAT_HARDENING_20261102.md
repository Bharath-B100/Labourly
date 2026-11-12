# Labourly location and chat hardening — 2 November 2026

This checkpoint is part of the owner's broader production-readiness request. It does not implement all launch requirements and does not approve public release.

## Changes made

- Customer Home: manual city/state/hub choices invalidate pending GPS lookups and clear GPS coordinates. A late automatic or button-triggered GPS response cannot silently override the selected search area. City chips now have accessible button labels. The search action requires a selected city or GPS point; an incomplete state-only selection cannot accidentally enable it.
- Onboarding GPS: reused currentSearchLocation's existing bounded foreground location lookup, including its 15-second position timeout and coordinate validation. No district/state inferred from city-point proximity. Corrected the obsolete function comment.
- ChatService: after booking authorization, acquire the booking row lock before checking/creating its chat thread. This serializes first-thread creation across instances within the existing transaction and preserves the V15 unique booking constraint. No schema change.
- ChatAuthorizationTest: verifies authorization precedes the lock and lookup, and unauthorized requests do not touch either.
- ChatConcurrencyIT: two prepared PostgreSQL scenarios cover simultaneous participant opens yielding one thread and real message visibility to both participants with outsider read/send/open rejection. Explicit disposable jdbc:tc URL; no original database configuration is used. These tests compiled but were NOT EXECUTED because Docker was unavailable.

## Verification

- Focused mobile tests: 61 passed / 6 suites, exit 0 (103.186 seconds). Includes location, Home, discovery, publishing and quotation components.
- Backend database-free tests: 18 passed, 0 failures/errors/skips, Maven exit 0 (2 minutes 21 seconds): ChatAuthorizationTest and OtpSecurityTest.
- Existing quotation concurrency tests inspected: competing-quote acceptance and duplicate concurrent acceptance are present. NOT RERUN here; unit tests are not proof of database concurrency.
- Docker endpoint checked twice: named pipe dockerDesktopLinuxEngine unavailable. No database integration attempt, migration or protected-record access occurred.
- Physical GPS, standalone build, native two-device booking/chat delivery: NOT RUN.
- Full mobile and final formatting results are appended below after completion.

Local logs: `.tools/launch-next-focused.log`, `.tools/launch-next-backend-unit.log`, `.tools/launch-next-mobile-full.log`, `.tools/launch-next-{type,lint,format}.log`, `.tools/launch-next-spotless-verified.log`.

## Exact changed files in this checkpoint

- backend/src/main/java/in/nammacrew/chat/ChatService.java
- backend/src/test/java/in/nammacrew/chat/ChatAuthorizationTest.java
- backend/src/test/java/in/nammacrew/chat/ChatConcurrencyIT.java (new)
- mobile/src/app/(customer)/home.tsx
- mobile/src/location/deviceLocation.ts
- mobile/src/__tests__/device-location.test.ts
- mobile/src/__tests__/location.test.ts
- mobile/src/__tests__/labourly-foundation.test.tsx
- docs/LABOURLY_GOOGLE_LOGIN_AND_PRODUCTION_PLAN_20261102.md (new)
- This report (new).

Prior staged/untracked work remains preserved on main. No backend restart was performed, so the new server lock is not claimed to be active in a running service. No commit, push, deployment, native build, dependency installation, production account setup or historical migration edit occurred.

## Remaining requests

Google sign-in is feasible but NOT implemented/activated: the existing unique phone login identity requires separate provider-account linkage and unverified contact-phone storage. Do not allow an entered phone to claim an existing account. Preserve JWT/refresh/logout. Google OAuth clients and an iOS-compatible login strategy are required. Details and authoritative sources are in the accompanying plan.

No support address, legal identity, provider credentials or deployment host was invented. Owner input on these is pending. Background push, completion workflow, report/block/moderation, privacy/account deletion, production hosting/security and release acceptance remain unfinished. The pending tests and external setup do not justify a production-ready claim.

Next database command after Docker is available (Java 21, disposable test profiles only):

`./mvnw.cmd -o test '-Dtest=ChatConcurrencyIT,QuotationIT,QuotationConcurrencyIT,MarketplaceControllerIT,MarketplaceIT,ServiceCoverageIT' '-DfailIfNoTests=true'`

This command is prepared, not reported as executed. Existing databases and protected records must remain outside its scope.

## Final gate results

- Full mobile: **201 passed / 35 suites**, 0 failures, exit 0, 201.908 seconds.
- TypeScript: PASS, exit 0.
- Full mobile formatting: PASS, exit 0. The final two warning-cleanup files were formatted again successfully.
- Lint: initial run had 11 warnings (test import placement and effect ref cleanup). Corrected without suppressions; final full lint PASS with no warnings, exit 0.
- After that warning-only cleanup, Home/foundation regression rerun: **15 passed**, exit 0, 8.179 seconds. The full 201-test run preceded the warning-only cleanup; no claim of a second full run.
- Backend Spotless: PASS, exit 0, after correcting the targeted-format command's file regex. Earlier failed formatting invocations are retained in local logs.
- Backend unit result remains 18 passed. New chat integration tests and existing quotation concurrency integration tests remain NOT RUN.
- Non-failing React act warnings remain in the full Jest output; these are not native acceptance evidence.

**Recommendation: BLOCKED for public launch.** Location precedence and bounded GPS lookup fixes are verified in component/unit tests. Chat creation locking is unit-checked but awaits real PostgreSQL concurrency proof. Google login, completion/moderation/push/deletion/hosting/signing work remains open as described above.

## Subsequent Docker-enabled verification — 2 November 2026

After the owner started Docker, the prepared disposable integration selection ran successfully: **44 tests, 0 failures, 0 errors, 0 skipped**, Maven exit 0, 46.172 seconds.

- ChatConcurrencyIT: 2
- MarketplaceControllerIT: 3
- MarketplaceIT: 5
- QuotationConcurrencyIT: 4 (including three repetitions of competing acceptance)
- QuotationIT: 6
- ServiceCoverageIT: 24

Flyway V1–V15 validated and applied in disposable Testcontainers databases. Explicit jdbc:tc URLs and ContainerDatabaseDriver were used; no tests were pointed at the normal development database. This supersedes the earlier Docker-unavailable status for this selected suite only. No physical-device/two-device UI acceptance or production deployment is implied.

Command: `./mvnw.cmd -o test '-Dtest=ChatConcurrencyIT,QuotationIT,QuotationConcurrencyIT,MarketplaceControllerIT,MarketplaceIT,ServiceCoverageIT' '-DfailIfNoTests=true' '-Dspring.datasource.url=jdbc:tc:postgis:17-3.5:///labourly_release_test' '-Dspring.datasource.driver-class-name=org.testcontainers.jdbc.ContainerDatabaseDriver'`

Evidence: `.tools/launch-isolated-integration-20261102.log` and individual backend/target/surefire-reports XML files. Only sanitized summary counts should enter Git; raw XML can include local environment details.

The chat lock is now verified against PostgreSQL for simultaneous first opens. Duplicate quote acceptance returns the same booking; competing acceptance leaves one accepted quotation and one booking in the selected tests. Real two-device visibility remains pending.
