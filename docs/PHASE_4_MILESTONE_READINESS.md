# Phase 4 development milestone readiness

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Date: 13 October 2026, Asia/Calcutta. Final regression recovery; not public-launch approval.


## Notification defect closure — 13 October 2026, 15:21 IST

This section supersedes the notification defect findings and counts below. **NOT READY FOR USER SIGN-OFF:** complete isolated-account native acceptance and activation of the corrected backend remain pending. Public launch remains NOT READY; backend dependency vulnerabilities **UNASSESSED**; background push **NOT IMPLEMENTED**, with the pre-launch backlog below retained.

### Fixes and changed files

- `mobile/src/notifications/navigation.ts`: validated UUID/recipient/role and authenticated resource reads before routing. QUOTE_RECEIVED → customer requirement; QUOTE_ACCEPTED/BOOKING_CONFIRMED/BOOKING_CANCELLED → authorized role's booking; WORK_AVAILABLE → OPEN opportunity; QUOTE_REJECTED → My Quotes (`/(worker)/schedule`) after verifying the requirement exists in that account's quote history. The rejected event stores a requirement ID, not a quotation ID; no fabricated quote-detail identifier. Missing, closed opportunity, unsupported, deleted and denied destinations remain in the inbox with a safe message. Backend authorization remains authoritative and destination screens still fetch their own data.
- `mobile/src/app/notifications.tsx`: distinct loading, empty and network-error states, Retry; visible single/all-read failures; retry by tapping the item/action; navigation waits for a successful read mutation. Per-account keyed screen resets mutation/error state. Successful writes invalidate both list and unread count.
- `mobile/src/notifications/session.ts`, `mobile/src/app/_layout.tsx`: credential-epoch/account guards reject delayed results; account changes cancel/remove notification queries. No data reset or credentials change performed by this verification.
- `mobile/src/api/notifications.ts`, `mobile/src/components/NotificationBell.tsx`: failed count requests report count unavailable rather than a false zero; account-guarded reads.
- `backend/src/main/java/in/nammacrew/marketplace/MatchingEngine.java`: separate opportunity matching entry point reuses existing geographic/profile matching and `ServiceCoverage.freeSchedule`, filters AVAILABLE and future start before LIMIT. Generic suggestions remain unchanged.
- `backend/src/main/java/in/nammacrew/notification/NotificationService.java`: broadcast requires OPEN, owner-scoped requirement; row lock serializes retries of the same requirement; existing event lookup prevents repeat delivery. No migration or alternate overlap rule introduced. Existing broad exception catches/capped fan-out remain reliability limitations for the later delivery/outbox work.
- `backend/src/test/java/in/nammacrew/notification/NotificationIT.java`: overlap/adjacent schedule and out-of-coverage/unpublished scenarios added to existing unavailable/matching/retry/rollback coverage.
- `mobile/src/__tests__/notification-screen.test.tsx`: 20 focused cases covering supported routes (both booking roles), invalid IDs/recipient/role, inaccessible/closed resources, loading/empty/error/retry, mark-read/mark-all failures, badge synchronization, logout and delayed cross-account results.

### Exact verification

| Gate | Result |
| --- | --- |
| Focused mobile tests | 23 passed (20 new screen/session/routing + 3 existing HTTP helper tests) |
| Full mobile | **110 passed, 17 suites, 0 failed**; typecheck/lint/format all exit 0 |
| Full backend | **93 passed, 0 failed/errors/skipped**: 4 unit + 89 integration, including 8 NotificationIT scenarios |
| Backend formatting and Failsafe verification | PASS after formatting the two changed service files; full suite was already green |
| Protected bookings/quotations/reservations | Complete row equality retained against previous snapshot, SELECT-only check |
| Admin | Unchanged; retained previous 2 passing tests and quality gates; not redundantly rerun |

Evidence: `verification/notification-closure-focused-mobile-final.log`, `notification-closure-mobile.json` and per-gate logs; `notification-closure-backend-counts.json`, `notification-closure-backend-full.log`, `notification-closure-backend-final-gate.log`; `notification-closure-preservation.json`.

Initial focused tests exposed an invalid synthetic booking without required request/quotation reference and exact-string matcher expectations. The fixture now creates a genuine isolated quote/booking through services; assertions match intended text using regex. No production constraint was relaxed. The initial formatter invocation's pipe pattern was interpreted by the Windows wrapper; corrected with one exact file pattern per invocation. Full backend `clean verify` ran all tests successfully and failed only formatting; after targeted formatting, `spotless:check failsafe:verify` passed using those test reports. No tests were skipped or hidden.

