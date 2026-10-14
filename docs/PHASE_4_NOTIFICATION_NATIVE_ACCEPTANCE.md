# Phase 4 notification acceptance — 13 October 2026

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Branch: `phase-4-development`. **Automated acceptance PASS; native acceptance PARTIAL. NOT READY for final milestone sign-off.** Public launch is NOT READY. Background push is NOT IMPLEMENTED; backend dependency vulnerabilities remain UNASSESSED.

## User-published requirement (read-only verification)

`TEST-RECORD-03`, **NammaCrew Notification Test - Carpenter**, owned by Test Customer, remains OPEN. Created `[event timestamp retained in encrypted evidence]`; Carpenter, one worker, starts `[event timestamp retained in encrypted evidence]`, ends `[event timestamp retained in encrypted evidence]` (two days). GPS coordinates retained in encrypted evidence; no verified canonical administrative location.

Worker E (`TEST-RECORD-06`) is the sole eligible recipient: available, matching legacy local radius, no booking conflict. One WORK_AVAILABLE record exists. Worker A is AVAILABLE but has no matching local-radius coverage for this GPS-only job, and his confirmed October 15–17 booking overlaps it. Worker C is unavailable; Worker D is outside coverage. No eligible omission or duplicate was found among these matching Carpenter profiles. No profile or user requirement was changed. Evidence: `verification/notification-acceptance-user-job.txt`, `notification-acceptance-user-job-final.json`.

## Confirmed defect and correction

Competing quotation acceptance bulk-updated losing quotes to REJECTED but did not send QUOTE_REJECTED. `backend/src/main/java/in/nammacrew/marketplace/QuotationService.java` now obtains the losing worker IDs from UPDATE RETURNING and inserts their notifications in the acceptance transaction. Existing accepted-quote retry returns the same booking before additional events. `backend/src/test/java/in/nammacrew/notification/NotificationIT.java` adds `competingAcceptanceNotifiesLoserExactlyOnce`, including repeated acceptance and no loser booking. No schema/migration/dependency change.

## Isolated live API acceptance

Four disposable identities were created (customer, winner, loser, outsider). Their IDs are recorded in `verification/notification-acceptance-api.json`; tokens were memory-only and excluded from evidence. Isolated requirement `TEST-RECORD-09`; booking `TEST-RECORD-12`. Customer published via API, two workers quoted, customer accepted one and cancelled that isolated booking. These fixtures remain for review. Publication naturally notified other eligible existing workers too; their notifications were not marked read by this task.

All evidence filenames below are under `docs/verification/`.

| Scenario | Expected | Actual | Evidence | Result | API verified? | Android UI verified? |
| --- | --- | --- | --- | --- | --- | --- |
| WORK_AVAILABLE | Eligible recipients only | Both isolated workers notified; user job only Worker E | notification-acceptance-api.json; notification-acceptance-user-job.txt | PASS | Yes | Content yes; open-job link pending |
| QUOTE_RECEIVED | Customer receives quotes | Two events; customer inbox contained only its received quotes | notification-acceptance-api.json; notification-acceptance-customer-inbox.png | PASS | Yes | Yes |
| QUOTE_ACCEPTED | Winner only, one booking | Repeated acceptance retained booking and one event | notification-acceptance-api.json; notification-acceptance-winner-inbox.png | PASS | Yes | Event yes; destination captured while loading only |
| QUOTE_REJECTED | Losing worker notified once | One event; native tap opened rejected quote in My Quotes | notification-acceptance-api.json; notification-acceptance-rejected-route.png | PASS | Yes | Yes |
| BOOKING_CANCELLED | Other party receives reason | Winner event opened CANCELLED booking with reason, actor and time | notification-acceptance-api.json; notification-acceptance-cancelled-route.png | PASS | Yes | Yes |
| Failed actions / rollback | No surviving events | Unauthorized acceptance and repeated cancellation create none; forced rollback integration test passes | notification-acceptance-api.json; notification-acceptance-backend.log | PASS | Yes plus integration | No |
| Retry deduplication | No repeated event | Repeated acceptance one event; publish retry integration test passes | notification-acceptance-api.json; notification-acceptance-backend.log | PASS | Yes plus integration | No |
| List / unread / pagination | Owner-scoped, stable reads | Different page items, correct count and persisted readAt | notification-acceptance-api.json | PASS | Yes | List/count yes; pagination not exercised |
| Authentication / ownership | No cross-user access | Unauthenticated list 401; foreign read 204 no-op, owner state unchanged; outsider list empty | notification-acceptance-api.json | PASS | Yes | Ordinary switch isolation yes |
| Customer / worker bells | Correct unread badges | Both rendered; loser 2 → 1 → 0 | notification-acceptance-customer-bell.png; notification-acceptance-rejected-route.png; notification-acceptance-read-all-refresh.png | PASS | Yes | Yes |
| Mark single / all read | Persist and sync badge | Isolated loser tap marked one; mark-all removed unread count; returned tab showed 0 | notification-acceptance-read-all-refresh.png; notification-acceptance-api.json | PASS | Yes | Yes |
| Pull to refresh | Reload current inbox | Swipe completed; same correct read-state/list remained | notification-acceptance-read-all-refresh.png | PASS | Separately | Yes, gesture/completed UI only |
| Closed opportunity fallback | Safe error, no unauthorized navigation | Worker A's isolated-job notification stayed in inbox with safe message; no read mutation | notification-acceptance-closed-fallback.png | PASS | Resource checks | Yes |
| Customer quote link | Authorized requirement | Opened CLOSED Requirement Details; full detail content not independently checked | notification-acceptance-customer-route.png | PASS for route | Yes | Route only |
| Back navigation | Return safely | Android Back returned from inbox and cancelled details | notification-acceptance-back.png; UI hierarchy inspection | PASS | N/A | Yes |
| Logout / normal account switch | No prior account inbox | Loser → customer → winner each displayed own distinct content/count | notification-acceptance-loser-inbox.png; notification-acceptance-customer-inbox.png; notification-acceptance-winner-inbox.png | PASS | Yes | Yes |
| In-flight logout race / polling cessation | No stale result | Jest guards pass; native race not deliberately induced | notification-acceptance-mobile-test.log | NOT TESTED natively | Component coverage | No |
| Offline Retry / failed read writes | Visible errors, retry succeeds | Component tests pass; native fault injection not performed | notification-acceptance-mobile-test.log | NOT TESTED natively | Component coverage | No |
| Empty / transient loading states | Correct UI | Customer empty state previously user-verified; not repeated; transient inbox loading not captured | User-reported baseline | NOT TESTED this run | Component coverage | User-reported only |

