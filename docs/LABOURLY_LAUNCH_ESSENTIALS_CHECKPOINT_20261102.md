# Labourly launch essentials — implementation checkpoint, 2 November 2026

**NOT READY for public launch.** First implementation batch of the eight approved essentials. Existing functionality and uncommitted changes preserved on `main`; no commit, push, deployment or normal database migration.

## Completed in this batch

### Authentication
Google linking now rechecks and locks the existing session after provider verification, sharing the session lock used by logout. It also checks account status under a user-row lock. Logout or suspension during provider verification prevents linking. Provider HTTP remains outside database transactions. Added two real disposable-database regressions. This closes the known pre-network-only session check, not all Google production requirements.

A fresh official npm registry request still failed with ECONNRESET. No Google native dependency was installed. Google mobile login/linking and a compatible signed APK remain incomplete. Neither the supplied OAuth secret nor Gemini key was saved or used.

### Support and account-deletion intake
Added additive V17 support_requests and support_request_events tables. Authenticated request creation and own-request listing are implemented, with validation, one active request per account/type, serialized concurrent creation, five new requests per account per rolling day and audit events. Duplicate requests return the existing request without overwriting its original details. This is initial intake, not threaded support messaging.

Customer and worker Profile menus now open a shared Support & account requests screen: details form, explicit deletion confirmation, durable receipt/status, empty/loading/error/retry states. Failed sends preserve form details. State is keyed to account and late responses cannot update a different account. Contact: labourly.work@gmail.com.

Authorized ADMIN users can read the admin Support page, save a review response visible to the requester, and resolve ordinary support cases. Both HTTP security and service authorization protect the queue. There is no automatic support email, live chat agent or response-time promise.

Deletion requests cannot be marked RESOLVED: actual erasure/retention is NOT implemented. No user, booking, quotation, reservation, message or cancellation record was deleted. Public deletion-request website and published policy remain missing. This intake alone does NOT close Play's account-deletion requirement.

### Production preparation and truthful UI
Prepared an opt-in application-production.yml and an isolated production compose template. Production requires explicit secrets and a Google client ID; schema validation stays enabled and automatic migration is disabled. Added production guards for mixed dev/test profiles, missing required configuration, default database passwords, unverified database TLS and public OpenAPI exposure. No changes to local environment files or default dev/test behavior.

Removed fabricated escrow/guaranteed-compensation text, default assumed phone verification, and nonpersistent notification preference toggles. The fallback notification panel now states background alerts/preferences are unavailable; the actual in-app notification destination is preserved.

## Verification — exact executed results

- Backend selected regression: **93 tests, 0 failures, 0 errors, 0 skipped**, Maven exit 0, 1m52s. Command: `mvnw.cmd -o test -Dtest=SupportIT,GoogleAuthIT,GoogleTokenVerifierTest,OtpSecurityTest,MigrationIT,ProductionConfigurationGuardTest,ChatConcurrencyIT,MarketplaceControllerIT,MarketplaceIT,QuotationConcurrencyIT,QuotationIT,ServiceCoverageIT -DfailIfNoTests=true`.
- Includes 7 support integration tests, 2 new Google linking-race cases and 5 production configuration tests. Existing quotation/concurrent acceptance, chat creation and geographic matching regression tests passed.
- Flyway V1–V17 ran and upgrade paths passed in disposable Testcontainers PostgreSQL. Original development/production databases were not connected or migrated.
- Backend Spotless check: PASS, exit 0.
- Mobile full suite: **213 passed, 0 failed; 37 suites passed**, exit 0, 111.502 seconds. TypeScript, lint and full formatting check: all exit 0.
- Admin full suite: **8 passed, 0 failed; 3 files passed**, exit 0. Typecheck, lint, formatting and production build: all exit 0.
- Initial mobile run passed assertions but reported an open handle. New test query clients now use explicit disposal and no GC timers; final run exited normally. Existing React act warnings in unrelated asynchronous component tests remain; not suppressed.
- Initial admin build/typecheck failed because the new test used Node's `global`; replaced with browser-compatible `globalThis`. All admin checks then passed.
- Offline Maven dependency tree failed: maven-dependency-plugin 3.8.1 is not cached. Alternative inventory records 135 JAR filenames from the successful test classpath; this includes test dependencies and is NOT a complete production dependency graph or vulnerability assessment. Backend vulnerability status remains **UNASSESSED**.
- No native build, physical-device acceptance, Firebase/Expo project creation or live Google sign-in was performed.