### Metro and Android result

Metro PID 12284 on 8083 remained running; no restart, cache wipe, toolchain installation or security changes were needed. The previous generic/non-lazy bundle probes were not representative of the installed client's URL: the generic response lacked app routes, while the full non-lazy probe timed out. Using the **actual Android URL recovered from logcat**, including `lazy=true`, `transform.routerRoot=src%5Capp`, Hermes/client options, returned **HTTP 200**, **12,385,064 bytes**, and contained the new account guard and closed-opportunity fallback. Evidence/hash: `verification/notification-closure-bundle.json`; raw headers/bundle in `.tools/notification-closure-native-*`. A direct navigation module probe also returned current source. These results establish working client-specific delivery; the exact reason the non-lazy transform exceeded its deadline is not proven, so no speculative configuration change was made.

ADB reverse mappings for 8083/8080 already exist. Emulator → `10.0.2.2:8080/actuator/health` returned HTTP 200/UP. The installed app was reloaded via its React Native reload broadcast, without clearing data. `verification/notification-closure-reload.log` records a new **Running main at 15:19:30**, with no subsequent error in that captured window. `verification/notification-closure-screen.png` shows the customer dashboard and bell after reload. Combined with the exact-client bundle source check, this supports successful current development-JS reload; it is not a signed release build attestation or complete notification acceptance.

Installed APK remains the existing debug client, not a newly installed APK. The corrected backend is compiled/packaged and tested in disposable databases, but the existing backend process on 8080 was **not replaced** in this task. Its UP result does not prove it runs the new schedule filter. Native end-to-end schedule verification requires activating the new backend first.

### Remaining native acceptance steps

1. Activate the corrected local backend with the existing development database/configuration, preserving data; confirm health and migrations before testing.
2. Using NEW isolated customer/worker accounts and future dates, verify both bells, publish an isolated eligible job, and confirm only schedule-eligible/in-coverage AVAILABLE workers receive WORK_AVAILABLE. Compare an overlapping reserved worker and an adjacent non-overlapping worker.
3. Submit isolated quotes, test received/accepted/rejected links, and cancellation on an isolated booking; verify correct IDs, authorized screens, unread decrement, mark-all, and no duplicates on retry. Do not use protected bookings or change Worker A/C/E.
4. Test offline list Retry, single/all-read failure and retry; inaccessible/deleted or closed-opportunity safe fallback. Rejected historical quotes should open My Quotes even when the job has closed.
5. Switch isolated accounts during an in-flight request and verify no old content/count flashes, including after logout/back/restart. Automated coverage passes, but this full native flow has not been exercised.

Customer bell rendering and reload are verified; worker bell, notification tapping, writes, and account switching are **PENDING native acceptance**, not PASS. No protected notification was marked read, no job published, and no quotation/booking mutation was made in the development database. No commit/push/tag/deploy or Phase 5 work occurred.

---

## Notification integration final gate — 13 October 2026

This section supersedes earlier regression counts and V11-only statements below. Branch remains `phase-4-development`. **Development milestone: NOT READY FOR USER SIGN-OFF. Public launch: NOT READY.** Background push is **NOT IMPLEMENTED**. Backend dependency vulnerabilities remain **UNASSESSED**.

### Final regression evidence

| Gate | Actual result | Evidence |
| --- | --- | --- |
| Backend full suite, Java 21 / disposable PostGIS | **PASS: 91 tests, 0 failures, 0 errors, 0 skipped** — 4 unit + 87 integration; NotificationIT now 6 | [Counts](verification/notification-gate-backend-counts.json), [full execution](verification/notification-gate-backend-final.log) |
| Backend formatting / result verification | **PASS** after formatting the added test; `mvnw.cmd -o -B -ntp spotless:check failsafe:verify`, exit 0 | [Final gate](verification/notification-gate-backend-format-final.log) |
| Mobile full suite | **PASS: 90 tests, 16 suites** | [Jest](verification/notification-gate-mobile-final-test.log) |
| Mobile typecheck, lint, formatting | **PASS**, all exit 0 | [Gates](verification/notification-gate-mobile-final.json) |
| Admin full suite | **PASS: 2 tests, 1 suite** | [Tests](verification/notification-gate-admin-test.log) |
| Admin typecheck, lint, formatting, production build | **PASS**, all exit 0 | [Gates](verification/notification-gate-admin.json) |
| V1–V12 integrity | **PASS**: applied successfully in disposable suites; all 12 successful in development DB; line-normalized CRC32 source checksums match recorded Flyway checksums | [Checksum comparison](verification/notification-gate-migration-checksums.json) |
| Protected records | **PASS**, complete row equality for 3 bookings, 4 quotations, 3 reservations against recovery baseline | [Comparison](verification/notification-gate-preservation.json), [read-only snapshot](verification/notification-gate-protected.json) |

