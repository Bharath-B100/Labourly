# Labourly L1 â€” UI/UX foundation review

14 October 2026. Implementation on `codex/labourly-l1-foundation`, starting from
`b82f84192871067d26628753a7e0a188b1789f4a`. This report supersedes L0's
planning-only permission statements for the explicitly approved L1 scope. No L2
implementation, commit, push, tag or deployment is authorized or performed.

## Reference and design decisions

The actual reference is `reference/crewza/crewza-16-screens.png`, SHA-256
`8f97dbb38d1051ba66576a7538e0f2a5be05d6e6e015ffde7e40998e31d061e9`.
The four interface colors are #FFCC25, #202326, #FFFFFF and #E5E7EB.
Photographs supplied by users retain their natural colors. The user subsequently supplied and approved a hard-hat Labourly identity.
Its wordmark and icon now replace the temporary geometric L. The original
reference and derived assets are retained under `mobile/assets/labourly/`;
the approved artwork retains its gold/charcoal shading. Original construction-
block intro artwork remains. No Crewza logo or illustration is used.
Platform fonts are used; no unlicensed font or new font download is required.
The static collage supplies no demonstrable animation specification. Existing
short press/reveal transitions respect reduced-motion settings.

| Reference | L1 implementation and deliberate adaptation |
| --- | --- |
| 01 Splash | Approved hard-hat icon on white, Labourly launcher label, centered JS session-restoration identity. Existing package ID, scheme and namespaces retained. |
| 02 Intro | Three introductory slides with headline, original construction graphic, progress dots, Previous/Continue/Get started and a working sign-in/skip action. No mutation of persisted profile onboarding. |
| 03 Category | Contractor, Engineer and Architect selection cards; Engineer maps to existing SITE_ENGINEER. Other existing customer types remain available. Categories never grant account roles. Existing hire/find-work entry and individual/team worker onboarding remain. |
| 04 Authentication | Centered identity and structured phone/code forms retain real OTP request, verification, resend, secure credentials, refresh and logout. Password, Google and Apple controls are intentionally absent. Artificial two-second verification delay removed. |
| 05 Navigation foundation | Customer Home / Workers / Jobs / Chat / Profile. Chat clearly states messaging is unavailable; it cannot send messages. Post and Bookings remain reachable through Home/Jobs/Profile. Worker Find Jobs / My Quotes / My Bookings / Profile retained. Full reference dashboard/trade grid remains L2. |
| 08 Truthful worker profile | Server-supplied photo/name/trade/experience/skills/location; removes fake 4.9/120 reviews and INR 500/day hire action. Real Post a requirement action leads into existing quote-to-book workflow. Global availability labeled worker-declared; no synthetic KYC badge. Full rates/reviews/languages/direct-hire design remains later work. |
| 16 Profile/settings | Account summary, edit, notifications, bookings, worker service-area entry, authorized role switching, verification explanation and logout. Missing legal/support/language services are explained instead of represented by inert controls. |
| 06â€“07, 09â€“10, 12, 14 | Existing discovery, location, draft, quotation, booking, cancellation and notification behavior retained with the shared four-color foundation. This is not a claim that their complete reference redesigns are finished. |
| 11, 13, 15 | Chat/calls, wallet/payments and saved-worker persistence are not implemented in L1. |

## Implementation boundaries

Shared components use white backgrounds, grey borders, 12-pixel cards/buttons,
yellow primary CTAs with charcoal text, scalable text and scrollable forms.
`Glass*` export names remain compatibility adapters for existing imports; the
active shared components no longer render the old glass raster backgrounds.
Navigation forwards tab events and retains the existing root/customer draft
guards. Tab bars account for bottom safe-area insets and font scale.

Account changes clear all React Query cached data, including notification and
marketplace queries. Role switches clear cached data and navigate only to roles
already present in the server session. They never invoke role assignment.
The backend remains the authorization boundary.

Native identity is generated from `app.json` and
`mobile/plugins/withLabourlyLaunch.js`, not hand-edited generated Java files.
No dependencies, lockfiles, backend code, migrations or admin functionality were
changed. Native prebuild regenerated the ignored Android directory; it does not
reset the installed app or database.