`notification-acceptance-accepted-route.png` shows Booking Details loading; it is not proof that QUOTE_ACCEPTED finished rendering its destination. The cancellation route did fully render the same isolated booking. Historical accepted notification text still says “Booking confirmed!” as an event-time message; the current booking screen correctly shows CANCELLED.

## Regression, runtime and preservation

- Java 21 `mvnw.cmd -o -B -ntp clean verify`: **94 passed, 0 failures/errors/skipped** (4 unit, 90 integration; 9 NotificationIT). BUILD SUCCESS, 1m21s. Backend formatting passed. Evidence: `notification-acceptance-backend.log`, `notification-acceptance-backend-counts.json`.
- Mobile: **110 passed, 17 suites**, typecheck/lint/format all exit 0. Evidence: `notification-acceptance-mobile.json` and corresponding logs.
- Admin unchanged: retain previous **2 passing**, not rerun.
- SELECT-only complete-row comparison: all three protected bookings, four quotations and three reservation rows match the previous snapshot. V1–V12 successful. Evidence: `notification-acceptance-preservation.json`. User job remains OPEN.
- Active backend listener was independently identified as PID **8256**, Java 21, Maven Spring Boot launcher with this project's `backend/target/classes`, started 15:38:38 IST after the successful build. Health UP and real API rejection notification demonstrate corrected behavior. A separate attempted JAR launch PID 23256 validated all 12 migrations but failed because 8080 was already occupied; **do not treat that attempted process as the active backend**. Earlier JAR attempt hit the known Windows Unix socket path issue. Both startup failures were retained in `.tools/notification-acceptance-backend*.log`.
- Metro 8083 remains the existing development server; previous exact-client bundle evidence is `notification-closure-bundle.json`. Native rendering of corrected routes plus successful backend calls confirms usable development JS/API connectivity, not a production APK attestation. No APK rebuild performed.
- Emulator became unresponsive during session restoration (Camera ANR), then exited. At the user's request the existing AVD was restarted without wiping data; ADB returned `device`, boot complete `1`, reverse ports 8080/8083 restored and NammaCrew launched. This interruption limits final session-restoration evidence; do not infer a completed final profile render from a loading screen.

## Architecture findings and remaining steps

Notification inserts participate in marketplace transactions; rollback integration coverage passes. Reads/writes derive ownership from the authenticated principal. WORK_AVAILABLE uses shared geographic eligibility and booking schedule overlap checks. Requirement row locking plus existing-event lookup serializes publication retry; acceptance/cancellation status rules protect their retries. No universal event unique key/outbox exists. Broadcast is capped at 20 recipients from limited matching candidates; broad exception handling is not reliable eventual delivery. These remain documented delivery limitations, not claims of unlimited exactly-once delivery.

**MANUAL TEST REQUIRED** on disposable accounts:

1. Tap an OPEN isolated WORK_AVAILABLE notification and verify the correct opportunity completes loading. Tap QUOTE_ACCEPTED and wait for fully rendered authorized Booking Details.
2. Temporarily make only the test client's network unavailable; open inbox and Retry; restore connectivity and verify recovery. Repeat single-read/read-all with induced failure and confirm visible error plus successful retry.
3. Switch/log out while a notification fetch is in flight; verify no old inbox/badge flashes, including Back/restart, and no polling after logout.

Do not use protected bookings for these steps. Public launch also requires background push (Expo/FCM credentials and permissions, token lifecycle, transactional outbox, retry/deduplication, preferences, physical-device background/terminated/lock-screen testing) and reliable backend vulnerability assessment. No external setup or push dependency installation occurred.

Changed in this task: QuotationService, NotificationIT, this report, milestone report and verification evidence. Existing unrelated working-tree changes retained. No commit, push, stable tag, deployment or Phase 5 work.