The first backend `verify` run had 89 tests total, with four failures from assertions still expecting V11 rather than V12. They were corrected to assert version/count 12 after inspecting the actual new migration; no migration or production database was changed. The subsequent `clean verify` executed all 91 tests successfully but failed its formatting gate on the newly added test. Only that test was formatted, then Spotless and Failsafe result verification passed. The final verification command reuses those successful test reports; it does not claim to rerun 91 tests. Original failed logs are preserved.

The initial mobile lint failed on two conditional hooks in NotificationBell. Router usage now resides in the authenticated child component; the parent reads QueryClientContext unconditionally. No hook errors were suppressed. Full mobile tests and all gates were rerun successfully.

Files changed in this task:
- `backend/src/test/java/in/nammacrew/FoundationIT.java`: V12 migration count.
- `backend/src/test/java/in/nammacrew/auth/MigrationIT.java`: V12 terminal version assertions.
- `backend/src/test/java/in/nammacrew/notification/NotificationIT.java`: two isolated rollback/failure tests, formatting.
- `mobile/src/components/NotificationBell.tsx`: valid hook ordering.
- This report and `docs/verification/notification-gate-*` evidence.

No production service logic, migration, dependency, protected record, account, booking or cancellation history was changed. Integration fixtures use `jdbc:tc:postgis:17-3.5:///phase4_validation`; their TRUNCATE operations affect disposable test containers only. Development SQL used BEGIN READ ONLY and SELECT/ROLLBACK. No deployment, commit, push, stable tag or Phase 5 implementation occurred.

### Verified behavior and limits

- Existing quotation, acceptance/concurrency, worker eligibility, geographic coverage, cancellation/reservation, authorization, draft and publishing suites remain passing. ServiceCoverageIT: 24; QuotationConcurrencyIT: 4; QuotationIT: 6; CancellationPresentationIT: 2.
- NotificationIT verifies quote-received to customer; quote-accepted to winning worker; cancellation to counterpart; read/unread and mark-all behavior; recipient-scoped list and mutations; wrong trade/BUSY exclusion; sequential work-available deduplication; repeated acceptance returns the original booking without another notification.
- Cross-user mark-read deliberately returns **204 with no change**, not 403/404. The other account cannot list the private notification or change its read state. The isolation assertion checks the original row remains unread.
- Added rollback test inserts both quote-received and quote-accepted notifications inside an outer transaction, forces an exception, then asserts zero notifications, quotations, bookings and reservations and the original OPEN requirement. Added failure test checks unauthorized acceptance emits no acceptance notification, then repeated cancellation emits no extra cancellation notification and reservation is released.
- Notification writes join the marketplace transaction. Broad caught exceptions do **not** guarantee that a database error is harmless: an aborted/rollback-only transaction can still fail the main action. Delivery failure injection and observability remain gaps; no blanket reliability PASS is claimed.
- Work-available broadcast uses MatchingEngine geographic/trade/account filters, then AVAILABLE status, capped at 20 recipients from up to 50 suggestions. That matching query does not check booked schedule overlap. A worker marked AVAILABLE but booked for the job dates may receive an unusable opportunity notification, although quotation submission/acceptance still enforce schedule eligibility. Resolve this or explicitly limit milestone acceptance before sign-off.
- WORK_AVAILABLE deduplication is SELECT-then-INSERT with no unique event constraint. Normal publication holds the requirement row lock and repeated OPEN publication is rejected, which limits the normal-path race. Direct concurrent broadcast/retry uniqueness is not proven; do not describe this as universally duplicate-safe.
- The three mobile notification tests exercise mocked HTTP helpers only. They do not prove native bell/list interaction, navigation, unread refresh or account-switch privacy.

### Current Android / Metro evidence

ADB reports `emulator-5554 device`. Installed `in.nammacrew.mobile` is version 1.0.0/code 1 with **lastUpdateTime 7 October 2026 14:25:53**. The separately built x86_64 debug APK remains `mobile/android/app/build/outputs/apk/debug/app-debug.apk`, 78,956,130 bytes, built 13 October 10:02:35; it is not thereby proven installed. No new APK build or installation was performed for this gate.

