# Labourly L1 continuation — 2026-10-16

Branch: `codex/labourly-l1-foundation`. HEAD:
`b82f84192871067d26628753a7e0a188b1789f4a`. Changes remain uncommitted.

## Implemented

- Responsive Home trade grid using the authenticated backend catalogue, with
  loading, empty, error and retry states. Tiles open filtered worker discovery.
  Unknown route identifiers cannot become API trade filters. Existing GPS and
  manual-city location handling remains in place. No sample prices or workers.
- Reference-style search/category/banner hierarchy in the Labourly palette.
  Latest native visual comparison is still pending.
- Additive authorized `GET /api/v1/profile/{role}` reads canonical completed
  customer/worker profiles. Profile navigation supplies the selected role.
  Legacy onboarding retrieval uses its recorded role; editing another role no
  longer overwrites that onboarding draft. Ambiguous role selection fails safely.
- Intermediate completed-profile editing steps no longer persist silently;
  explicit Save profile performs the authorized mutation.

Changed files for this continuation: backend `ProfileController.java`,
`ProfileService.java`, `AuthenticationIT.java`; mobile `ProfileEditor.tsx`,
`ProfileSettings.tsx`, `edit-profile.tsx`, customer `home.tsx`, `discover.tsx`,
and onboarding/discovery/Labourly foundation tests. Earlier shared UI, branding
and navigation changes remain listed in `LABOURLY_L1_IMPLEMENTATION.md`.
This report supersedes its previous statement that backend code was unchanged.

## Results

| Gate | Actual result |
|---|---|
| Full mobile Jest | PASS: 125 tests, 18 suites, no failures/skips |
| TypeScript / lint / formatting | PASS: all exit 0 |
| Java 21 package and Spotless | PASS; executable backend jar regenerated |
| Backend unit tests in package command | PASS: 4, no failures/errors/skips |
| Earlier focused AuthenticationIT | PASS: 16 on October 14; formatting subsequently passed |
| Fresh database integration / protected-record comparison | BLOCKED: Docker unavailable |
| Current native onboarding and dual-role flows | BLOCKED: emulator acceleration unavailable |
| 320dp / 200% fonts / TalkBack / physical-device acceptance | PENDING |

Evidence is retained under `.tools/l1-final/`: `mobile-results.json`,
`mobile-tests.log`, `gates-20261016.json`, `typecheck-20261016.log`,
`lint-20261016.log`, `format-20261016.log`, `backend-package-20261016.log`,
and the earlier `backend-focused.log`. The package command is not a full
integration test run. Prior backend integration success is not relabelled as
a fresh run.

An intermediate run failed because the discovery router mock lacked the newly
used search-parameter hook. Tests now cover valid and invalid trade routes.
Lint also rejected effect-based synchronous state updates; route state now
initializes a keyed screen instead. All final mobile gates were rerun after fixes.

## Environment and safety

Metro is listening on 8083. The original mobile API address was restored to
`http://10.0.2.2:8080`; the app is not left pointing to the disposable backend.
Backend 8080 is not claimed healthy or running.

Docker startup and one normal Desktop restart failed to restore the engine;
the Docker API returned HTTP 500. Emulator logs report hardware acceleration
unavailable. Windows reports `HypervisorPresent=false`, while firmware
virtualization and second-level address translation are enabled. Exact system
repair remains undetermined. No driver, boot configuration, BIOS, Windows
feature or security change, database reset or reboot was performed.

No application data was written in this continuation. Protected records were
not altered, but cannot be freshly verified while Docker is inaccessible.
Earlier preservation evidence and the disposable environment remain retained.
No original account received additional roles. No migrations/dependencies changed.

## Remaining work and recommendation

Completed dual-role profile contracts have automated coverage; native dual-role
support is **partially verified**. Display name remains shared by design. There
is still only one initial onboarding draft per user: independent unfinished
onboarding for two roles is not claimed.

Still required: isolated customer categories and individual/team onboarding,
skills/service-area save/resume, dual-role switching/editing, logout/session
restoration, authorized read-back, accessibility, and protected-record comparison.
Functional chat, payments and background push remain future domains, not fake
working reference screens.

