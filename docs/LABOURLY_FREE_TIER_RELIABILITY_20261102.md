# Labourly free-tier reliability checkpoint — 2 November 2026

Status: implementation progressed; **not ready for public launch**. The owner requires free tier only and approved both participants confirming start/completion. No billing, paid plans, external account creation, push activation, deployment, commit or push occurred.

## Implemented

### Chat retry safety

Optional clientMessageId on send-message API. New mobile sends keep the same identifier when retrying unchanged text in the mounted conversation. PostgreSQL enforces a unique thread/sender/key tuple; thread-row locking serializes retries across backend instances. A same-key/same-body retry returns the stored message, while different content under the same key is rejected. Participant authorization runs before any replay lookup.

Compatibility: older clients may omit the identifier and retain their old behavior. Mobile retry keys are non-secret correlation identifiers, not credentials. They are currently held in memory: app termination can lose the retry key/draft. Exactly-once delivery across app reinstall/restart is NOT claimed. Durable device-side pending-message recovery, pagination and abuse limits remain work.

### Conversation blocking and reporting

Both participants can block new messages in a conversation. Either party's block prevents sending in both directions; each can remove only their own block. Existing messages and bookings remain. Send and block operations share the thread lock. An already-committed message can be returned on retry even after a block, without inserting a new message.

Conversation safety UI loads state, supports block/unblock, and sends a report reason to the existing authenticated support intake. Reports carry the conversation reference and appear in the authorized admin queue. An outsider cannot inspect/block/report the thread. If a different open support request already exists, the report fails explicitly instead of silently overwriting or discarding it; the reason remains in the form for follow-up.

Blocking is conversation-specific, not a global user ban or discovery filter. Reporting does not automatically ban an account. Staff investigation/escalation and global moderation policy remain operational work.

### Booking start and completion

For quotation-backed bookings, customer and quoted worker both confirm START before CONFIRMED becomes IN_PROGRESS; both confirm COMPLETE before IN_PROGRESS becomes COMPLETED. The server derives participant identities; clients cannot supply another actor. Confirmations are unique per actor/action and recorded permanently.

Booking-row locks serialize concurrent confirmation/cancellation. Duplicate confirmations return current state without duplicate notifications. START is rejected before the scheduled start time; premature COMPLETE is rejected. A cancellation after one start confirmation prevents the other participant from starting that cancelled booking. No automatic status change occurs merely because a date passes.

Updates generate transactional BOOKING_UPDATED in-app notifications and authorized booking deep links. The shared customer/worker booking-detail component displays confirmation status and polls for changes. If participants disagree, status stays unchanged and support handles the dispute. No payment/escrow or guaranteed satisfaction is implied. Existing reservation rules remain intact, including reservations for the booked interval after early completion.

This workflow targets current quotation-backed marketplace bookings. Historical non-quotation foundation bookings do not acquire inferred participants and return unavailable rather than bypass authorization.

### Schema and preservation

- V18: nullable chat client-message identifier, uniqueness/validation, per-conversation block table.
- V19: booking lifecycle confirmation table.
- Historical V1–V17 migrations unchanged in this checkpoint.
- Migration upgrades exercised only against disposable Testcontainers PostgreSQL.
- Normal development backend/database, protected records, environment files, APKs and emulator data not modified. No fresh original-database comparison claimed because it was not accessed.

## Verification

Initial chat/migration/support run: 19 tests passed, zero failures/errors/skips.
Initial lifecycle/chat/migration run: 13 tests passed, zero failures/errors/skips.

Expanded regression command:
`mvnw.cmd -o test -Dtest=BookingLifecycleIT,SupportIT,GoogleAuthIT,GoogleTokenVerifierTest,OtpSecurityTest,MigrationIT,ProductionConfigurationGuardTest,ChatConcurrencyIT,ChatAuthorizationTest,MarketplaceControllerIT,MarketplaceIT,QuotationConcurrencyIT,QuotationIT,ServiceCoverageIT -DfailIfNoTests=true`

Expanded result: **104 tests, 0 assertion failures, 1 setup error, 0 skipped**. The new future-booking fixture attempted a second accepted quotation on one requirement and correctly hit quotation_one_accepted_per_requirement. Fixed the fixture to create a distinct synthetic requirement without modifying the constraint or production code.

Affected-class rerun: **BookingLifecycleIT 5 passed, 0 failures/errors/skips**, Maven exit 0, 58.734 seconds. Thus the selected 104 cases have passing evidence across runs (99 unaffected cases plus 5 rerun lifecycle cases); do not describe the initial 104-test invocation as successful. Backend Spotless check passed. No complete all-backend-suite claim is made.