Metro PID 12284 was identified as this project's Expo CLI on port 8083 and `/status` returned `packager-status:running`. A local Android development-bundle request timed out after 60 seconds. Thus server liveness is **PASS**, but delivery of the exact current source to the installed app is **BLOCKED / NOT VERIFIED**. The latest bell fix has no demonstrated native replay. Debug APK evidence is not production JS bundle evidence.

[Read-only screenshot](verification/notification-gate-emulator.png) shows the app open on Test Customer's profile, with the recently styled white logo tile. That supports only that an app UI is rendered; it does not verify notification behavior. No account was switched, no historical notification marked read, and no marketplace action was performed on this session.

| Native acceptance item | This gate |
| --- | --- |
| Customer bell | Reported previously; present in source; **NOT independently exercised** |
| Worker bell | Reported previously; present in source; **NOT independently exercised** |
| Correct-account list | API isolation PASS; native **PENDING** |
| Unread count / mark as read | Backend PASS; native **PENDING** |
| Authorized notification deep links | Source paths reviewed; native **PENDING**; QUOTE_REJECTED has no route handler |
| Logout / account switching | Per-user query keys exist; cache is not explicitly cleared/cancelled on logout; native delayed-request switch test **PENDING** |

Exact manual acceptance steps (use NEW isolated customer and worker accounts, never Worker A/Worker E or protected jobs):
1. Confirm Metro serves the latest Android JS and record APK identity, Metro port and source revision. Sign into isolated Customer A, open Find Workers/My Jobs and capture the bell.
2. With isolated Worker B, open Opportunities/Schedule and capture the bell. Customer A creates and publishes a valid isolated future job inside B's coverage. Refresh B's list; confirm WORK_AVAILABLE and intended opportunity ID.
3. B submits one quote. In A, confirm QUOTE_RECEIVED and unread increment; tap it, confirm the correct requirement screen, return and confirm read state/count. Reopen and verify it stays read.
4. A accepts B's quote once. In B, confirm one QUOTE_ACCEPTED notification opens the correct authorized booking. Refresh/revisit without another acceptance notification. Cancel only this isolated booking with a reason and verify the counterpart's cancellation deep link and metadata.
5. Test mark-all-read on isolated notifications. Deny access by opening that isolated booking while signed into an unrelated isolated account; expect no private details.
6. While A's notification request is delayed, sign out and sign in as unrelated Customer C. Confirm no A titles/messages/count appear, including during loading, refresh and back navigation. Repeat worker/customer switching; restore the desired account afterward.
7. Record screenshots, IDs, expected/actual counts and failures. Test notification fetch/read failures: the current screen can incorrectly show “All caught up” on fetch errors and does not present read-mutation errors; these require UX correction, not a false PASS.

### A. Phase 4 development sign-off blockers

1. Close the native matrix above on the exact current source; resolve the bundle timeout and reconcile installed APK/source identity. Earlier rendering reports are not full acceptance.
2. Correct/agree notification-specific gaps: schedule-aware work-available recipients, QUOTE_REJECTED tap destination (currently no-op), visible fetch/read failure states, and account-switch/race evidence. These are focused integration follow-ups, not authorization to start Phase 5.
3. Preserve earlier critical Phase 4 native gaps and explicit development dependency-risk disposition from the prior audit. Automated regression is now green; it is not a substitute for native acceptance or security assessment.

**Development recommendation: NOT READY FOR USER SIGN-OFF.** Lack of background push alone need not block a private in-app-only milestone, provided that limitation is explicitly accepted; it is required before public launch below.

### B. Phase 5 / required pre-public-launch backlog (planning only)