**L1 BLOCKED for final native sign-off.** Implementation and local gates have
progressed; the complete transformation is not declared finished. No commit,
push, tag or deployment was performed.

## Resumed after host recovery — October 16

This section supersedes the earlier Docker/acceleration blockers above.

- Docker is available; original PostgreSQL is healthy. Emulator acceleration
  reports `WHPX(10.0.26300) is installed and usable`; adb lists emulator-5554
  as `device`. No host configuration was changed by this continuation.
- Full Java 21 `mvnw -o verify` PASS: **96 tests (4 unit + 92 integration),
  zero failures, errors or skips**. Spotless and packaging pass. Evidence:
  `.tools/l1-final/backend-full-resumed.log`, `backend-counts-resumed.json`.
- Protected bookings, quotations and reservations still exactly match saved
  evidence after regression and development backend startup. All twelve source
  migration checksums match successfully applied migrations. Evidence:
  `.tools/l1-final/protected-resumed.json`.
- Updated development backend runs on 8080, health UP, seeding disabled.
  The previously used signing secret was unavailable in saved local settings;
  a process-local development key may require login/session refresh. No protected
  account was modified to address authentication.
- Separate disposable backend runs on 8084 against the explicitly approved
  `labourly-l1-native-20261014` container. Synthetic API acceptance data belongs
  only to this database; no role grants were made in the original database.
- Metro runs on 8083. Original mobile API configuration was restored in `.env`
  after isolated setup. Automatic approval review rejected both the adb
  connection/launch command and subsequent Metro restart with only
  `blocked by policy`. Neither was retried through an alternate mechanism.
  The running bundle's final API configuration is therefore not yet verified.
  Manual development-build opening/reload is required before native acceptance.
- No new native onboarding, role switching, TalkBack or accessibility PASS is
  claimed. Mobile's latest source remains at the previously verified 125 tests;
  no application source was changed during environment recovery.

L1 remains blocked at native acceptance, rather than by Docker or backend tests.

### Disposable API acceptance result

**15 checks PASS**, using actual HTTP requests against the separate migrated
database. Evidence: `.tools/l1-final/isolated-api-results.json` and the local
`verify-isolated-api.py` harness. Verified customer categories Contractor,
Engineer (SITE_ENGINEER), Architect; draft resume and canonical read-back;
individual/team worker onboarding and skill persistence; single-role denial;
authorized dual-role session, independent profile fields and edits; retention
of the original onboarding draft; refresh, logout/revoked-refresh rejection and
login persistence. Role switching in the native UI remains pending.

The first harness attempt correctly encountered OTP cooldown. A rerun reused
a now-dual-role fixture and invalidated a single-role expected response. The
harness was corrected to use fresh fictional identities for each run and wait
for the existing cooldown. The final run completed without weakening auth rules.
No production authorization changes were needed for fixture creation.

The disposable resources remain available for still-needed native acceptance;
cleanup is deferred until that evidence is collected. Backend dual-role editing
is functional at the API level; end-to-end native support is partially verified.

### Metro reload recovered after explicit user authorization

The user explicitly asked the agent to perform the restart. The targeted Metro
restart succeeded. PID 13416 serves port 8083 with the original development API
environment (`http://10.0.2.2:8080`). The app's React Native developer menu showed
its bundle location was `localhost:8083`; adb reverse forwarding was missing
after emulator recovery. Restoring `tcp:8083` forwarding and pressing the actual
developer-menu Reload action resolved bundle delivery. No app data was cleared.

Metro logged `Android Bundled 123329ms ... (2027 modules)` and the running app
rendered the worker Opportunities screen afterward. Backend health remained UP.
Evidence: `.tools/l1-final/metro-restarted.log`, `.tools/l1/loaded-current.png`
and `.xml`. This supersedes the earlier blocked restart and unverified reload.
The protected account was not edited and no marketplace mutation was submitted.
This confirms reload/rendering, not completion of all native acceptance flows.

Host free memory was approximately 380 MB during bundling. Slow debug bundle
generation is observed; no production startup timing is inferred. The idle
disposable backend process was stopped to reduce memory usage; its database and
test evidence remain preserved for later isolated native acceptance.