## Verification evidence

Private machine-local logs/screenshots live under `.tools/l1/` and are not staged.
They may contain account/device details and must not be committed without review.

- Full mobile regression: **119 passed, 0 failed, 0 skipped**, 18 suites;
  `mobile-tests-verified.log` and `mobile-results-final.json`. Final evidence was
  generated directly with `node node_modules/jest/bin/jest.js --runInBand --json
  --outputFile=../.tools/l1/mobile-results-final.json`; an earlier npm invocation
  consumed the report flags and produced only a console log.
- TypeScript and lint: passed after correcting the tab icon color prop to the installed Ionicons color type; `typecheck-final.log`, `lint-final.log`.
- Full original mobile formatting gate: passed; `format-gate.log`.
- Initial test run: two suites failed before execution because newly imported
  icons reached an Expo font dependency unavailable to Jest's resolver. The
  project's existing native-icon test mock was added to those suites. Application
  behavior assertions were retained; final Metro Android bundle compilation also
  succeeded. This is not a dependency vulnerability assessment.
- Existing foundation expectations now assert the actual three-slide intro and
  customer Home destination. New tests cover category mapping without privilege
  changes, retained worker service-area/bookings links, authorized role switching,
  cache isolation, logout, truthful worker details and unavailable chat.
- Existing full suite still exercises OTP/session, customer/worker onboarding,
  discovery/location/coverage, draft discard, publishing, quotations, bookings,
  cancellation consistency and notifications. Component tests are not native
  acceptance or a fresh backend integration run.
- Backend tests not rerun: backend code is unchanged. Previously preserved
  backend results remain historical evidence. Backend health returned UP.
- Read-only pre-validation protected-record comparison: bookings, quotations
  and reservations all match preserved evidence (`protected-before.json`).
- Reference hash matches the L0 source audit.
- Current Metro development bundle with `transform.routerRoot=src/app` contains
  the Labourly identity, new Home/Chat/worker-price copy, category mapping and
  launch screen. Evidence: `router-bundle-evidence.json`. A first diagnostic
  request omitted Expo's router root and did not contain application routes;
  it is not accepted as source-verification evidence. An intermediate request
  failed while CI-mode Metro had file watching disabled; a project-only Metro
  restart resolved the new-file lookup.
- Native library deprecation/SDK XML warnings and existing Jest asynchronous
  `act` warnings are retained in logs, not suppressed. Four new duplicate-import
  lint warnings were fixed; the final lint run has no warnings or errors.

## Android verification

Initial L1 native build passed (14m37s, 317 tasks). That APK was installed with
`adb install -r` and launched successfully; it used the earlier temporary L
launcher artwork. A subsequent build incorporating the user-approved hard-hat
identity is recorded in the brand-build section below. Neither debug APK
embeds the current JavaScript; development screens are delivered by Metro 8083.
The first Gradle attempt failed with `Unable to establish loopback connection`.
The retry uses the existing Java 21 local path, local Java 17 compiler toolchain
and process-only `-Djdk.net.unixdomain.tmpdir` workaround documented in Phase 4.
No TLS, firewall, registry or toolchain changes were made.

## Deferred work and release risks

- **L2:** Full Home/trade grid, worker-list/filter/profile reference reconciliation,
  saved workers, agreed pricing/hiring contracts, additional persisted actions.
- **L3:** Calendar/preferred-time/duration contracts, team capacity/assignment,
  projects/progress/attendance, reviews/disputes and operational admin controls.
- **L4:** Authorized messaging/private calls, payments/wallet/payouts/refunds,
  background push, provider credentials and reliable delivery infrastructure.
- **L5:** All sixteen screens reconciled, signed release, physical-device and
  production security/accessibility/load/operational acceptance.
- Backend dependency vulnerability status remains **UNASSESSED**. Existing
  JavaScript dependency risks are not fixed or reclassified by this UI work.
- Android debug/Metro validation cannot establish production bundle security,
  release signing or iOS behavior. No public-launch readiness claim is made.