| Requirement | Acceptance evidence needed before public launch |
| --- | --- |
| Expo Notifications + Android FCM | Implement native background delivery using approved compatible packages; retain in-app inbox as source of truth |
| Firebase / EAS project and credentials | User-approved accounts, package identity, service credentials held server-side, separate development/production environments; no credentials committed |
| Device registration / logout cleanup | Authenticated token registration and rotation, multi-device policy, disable/unbind tokens on logout/account switch and invalid-token responses; no delivery to former account |
| Android notification permission | Runtime permission flow and channels; denied-permission fallback without losing inbox access |
| Transactional outbox | Persist notification event/outbox atomically with marketplace transaction, deliver after commit; prove no push on rollback |
| Retries / duplicate protection | Bounded retry/backoff, persistent attempt state/dead-letter handling, unique event/recipient/channel key, idempotent consumers and concurrent retry tests |
| Preferences / privacy | Per-category opt-ins, device/channel controls and quiet-hours policy; safe lock-screen text, avoid leaking cancellation reasons or sensitive job details |
| Physical Android validation | Real-device tests with FCM credentials, multiple accounts/devices and network reconnection |
| Background / terminated / lock-screen | Prove all three delivery modes and notification tap routing through authentication/authorization; test app restart, stale/deleted references and revoked sessions |
| Reliability / observability | Failures visible in metrics/logs and retry controls; schedule-eligible fan-out, pagination/cap policy, no swallowed failures falsely reported as delivered |
| Broader launch security | Backend vulnerabilities **UNASSESSED** until reliable scan; reconcile current JS advisories, production OTP/auth/secrets/TLS and existing operational launch gates |

No push dependency was installed, no Firebase/EAS account or credential created, and no background delivery PASS is claimed.

---

## Earlier recovery evidence (historical; notification gate above is current)

## Candidate and scope

Branch `phase-4-development`; HEAD `93e3eb2c3fd192afaf69b32e70e8ae826e90f953`. HEAD alone does not identify the complete candidate: implementation, tests, migrations and UI assets remain uncommitted. The verification snapshot listed 62 tracked modifications and 265 untracked files (327 entries with `git status --porcelain -uall`, including evidence outputs). See [status inventory](verification/milestone-git-status-20261013.txt) and [source SHA-256 manifest](verification/milestone-source-manifest-20261013.json). These counts are a snapshot, not a claim that this recovery created those changes.

Reviewed the final audit, geographic correction, dependency-security review, native readiness and Defects 10/11 reports against current source. No dependency upgrade, backend edit, database mutation, APK installation, commit, tag, push, deployment or Phase 5 work was performed. Docker Desktop was started normally for disposable Testcontainers verification. Existing development data and emulator data were not reset.

## Regression results

| Gate | Result | Evidence |
| --- | --- | --- |
| Java 21 `mvnw.cmd -o -B -ntp clean verify` | PASS: 85 tests, 0 failures/errors/skips; 4 unit + 81 integration; 1m49s | [Backend log](verification/milestone-backend-20261013.log), [XML counts](verification/milestone-backend-counts-20261013.json) |
| Spring Boot package and Spotless | PASS within the same verification | Backend log |
| Flyway V1–V11, PostgreSQL/PostGIS, concurrency/security | PASS in disposable test databases; live history separately has all eleven successful migrations | Backend log and protected-record evidence |
| Backend result reuse during recovery | No backend source/POM hash changed; no redundant backend rerun | [Hash comparison](verification/recovery-backend-reuse-20261013.json) |
| Full mobile Jest | PASS: 87 tests / 15 suites, 0 failed; 39.364s | [Current log](verification/recovery-mobile-test-20261013.log) |
| Mobile TypeScript, ESLint, original format gate | PASS, exit 0 for each | [Gate exits](verification/recovery-mobile-results-20261013.json) and corresponding `recovery-mobile-*` logs |
| Mobile dependency compatibility script | PASS | `milestone-mobile-test-dependencies-20261013.log` |
| Expo `install --check` | PASS against installed offline compatibility data; CLI warns offline validation is less reliable | `milestone-expo-check-20261013.log` |
| Expo Doctor | Not newly executed; not installed in project dependencies. Compatibility check is not a full Doctor result | No new Doctor PASS claimed |
| Admin tests | PASS: 2 tests / 1 suite | `recovery-admin-test-20261013.log` |
| Admin TypeScript, ESLint, original format gate, production Vite build | PASS, exit 0 for each | [Gate exits](verification/recovery-admin-results-20261013.json) and corresponding `recovery-admin-*` logs |
| Native acceptance | No new acceptance flow executed in this audit/recovery | Historical evidence and remaining steps below |
| Android debug APK | PASS: exit 0, 18m28s, x86_64; 317 tasks (114 executed, 203 up-to-date) | [Build log](verification/milestone-android-20261013.log), [artifact evidence](verification/recovery-android-artifact-20261013.json) |

The initial mobile result was **83 passed / 4 failed**, and both formatting gates failed. Those logs remain intact. Final passes do not erase these findings.

## Four failures: diagnosis and correction

