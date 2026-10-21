# Saved Workers final stability and accessibility pass

Date: 2026-10-17. Branch: `codex/labourly-l1-foundation`.

## Recommendation: BLOCKED

Core saved-worker operations and mobile quality gates pass. Full native stability sign-off is withheld because duplicate React roots during Android display recreation are not fully resolved and spoken TalkBack/physical-device acceptance remains incomplete.

## Navigation diagnosis and correction

The root layout returned a launch/error screen instead of its Stack while session restoration was pending or failed. Thus navigator availability depended on an asynchronous session request. The index route also redirects completed sessions. This is an app-level mount-order hazard consistent with the recorded navigation-before-root error. The smallest correction keeps the root Stack and providers mounted and moves loading/error presentation into the index route; authenticated groups remain gated until restoration succeeds. No delay, warning suppression or authorization bypass was added.

A regression test verifies that the root navigator remains mounted across restoration, failure, restoration retry, completed customer state and logout. This is a component mount-contract test, not proof of every native linking path. Existing authorization/session/role tests remain in the full suite. Native concurrent role switching/logout during initialization has not been exhaustively exercised.

The multiple-linking warning is distinct. Local Expo Router source keeps a registry of mounted linking handlers. Logs show different React root tags running in one JS runtime during density/font recreation and reload. App source contains no custom NavigationContainer or second linking configuration. The Android manifest does not handle density/fontScale in-place, causing Activity recreation. Evidence supports duplicate native root instances as the warning trigger; the exact native cleanup defect is not yet proven or fixed. The JavaScript mount correction did not prevent the earlier native reproduction. A targeted native cleanup candidate was subsequently built and installed; its limitations are recorded below. No dependency upgrade or manifest configuration-change suppression was applied.

References consulted: installed Expo Router/React Native source and official Expo SDK 57 documentation; https://docs.expo.dev/versions/v57.0.0/ and https://docs.expo.dev/router/advanced/authentication-rewrites/.

## Mutation reliability

A new delayed-response test exposed a real issue: React Query can use updated mutation callbacks after an account switch, so closure-derived keys could write an old result into the new account cache. Mutation variables now bind the initiating user, credential epoch and worker. Both request execution and success publication reject changed identity; invalidation uses the initiating account. Same-resource mutation scopes serialize requests, status reads are cancelled before mutation, and a synchronous ref prevents repeated presses before React renders busy state.

There is no optimistic saved-state update: status changes only after server acknowledgement. Failure leaves the last confirmed state; rollback is therefore not applicable.

| Check | Result |
| --- | --- |
| Save → Remove → Save through native UI | PASS; final UI saved, database exactly one row |
| Repeated native taps during unavailable backend | PASS; busy state retained, no premature saved-state change |
| Failed native Remove | PASS; error shown, saved state retained, DB count one |
| Remove retry | PASS; changed to Save worker, DB count zero |
| Failed native Save | PASS; error shown, unsaved state retained, DB count zero |
| Save retry | PASS; subsequent sequence ended saved, DB count one |
| Delayed old-account response | PASS automated deterministic regression; no new-account cache pollution |
| Out-of-order same-resource mutations | Prevented by serial scope/pending guard; no claim that arbitrary network response ordering was injected on device |
| Account-switch native isolation | Prior acceptance PASS; protected accounts not used |

## Accessibility and icons

At 1080px / density 540 (320dp), font scale 2.0, all five destinations remain accessible. Adaptive visual labels are Hub, Crew, Jobs, Chat, You; full accessible names remain Home, Workers, My Requirements, Chat, Profile. Font scaling remains enabled. UI hierarchy confirms tab touch bounds exceed 48dp. Saved cards, long fictional names, profile actions and location content wrap and scroll; the remove action remains reachable. Arbitrary extreme-length names/locations were not exhaustively fixture-tested.

Malformed dropdown/check glyphs in ui.tsx were replaced by existing Ionicons chevron-up/down and checkmark, excluded from independent accessibility focus. Parent controls retain labels, expansion and radio selection semantics. Open/closed/selected dropdown states observed on Android.

TalkBack was installed and successfully bound as an accessibility service. Its first-run permission dialog prevented a reliable spoken-navigation walkthrough using available input; this is PENDING, not PASS. Previous accessibility settings restored. Physical-device testing PENDING. Emulator density restored to 420 and font scale to 1.0 after checks.

## Regression

- Full mobile: **132 passed, 20 suites**, zero failed/skipped tests in final run.
- Focused root/mutation tests: **7 passed**.
- Typecheck, lint, formatting: PASS.
- Earlier failures retained in private logs: delayed-account race regression failed before correction; three suites initially could not import icon font dependencies in Jest. Added the established native-icon mock to those suites without changing assertions. New test lint errors corrected.
- Backend source unchanged; no unnecessary backend test repeat. Previous focused 25-test evidence retained.
- Protected database bookings/quotations/reservations match read-only baseline; Flyway V1–V13 checksums and successful history match.
- Backend dependency vulnerabilities remain UNASSESSED.