- Native lifecycle/onboarding/role-switch/font-scale acceptance must be recorded
  individually; no unexecuted scenario is a PASS.
- Existing backend profile limitation: `ProfileService.draft()` derives a role
  from the first CUSTOMER/WORKER role and reads one onboarding draft per account.
  It has no explicit per-role profile retrieval contract. The new navigation
  switch does not alter that behavior or grant privileges. Native dual-role
  profile editing/coverage must be specifically reviewed before sign-off; the
  component role-switch test alone does not establish that both profile types
  can be independently edited. No backend or historical record was changed to
  conceal this limitation.

## Review gate

L1 remains at the user review gate. No L2 work or commit is automatic. Executed native
results, changed-file inventory and remaining blockers are listed below.


## Native checks actually exercised

All account checks used existing isolated notification-acceptance test accounts.
No protected customer/worker booking record was edited. Screenshots/XML are
machine-local private evidence in `.tools/l1/`; names, phones and IDs are not
reproduced in this report.

| Check | Result and evidence |
| --- | --- |
| Android device | PASS: emulator-5554 reports `device`; original AVD data retained. |
| Intro navigation | PASS: three slides, Continue/Get started and phone login rendered (`installed-start`, `intro-two`, `intro-three`, `otp-login`). |
| Customer OTP login | PASS: existing development OTP flow reaches authenticated Home (`customer-home`). This is not production OTP-provider verification. |
| Customer shell | PASS: Home, Chat's explicit unavailable state, working Go to my jobs and Profile (`chat-unavailable`, `customer-jobs`, `customer-profile-current`). |
| Warm start | PASS: task returns from Android Home (`warm-start.log`); no OS Home blocking. |
| Cold session recovery | PASS functionally: retained customer session reaches Home without another OTP (`cold-session-start.log`, `recovery-late`). Slow blank/startup periods under low host memory remain a performance limitation. |
| Customer logout then worker login | PASS: logout returns to intro; existing isolated worker login reaches worker opportunities (`logout-result`, `worker-verify`, `worker-restored`). |
| Worker quotations and bookings | PASS read-only rendering: an accepted historical quotation explicitly says Booking cancelled / CANCELLED; matching isolated cancelled booking displayed (`worker-quotes-confirmed`, `worker-bookings`). No quote acceptance/cancellation was executed anew. |
| Worker profile editor entry | PASS after route correction: `/profile` was ambiguous with role Profile tabs. Settings now targets authenticated root `/edit-profile`; actual editor/review and Edit details render (`editor-native-result`, `worker-details-readonly`). No profile Save was pressed. |
| User-approved logo | PASS JS rendering: supplied identity visible through shared Brand on native Profile (`profile-brand-loaded`, `current-profile-brand`). First capture contains Metro's transient Refreshing overlay; not a release screenshot. |
| Complete fresh onboarding | PENDING native: unit/component coverage passes, but new customer and individual/team worker onboarding were not completed and persisted during this run. Isolated pre-existing fixture draft fields are incomplete; no records were fabricated to hide that. |
| Dual-role editing/switch | PENDING native: component authorization/cache tests pass; existing backend profile ambiguity described above requires review with an isolated dual-role account. |
| Large font and small screen | LIMITED native check: 320dp × 640dp at 130% font; system size/font settings restored afterward (`accessibility-settings.json`). Initial worker Bookings label truncated; visible worker labels shortened, preserving full accessibility names. Final screenshots were visually reviewed: worker labels fit and active Profile has a yellow icon background; profile rows wrap and scroll. Only this shell/profile combination was exercised. Not full TalkBack/200%-font/device-matrix certification. |
| Backend reachability | PASS: customer/worker authenticated reads rendered from API at emulator-accessible 10.0.2.2:8080; host health UP. |
| Protected records after checks | PASS: SELECT-only comparison matches saved booking, quotation and reservation full rows; all V1–V12 source checksums match successful Flyway history (`database-final.json`). |

Native screenshots establish only the flows listed above. Marketplace mutation,
draft discard, cancellation and notifications remain covered by the complete
mobile regression and preserved Phase 4 evidence; this is not a claim that every
native scenario was rerun. No backend code changed, so no redundant backend
integration run was performed. Backend dependency vulnerabilities remain UNASSESSED.