1. **Onboarding: stale copy expectation.** The test expected “What brings you here?” / “I am a worker”; the actual role-selection page now says “Let's build your profile.” / “I'm here to find work”. The button still calls `selection.mutate('WORKER')`. The test now waits for the accessible heading and presses the visible worker button. Its POST body `{role:'WORKER'}` and identity reload assertions remain.
2. **Three publishing failures: obsolete test ID after shared Action migration.** The DRAFT UI has a button labelled “Publish Requirement” and the existing confirmation → `updateRequirementStatus(id,'OPEN')` → refresh path. The old `publish-button` test ID was lost when the bespoke Pressable became Action. Tests now use button role plus accessible name for presence, absence and interaction. Success, error and CLOSED/CANCELLED/OPEN restrictions remain asserted; no assertions were removed and no dummy test ID was added to mask behavior.

No application mutation logic changed. Current backend owner-scoped status transitions, draft edit version checks and authorization tests remain supported by the 85-test run. Frontend component mocks do not replace server authorization evidence.

## Formatting and evidence preservation

The `npm_audit_mobile.json` and `npm_audit_admin.json` files contain valid **UTF-16 JSON**, not corrupt advisory data. Prettier attempted UTF-8 parsing and rejected the byte-order marker. The `_utf8.json` versions also parse successfully. All four originals remain byte-for-byte untouched; their sizes, encodings and SHA-256 hashes are recorded in [encoding evidence](verification/recovery-audit-encoding-20261013.json).

Each project's `.prettierignore` now explicitly excludes its two generated audit reports and `.stitch/` imported design-reference workspace. This excludes evidence/reference material, not application source. Corrected formatting only in the flagged mobile worker-details source and deployed `admin/public/Dashboard.html`; formatted the edited tests and removed the unused Pressable import in requirement details. The original `npm run format:check` commands subsequently passed in both projects. No global formatter sweep or deletion of evidence was used.

Recovery files modified:
- `mobile/src/__tests__/onboarding.test.tsx`
- `mobile/src/__tests__/requirement-publish.test.tsx`
- `mobile/src/app/(customer)/requirement/[id].tsx` (unused import only)
- `mobile/src/app/(customer)/worker/[id].tsx` (format only)
- `mobile/.prettierignore`, `admin/.prettierignore`
- `admin/public/Dashboard.html` (format only)
- This report and new verification artifacts.

## Android build — PASS, native acceptance separate

The interrupted build session was still running and was allowed to complete. It was not restarted or replaced with a download. From `mobile/android`, using the existing local Java 21, Android SDK and cached Gradle 9.3.1 configuration:

```powershell
./gradlew.bat :app:assembleDebug --offline --no-daemon --max-workers=1 '-PreactNativeDevServerPort=8083' '-PreactNativeArchitectures=x86_64' '-Porg.gradle.java.installations.paths=D:/Files/EDUCATION/NammaCrew/.tools/jdk17-local/jdk-17.0.20.1+1' '-Porg.gradle.java.installations.auto-download=false'
```

Process environment used `JAVA_HOME=D:/Files/EDUCATION/NammaCrew/.tools/jdk21-local/jdk-21.0.12.1+1`, `ANDROID_HOME` and `ANDROID_SDK_ROOT` pointing to `.tools/android-sdk`, and `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=D:/Files/EDUCATION/NammaCrew/.tools/java-sockets`. Existing Java 17 compiler toolchain was explicitly available; no tool installation or dependency upgrade occurred.

- Outcome: **BUILD SUCCESSFUL**, exit **0**, **18m 28s**.
- APK: `D:\Files\EDUCATION\NammaCrew\mobile\android\app\build\outputs\apk\debug\app-debug.apk`.
- Size: **78,956,130 bytes**; modified **[event timestamp retained in encrypted evidence] +05:30**.
- SHA-256: `5CF0A365F6782F88C4899E94192032FE4D3D10DC9F48E41E0DD2948143C3FB05`.
- ZIP inspection confirms x86_64 native libraries and no embedded `.bundle`/`.hbc` JavaScript bundle.

Current workspace native sources were compiled. This debug variant obtains application JavaScript from Metro (port 8083); compiling it does **not** prove the current JS is embedded, loaded on the emulator, or natively accepted. No installation or native acceptance is claimed here. SDK XML version and Gradle deprecation warnings remain visible in the original log; they were not suppressed. This is an emulator-targeted debug artifact, not a production release candidate for all Android architectures.

## Protected acceptance records — PASS, read-only