## Files changed in this pass

- mobile/src/app/_layout.tsx
- mobile/src/app/index.tsx
- mobile/src/app/(customer)/_layout.tsx
- mobile/src/components/GlassTabButton.tsx
- mobile/src/components/SaveWorkerButton.tsx
- mobile/src/components/ui.tsx
- mobile/src/__tests__/root-mount.test.tsx (new)
- mobile/src/__tests__/saved-workers.test.tsx
- mobile/src/__tests__/foundation.test.tsx (icon mock)
- mobile/src/__tests__/draft-editor.test.tsx (icon mock)
- mobile/src/__tests__/ui.test.tsx (icon mock)
- This report and acceptance report status link.

Pre-existing uncommitted Labourly changes were preserved. No migration, production database, dependencies or protected fixtures changed. A formatting command initially ran from the repository root and resolved Prettier through npm's cache; it found no matching source files. Subsequent formatting used the installed mobile Prettier directly. No package manifest/lockfile upgrade was made.

## Private evidence and environment

`.tools/saved-stability/`: focused failure/final logs, verified-full/typecheck/lint/format logs, mutation DB counts, protected-final.json, TalkBack service dump, runtime logs. `.tools/saved-native/`: screenshots/XML named remove-pending, remove-failed-settled, remove-retry-pass, save-pending, save-failed-native, rapid-final, final-large-tabs, final-large-card, final-large-scrolled, large-location-details, dropdown-fixed-settled, dropdown-open-settled, and reproduction-after-fix.

These directories remain private/ignored; no evidence staged. App stays on isolated API 10.0.2.2:8084; original environment backup remains intact. Only disposable saved-worker fixtures changed. No commits, pushes, tags, deployment or new domain.


## October 17 continuation: native cleanup candidate and remaining blocker

Inspected installed Expo ReactActivityDelegateWrapper: onDestroy schedules cleanup in an application coroutine behind a mutex and loadAppReady. React Native unloadApp detaches its surface, while host reload can restart attached surfaces. This provides a plausible overlap mechanism, but does not conclusively identify every duplicate-root path.

Added `mobile/plugins/withActivityRootCleanup.js` and registered it in `mobile/app.json`. The generated MainActivity captures its own React delegate cleanup callback and invokes unloadApp before the wrapper's deferred destruction. Normal Activity recreation, font scaling and density changes remain enabled. The plugin rejects unknown templates and is idempotent. **This is a compiled native cleanup candidate, not a verified closure of the navigation defect.** The latest controlled reload plus density/font recreation still logged two root tags in one runtime. The app eventually rendered its introductory screen; that unauthenticated rendering does not prove authenticated redirects or account switching are safe. Full Root Layout/multiple-linking acceptance remains BLOCKED.

Build: Java 21, `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=8083 --offline --max-workers=2`. Final build PASS, 2m58s. APK: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`, 79,412,898 bytes. `adb install -r` returned Success. This debug APK uses Metro; it is not release-bundle evidence.

Build troubleshooting was process-local: applied the existing jdk.net.unixdomain.tmpdir workaround, aligned both Android SDK variables with the existing space-free project SDK path. Earlier failed attempts (loopback/socket, SDK mismatch, native linker path, Kotlin protected access) remain in private logs. No TLS, firewall, dependency or system-wide environment changes.

The emulator had a separate SurfaceFlinger driver stall. Restarted the same AVD with no snapshot load, without wiping its data. Screen capture recovered. Corrected its persisted development host from localhost:8083 to 10.0.2.2:8083 through native developer settings. Metro recorded bundle delivery. After the reproduction, restored physical density 420 and font scale 1.0. The API configuration remains the isolated 8084 environment.

Final regression: 132/132 tests, 20/20 suites PASS; typecheck PASS; lint PASS with zero warnings after correcting import order in the three touched icon-mock test files; formatting PASS. Native plugin checks passed idempotency, unknown-template rejection and cleanup ordering, but these are not lifecycle integration tests. No backend code changed during this pass. Read-only protected-record comparison passed again, including Flyway V1�V13 checksums.

New private evidence: `.tools/saved-stability/lifecycle-build-validated.log`, `apk-installed.json`, `plugin-checks.log`, `final-mobile-20261017.log`, `final-lint-20261017.log`, `final-format-20261017.log`, `continuation-typecheck.log`, `protected-final-20261017.json`, `patched-full-runtime.log`, `lifecycle-settled.log`. Screenshots/XML in `.tools/saved-native/`: `patched-launch`, `patched-host-dialog`, `lifecycle-recreation`, `lifecycle-settled`. Evidence stays outside Git staging.

Remaining gate: resolve duplicate native roots and rerun authenticated reload, recreation, logout and role-switch navigation; complete spoken TalkBack and physical-device checks. Do not treat the absence of a red overlay on the introductory screen as a native navigation PASS. No commit, push, tag, deployment or next feature started.