## User-supplied brand integration

The approved identity includes the hard-hat/folded-L symbol, Labourly wordmark and
exact `Hire Local. Build Better.` tagline. Active local PNGs are `wordmark.png`,
`hardhat-mark.png` and `launcher-white.png`; the source collage is preserved as
`brand-reference.png`. The built-in image-generation tool prepared transparent
assets and an opaque white launcher version. They are reference-derived assets,
not claimed to be pixel-identical crops. See the asset README and hash manifest.
The interface palette is unchanged. Android resources are generated by the
existing Expo pipeline/config plugin; no image is fetched remotely at runtime.

The phrase “push as such” was applied as integration into the local app. No Git
push/commit/tag or deployment was performed; the explicit L1 review gate remains.

## Remaining L1 review items

- Complete native new customer and individual/team worker onboarding, including
  saved service coverage, with isolated accounts.
- Validate native dual-role switching and independent per-role profile editing;
  decide the existing backend profile contract before claiming full L1 sign-off.
- Broaden accessibility to customer five-tab shell, keyboard, TalkBack, 200%
  font and a physical device. Confirm long fields/forms stay usable.
- Profile settings intentionally disclose unavailable legal/support/language
  domains; public launch still requires the real policies and support paths.
- Review cold startup performance on a host/device without severe memory pressure.

L1 is implemented for review, but full L1 native acceptance is **NOT COMPLETE**.
No public-production readiness or automatic progression to L2 is claimed.


## Changed-file inventory

38 tracked files modified, 21 L1 files added locally. Existing unrelated
untracked evidence/assets remain preserved and unstaged. This is an inventory,
not a staging allowlist. No production backend, dependency lockfile, migration or
admin changes.

- `docs/LABOURLY_L1_IMPLEMENTATION.md`
- `mobile/app.json`
- `mobile/assets/labourly/README.md`
- `mobile/assets/labourly/asset-manifest.json`
- `mobile/assets/labourly/brand-reference.png`
- `mobile/assets/labourly/foreground.png`
- `mobile/assets/labourly/hardhat-mark.png`
- `mobile/assets/labourly/icon.png`
- `mobile/assets/labourly/launcher-white.png`
- `mobile/assets/labourly/mark.svg`
- `mobile/assets/labourly/monochrome.png`
- `mobile/assets/labourly/wordmark.png`
- `mobile/plugins/withLabourlyLaunch.js`
- `mobile/src/__tests__/foundation.test.tsx`
- `mobile/src/__tests__/labourly-foundation.test.tsx`
- `mobile/src/__tests__/onboarding.test.tsx`
- `mobile/src/app/(customer)/_layout.tsx`
- `mobile/src/app/(customer)/booking/[id].tsx`
- `mobile/src/app/(customer)/bookings.tsx`
- `mobile/src/app/(customer)/chat.tsx`
- `mobile/src/app/(customer)/discover.tsx`
- `mobile/src/app/(customer)/home.tsx`
- `mobile/src/app/(customer)/post.tsx`
- `mobile/src/app/(customer)/profile.tsx`
- `mobile/src/app/(customer)/requirement/[id].tsx`
- `mobile/src/app/(customer)/requirement/quotes.tsx`
- `mobile/src/app/(customer)/requirements.tsx`
- `mobile/src/app/(customer)/worker/[id].tsx`
- `mobile/src/app/(worker)/_layout.tsx`
- `mobile/src/app/(worker)/bookings.tsx`
- `mobile/src/app/(worker)/opportunities.tsx`
- `mobile/src/app/(worker)/opportunity/[id].tsx`
- `mobile/src/app/(worker)/profile.tsx`
- `mobile/src/app/(worker)/schedule.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/auth/login.tsx`
- `mobile/src/app/auth/verify.tsx`
- `mobile/src/app/edit-profile.tsx`
- `mobile/src/app/index.tsx`
- `mobile/src/app/notifications.tsx`
- `mobile/src/auth/queryIsolation.ts`
- `mobile/src/auth/session.ts`
- `mobile/src/components/GlassStartButton.tsx`
- `mobile/src/components/GlassTabButton.tsx`
- `mobile/src/components/IntroCarousel.tsx`
- `mobile/src/components/LaunchScreen.tsx`
- `mobile/src/components/LoginTransition.tsx`
- `mobile/src/components/NotificationBell.tsx`
- `mobile/src/components/ProfileSettings.tsx`
- `mobile/src/components/RequirementCard.tsx`
- `mobile/src/components/WorkerCard.tsx`
- `mobile/src/components/glass.tsx`
- `mobile/src/components/theme.tsx`
- `mobile/src/components/ui.tsx`
- `mobile/src/location/JobLocationPicker.tsx`
- `mobile/src/location/ServiceAreas.tsx`
- `mobile/src/onboarding/CustomerCategories.tsx`
- `mobile/src/onboarding/ProfileEditor.tsx`
- `mobile/tailwind.config.js`