Queries used `BEGIN READ ONLY` and SELECT only. [Current rows](verification/recovery-protected-records-20261013.json), [participant summary](verification/recovery-protected-summary-20261013.json) and [comparison](verification/recovery-preservation-comparison-20261013.json) confirm complete equality of all fields in 3 bookings, 4 quotations and 3 reservations against `.tools/final-audit-before.txt`.

| Requirement / worker | Preserved result |
| --- | --- |
| Phase 4 acceptance carpenter / Worker A | CONFIRMED, 8–10 October, INR 2,500 PER_WORKER_PER_DAY; ACCEPTED quote; reservation true |
| Phase 4 Competing Quotes Test 2 / Worker A | CONFIRMED, 15–17 October, INR 4,500 FIXED_TOTAL; ACCEPTED quote; reservation true; competing INR 4,000 quote remains REJECTED |
| Phase 4 cancellation Test / Worker E | CANCELLED, 22–23 October, INR 1,000 FIXED_TOTAL; quotation remains ACCEPTED; reservation false |

Cancellation reason remains “[private cancellation text withheld; nonblank reason verified]”; actor Test Customer; timestamp `[event timestamp retained in encrypted evidence]`. All three associated requirements remain CLOSED. No publication, cancellation, reopening or worker-profile change was made. Confirmed dates in the past were not automatically transitioned or rewritten.

## Implemented workflow and geography assessment

Current implementation and passing isolated tests support draft create/edit and stale-update prevention; persisted canonical locations; owner-only reads and mutations; worker identity/availability; opportunity filtering; quote submission/update/withdrawal; competing acceptance serialized by requirement lock; rechecked worker/profile/coverage/schedule eligibility at first acceptance; idempotent accepted retries; price/schedule transfer; unique winner and overlap constraints; cancellation authorization, immutable history and reservation release. Suites include DraftEditingIT, MarketplaceControllerIT, QuotationIT, QuotationConcurrencyIT, CancellationPresentationIT and 24 ServiceCoverageIT cases.

The old audit's unscoped customer direct-read and acceptance-time recheck findings have subsequent source/test evidence: RequirementService scopes customer reads; matching uses customer ownership; first acceptance locks worker identity/profile and calls the shared eligibility predicate. This is closure of those tested cases, not a universal authorization certificate.

Find Workers, suitable-worker suggestions, opportunities, quote submission and first acceptance share `ServiceCoverage.geographic`. Canonical city identity supports radius/district/state/nationwide coverage. Multiple selected states are OR alternatives independent of the worker's home state. District inference requires a source-verified, unambiguous catalogue relationship.

GPS-only points deliberately match radius coverage (or applicable legacy radius) only. Nationwide-only workers are excluded because arbitrary GPS coordinates do not establish a verified country/state/district. Nationwide plus radius can match by radius. Both Find Workers and JobLocationPicker explicitly explain that choosing a catalogue city includes state/district/nationwide workers; confirming the city replaces the GPS point with its approximate city centre. No automatic boundary resolution is claimed.

Remaining distinction: suggestions label generic profile availability as “Currently available” without a schedule conflict check; opportunities/quotes/acceptance do check dates. This misleading wording remains a launch issue, not evidence that overlapping acceptance is allowed.

## Native evidence: what is and is not verified

| Scenario | A: historical Android evidence | B: current automation | C: remaining native gap |
| --- | --- | --- | --- |
| Draft Back / Keep / Discard / reopen | Defect 10 report and `defect10-native-final-warning/keep/reopen` images; warning image directly inspected | Draft-editor suite passes | Repeat after recent UI/navigation edits on isolated draft |
| Saved canonical location and Save → Reopen twice | User-reported verification recorded in geographic correction; not an independently inspected screenshot sequence | Draft/location tests pass | Capture same-ID/version/location sequence for exact current candidate |
| New location picker and GPS confirmation | User-reported confirmation; city-picker historical screenshots exist | Location/picker/discovery suites pass | Current native permission denial → manual fallback |
| Competing quotes / one winner / losing worker | Historical records and reports corroborate outcome | Quotation/concurrency tests pass | Full paired customer/worker native walkthrough not established for current candidate |
| Cancellation history and metadata | Worker E Details screenshot directly inspected: CANCELLED, reason, actor/time; My Quotes artifact exists | Cancellation backend/mobile tests pass | Separate customer native metadata walkthrough |
| Karnataka Closepet multi-state discovery | No specific screenshot-backed Closepet sequence found in reviewed evidence | Multi-state coverage/acceptance tests pass | Explicit Closepet native discovery and eligible quotation check |
| GPS-only results | User reported visible boundary disclaimer | GPS radius-only and manual fallback tests pass | Paired native results proving nationwide-only excluded and radius worker included |