Private local evidence: `.tools/launch-essentials-backend-final.log`, `launch-essentials-backend-format.log`, `launch-essentials-mobile-final.log`, `launch-essentials-types-final.log`, `launch-essentials-lint-final.log`, `launch-essentials-format-final.log`, `launch-essentials-admin-*-final.log`, `launch-backend-dependency-inventory.log`, `launch-backend-test-classpath-inventory.txt`; backend Surefire reports. Initial logs are retained.

## Eight-essential status and next work

| Essential | This batch | Still required before launch |
|---|---|---|
| Google login | Linking race fixed; existing backend tests retained | Native SDK/install connectivity, client/signing/nonce validation, login/link UI, Google live-key/outage tests, abuse controls, device sessions |
| Production server | Opt-in guarded config, deployment template and runbook | Owner-controlled hosting account/budget/domain, HTTPS ingress, real secret manager, isolated production DB, backup/restore rehearsal, monitoring/alerts, reviewed migration job |
| Privacy/deletion | Authenticated durable request intake, operator queue, draft review checklist | Approved policy/retention rules, public HTTPS request page, real erasure/anonymization and backup handling, requester identity verification, accurate Data safety form |
| Booking reliability | Existing acceptance/conflict/cancellation regressions passed | Start/completion product rules and implementation, two-device acceptance, dispute/escalation process; not newly implemented in this batch |
| Communication | Existing chat-creation concurrency regression passed; support escalation intake added | Message idempotency/delivery recovery, reporting/blocking enforcement, moderation workflow, two-device checks |
| Notifications | Misleading local preference controls removed | Firebase/EAS projects and approved credentials, token lifecycle, permission UX, transactional outbox, retry/dedup/receipts, safe lock-screen payloads, device tests |
| Security | Linking race, authorization tests, config guards, offline inventory | Reliable vulnerability scans, production security review, rate limits, dependency remediation justified by evidence, rotation of previously shared credentials |
| Release testing | Automated mobile/backend/admin gates passed | Standalone signed AAB without Metro, Play App Signing certificate setup, physical customer/worker tests, accessibility/lifecycle verification, internal Play testing and staged rollout |

The user confirmed no hosting account and asked for simple support. No budget, retention periods or provider credentials have been invented. Account ownership/sign-in, MFA, terms and billing require the owner. Computer-use initialization failed in the preceding emulator task; no external account actions have been attempted here. No paid services activated.

## Exact changed/new paths for this batch

Backend:
- src/main/java/in/nammacrew/auth/AuthService.java
- src/main/java/in/nammacrew/auth/GoogleAuthService.java
- src/test/java/in/nammacrew/auth/GoogleAuthIT.java
- src/main/java/in/nammacrew/support/SupportService.java (new)
- src/main/java/in/nammacrew/support/SupportController.java (new)
- src/test/java/in/nammacrew/support/SupportIT.java (new)
- src/main/resources/db/migration/V17__support_and_deletion_requests.sql (new)
- src/test/java/in/nammacrew/auth/MigrationIT.java
- src/test/java/in/nammacrew/FoundationIT.java
- src/main/java/in/nammacrew/security/ProductionConfigurationGuard.java (new)
- src/test/java/in/nammacrew/security/ProductionConfigurationGuardTest.java (new)
- src/main/resources/application-production.yml (new)

Mobile:
- src/app/support.tsx (new)
- src/app/_layout.tsx
- src/app/(customer)/profile.tsx
- src/app/(worker)/profile.tsx
- src/components/LabourlyMyProfileScreen.tsx
- src/__tests__/support-requests.test.tsx (new)
- src/__tests__/labourly-my-profile.test.tsx

Admin:
- src/App.tsx
- src/SupportQueue.tsx (new)
- src/SupportQueue.test.tsx (new)

Documentation/deployment:
- deployment/compose.production.template.yaml (new)
- deployment/README.md (new)
- deployment/PRIVACY_RETENTION_REVIEW.md (new)
- docs/LABOURLY_LAUNCH_ESSENTIALS_CHECKPOINT_20261102.md (this report)

Existing working changes from other tasks remain untouched except for the specifically described additions. No records were modified in protected environments. No claim of fresh protected-record database comparison is made because those databases were not accessed.