## Latest regression closure

The final full Jest run reports 119/119 passing in 18 suites, zero skipped,
26.707 seconds (`mobile-results-final.json`). Typecheck, lint and original full
formatting gate are rerun after the navigation accessibility refinement;
`source-gates.json` records actual exit codes. The initially narrow string color
prop caused TypeScript failures and was corrected to the installed icon prop
type; no type assertion or compiler suppression was used.

## Brand build interruption

The first hard-hat rebuild log ended at app CMake compilation without an exit
marker or APK. Its process was absent when work resumed, so it is classified
INTERRUPTED/UNVERIFIED, not PASS. The exact cause is not established by the log.
A cached offline retry uses `android-brand-resume.log` and an explicit exit file.
The emulator was closed normally to free memory; no AVD wipe/reset was performed.
Backend 8080 and Metro 8083 remained running.

## Final branded Android artifact

- PASS build: `:app:assembleDebug --offline --no-daemon --max-workers=1
  -PreactNativeDevServerPort=8083 -PreactNativeArchitectures=x86_64`, using existing
  Java 21 and configured local Java 17 compiler toolchain, auto-download disabled.
  Successful retry: 4m50s, 317 tasks (49 executed / 268 up-to-date), exit 0.
- APK: `D:\Files\EDUCATION\NammaCrew\mobile\android\app\build\outputs\apk\debug\app-debug.apk`.
  Size **79,408,749 bytes**. SHA-256:
  `398182dae746d498763d8cbeee04186c12c9004bfede17ea428943c14d44b7c6`.
- PASS native packaging: `labourly_brand_icon` resource present in APK; generated
  adaptive launcher references the approved image and white background.
- PASS install: `adb -s emulator-5554 install -r` returned Success. Existing app
  data retained; no uninstall/reset. Emulator boot completed and state is device.
- PASS app startup/session restoration: activity launch Status ok (cold activity
  time 8462ms); after a prolonged Metro download/loading period the authenticated
  worker Opportunities screen rendered without another login. Evidence:
  `brand-launch.log`, `brand-apk-settled.png/xml`, `brand-installed-profile.png/xml`.
  Activity timing excludes completion of JS delivery; it is not app-ready latency.
- Startup limitations: Android Bluetooth system-service crashes appear in the
  emulator crash buffer. App log contains ReactNoCrashSoftException about window
  focus before context readiness, and startup is slow. The app process survived
  and rendered; these warnings are not suppressed or reported as absent.
- Final read-only protected-record comparison and V1â€“V12 checksums passed again
  after installation (`database-final.json`). No backend/admin/dependency changes.
- Mobile final gates: 119 tests passed / 0 failed / 0 skipped; typecheck, lint,
  full formatting all exit 0. Git diff whitespace check passes. Branch and HEAD
  remain `codex/labourly-l1-foundation` / baseline b82f84192871067d26628753a7e0a188b1789f4a.

**Review status: L1 implementation available for review, native acceptance still
incomplete for the explicitly listed onboarding/dual-role/accessibility cases.**
The new logo is integrated locally; nothing committed, pushed, tagged or deployed.