Mobile's first expanded suite passed 221 tests, but lint rejected a callback-ref assignment during render. Replaced it with an effect dependency without suppressing the rule. Final mobile results appended below after completion.

Native/two-physical-device acceptance: NOT RUN. No Android build. Previous admin 8-test/type/lint/format/build evidence is unchanged; admin code was not modified in this batch.

## Evidence locations (private/local, outside committed evidence)

- `.tools/free-tier-chat-backend.log`
- `.tools/free-tier-lifecycle-backend.log`
- `.tools/free-tier-backend-final.log` (contains the fixture error; retained)
- `.tools/free-tier-lifecycle-retest.log`
- `.tools/free-tier-format-retest.log`
- `.tools/free-tier-mobile-final.log`, `free-tier-lint-final.log` (intermediate evidence)
- `.tools/free-tier-mobile-verified.log`, `free-tier-types-verified.log`, `free-tier-lint-verified.log`, `free-tier-format-verified.log`
- Backend Surefire reports.

## Changed files for this checkpoint

Backend:
- src/main/resources/db/migration/V18__chat_delivery_and_safety.sql (new)
- src/main/resources/db/migration/V19__booking_lifecycle_confirmations.sql (new)
- src/main/java/in/nammacrew/chat/ChatDTOs.java
- src/main/java/in/nammacrew/chat/ChatController.java
- src/main/java/in/nammacrew/chat/ChatMessage.java
- src/main/java/in/nammacrew/chat/ChatService.java
- src/main/java/in/nammacrew/chat/ChatSafetyService.java (new)
- src/main/java/in/nammacrew/chat/ChatSafetyController.java (new)
- src/main/java/in/nammacrew/booking/BookingLifecycleService.java (new)
- src/main/java/in/nammacrew/booking/BookingLifecycleController.java (new)
- src/test/java/in/nammacrew/chat/ChatConcurrencyIT.java
- src/test/java/in/nammacrew/booking/BookingLifecycleIT.java (new)
- src/test/java/in/nammacrew/auth/MigrationIT.java
- src/test/java/in/nammacrew/FoundationIT.java

Mobile:
- src/api/chat.ts
- src/api/notifications.ts
- src/notifications/navigation.ts
- src/components/LabourlyLiveChat.tsx
- src/components/ChatSafetyControls.tsx (new)
- src/components/BookingLifecycleControls.tsx (new)
- src/app/(customer)/booking/[id].tsx (worker route already reuses it)
- src/__tests__/chat-safety.test.tsx (new)
- src/__tests__/booking-lifecycle.test.tsx (new)
- src/__tests__/labourly-in-app-call-and-chat.test.tsx
- src/__tests__/notification-screen.test.tsx

Documentation: deployment/FREE_TIER_BOUNDARY.md and this report.

## Remaining launch gates

1. Native Google SDK/login/link UI and live Google configuration/verification; prior official npm registry ECONNRESET remains the installation blocker. OTP production remains unavailable.
2. Owner-controlled Firebase/Expo projects and credentials, native notification module, transactional push outbox/worker, token/logout lifecycle, permission UX, delivery receipts and physical-device tests. In-app lifecycle notices are not background push.
3. Hosting/domain/HTTPS, production secrets, real backup/restore and monitoring. Free tier only is respected; no suitable reliable production hosting has been provisioned or claimed.
4. Approved privacy/terms, external deletion page and actual erasure/retention workflow. Durable requests alone do not fulfill deletion.
5. Durable chat retry across app death, message limits/pagination and staff moderation escalation.
6. Standalone signed release, actual customer/worker two-device flows, accessibility/lifecycle acceptance and reliable dependency-security scanning. Backend vulnerabilities remain UNASSESSED.

FCM is documented no-cost; Expo Free cannot incur overage charges. Render warns its free instances are not for production, and its free database expires. See deployment/FREE_TIER_BOUNDARY.md for official source links and the explicit no-billing boundary. Do not trade data durability or security for a free-tier claim.

## Final mobile quality results

- Full Jest suite: **221 passed, 0 failed; 39 suites passed**, 61.378 seconds, exit 0.
- TypeScript: PASS, exit 0.
- ESLint: PASS, exit 0, no lint warnings.
- Full mobile formatting: PASS, exit 0.
- Backend final formatting: PASS, exit 0.
- `git diff --check`: exit 0.
- Existing React act warnings remain in asynchronous UI tests, and Mockito dynamic-agent warnings remain in backend tests; neither was suppressed. No native acceptance result is inferred from these automated checks.