No new native PASS is inferred from tests or compilation.

## Remaining priorities and required actions

| Priority | Finding / required action |
| --- | --- |
| P0 — development sign-off | Complete the missing critical native matrix on the identified current candidate. UI changes postdate some historical screenshots. Retain actual evidence; do not treat compilation as acceptance. |
| P0 — development risk decision | Record explicit private-development risk acceptance, owners and containment for dependency uncertainties. No blanket critical/high dismissal or implicit approval. |
| P1 — backend vulnerabilities | **UNASSESSED**. Prior OWASP scan failed; inventory is not a scan. Obtain reliable current vulnerability data and triage before public launch. |
| P1 — JavaScript dependency evidence | 9 October review recorded mobile 12 moderate/54 high/1 critical and admin 2 moderate/6 high. These are historical counts, not a current clean audit. Mobile lock hash changed to `a03e4d48759265f501ad9abe84a3d77a09da1b260222c077ef0f957a9088fe3e` (manifest now includes dev ngrok); admin hash still `1c4b11f5912be6d6513407e89cde23f3a8ed14fdb4b41cbbf0504423cb5be344`. Interrupted current reconciliation remains incomplete. |
| P1 — exposure / CI | Historical production JS source-map evidence excludes shell-quote/react-devtools-core, but includes decode-uri-component. Current runtime reachability, native/signed-release contents and tooling/CI exposure remain unverified. CI YAML has read-only contents permission and no explicit secret references; that is not proof of all repository/environment protections. |
| P1 — production auth/config | Production OTP provider still fails closed with 503 until an approved SMS provider is configured. Verify HTTPS endpoints, secrets, dev-profile exclusion and abuse controls before real users. |
| P1 — operations / release | Signed reproducible release, backup restoration, monitoring, privacy/retention, support and incident procedures need evidence and owners. |
| P1 — suitability wording | Clarify generic availability or check requirement dates in suggestions; add booked-but-AVAILABLE regression. |
| P2 — geography | Verified point-in-boundary data, exact GPS worksite plus canonical jurisdiction; retain city fallback until supported. Current limited GPS contract is explicit, not a silent fix. |
| P2 — lifecycle | Repost as a new job after cancellation; specific duplicate-quote errors; rescheduling/completion/dispute policies; no silent reopening of history. |
| P2 — marketplace reliability | Candidate-location dirty state, discovery deduplication/pagination, date expiry and quote schedule semantics, team capacity, notifications, session resilience and trust/moderation workflows. |
| P3 | Further presentation polish, localization, ranking explanations and expanded device/accessibility coverage. |

### Exact manual acceptance steps

Use new isolated test identities/records and future, nonconflicting dates. Do not edit A/C/E or the protected CLOSED requirements.
1. Create an isolated Krishnagiri draft, save and reopen twice; record ID, location labels and dates. Edit title, test Android/header/tab Back with Keep Editing and Discard, then confirm discarded text is absent.
2. Deny GPS permission, select Tamil Nadu → Krishnagiri manually, confirm location and save the isolated draft. Verify IDs/coordinates after reopen.
3. With an isolated worker covering Karnataka and Tamil Nadu, choose Karnataka → Closepet in Find Workers and on an isolated job. Verify discovery, opportunities and quotation eligibility; verify an out-of-coverage job is excluded.
4. Compare GPS-only searches with a radius worker and a nationwide-only worker; verify restriction copy. Switch to canonical city and confirm administrative coverage returns.
5. Publish only the isolated valid draft. Two isolated workers submit quotes; accept one, verify one confirmed booking and no booking for the loser across customer/worker sessions.
6. Cancel only that new booking with a reason. Verify CANCELLED on both sides, reason/actor/time, preserved ACCEPTED quote history and released schedule. Read protected history only.

Before development sign-off: close native gaps, identify/freeze the reviewed candidate under user authorization, and record explicit dependency-risk disposition. Before public launch: additionally resolve P1 security, authentication, release and operational gates. No next phase is authorized by this report.

## Decision

Development milestone: **NOT READY FOR USER SIGN-OFF**.

PUBLIC PRODUCTION RELEASE: **NOT READY**. Backend dependency vulnerabilities remain **UNASSESSED**; passing regressions are not public security clearance.
