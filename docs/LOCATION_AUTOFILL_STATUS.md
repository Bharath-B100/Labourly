# Find Workers — current phone location

Updated: 2026-10-07 (Asia/Calcutta)

The official npm registry became reachable after the user changed networks. Expo Location 57.0.20 was installed through `npx expo install expo-location` from registry.npmjs.org. The lockfile records its official tarball URL and integrity hash.

## Implemented

- Find Workers requests foreground location permission on entry and fills latitude/longitude using a fresh phone position.
- The first worker search waits for a valid location; there is no silent Bengaluru fallback.
- One-shot high-accuracy (GPS-capable) lookup with a 15-second position timeout. No background tracking or location history storage. Device testing found that balanced accuracy did not activate the emulator GPS provider without a network location fix; high accuracy addresses that provider limitation.
- Denied permission, disabled location services and position errors show actionable messages. Retry and searchable state/city selection remain available.
- Zero device coordinates are valid. Late location results after unmount are ignored.
- Android declares coarse/fine foreground location permissions only; no background location/foreground service permission is added by this feature.

## Verification

- PASS: TypeScript check.
- PASS: Expo lint, zero warnings after cleanup.
- PASS: Final-source TypeScript and lint recheck (see `verification/location-typecheck-final-20261007.txt` and `verification/location-lint-final-20261007.txt`). Changed location files also pass Prettier.
- PASS: 57/57 tests, 11 suites, 0 failures/skips after the GPS accuracy correction; 30.502 seconds. Evidence: `verification/location-tests-device-fix-20261007.txt`.
- Tests include automatic filling, no default-city search on denial, recovery, manual zero coordinates, disabled services and invalid native coordinates.
- PASS: Android debug APK build and installation; device results below. This is a Metro-connected debug build, not a standalone production build.

## Dependency findings

Fresh `npm audit --json` reports 67 findings: 12 moderate, 54 high, 1 critical. This supersedes the older three-moderate report. The direct lockfile change for this task adds expo-location; that package is not listed as an advisory entry in the fresh audit. Broader existing dependency chains require a separate compatible remediation review. No forced downgrade, security suppression or incompatible override was applied. Evidence: `verification/location-audit-20261007.json`.

`expo install --check` requests patch updates to Expo 57.0.27, Constants 57.0.21, Linking 57.0.12 and Router 57.0.25. These existing packages were not changed during the location implementation. Compatibility check therefore remains FAIL (outdated patches), not a passed gate.

An emulator reports its configured/simulated position, not the user's physical location. A phone must grant location permission and have location services enabled.

## Continuation on 2026-10-07

- The first Android build stopped without a success/failure summary and without producing an APK. Its log is retained; it is not a passed build.
- Resumed the x86_64 debug build using existing Gradle/native caches. Evidence: `verification/location-android-build-retry-20261007.txt`.
- Local backend `/actuator/health` returned `UP` during this continuation.
- BLOCKED: Dependency remediation download. Official npm registry metadata requests for `shell-quote` returned `ECONNRESET`, including a bounded retry preferring IPv4. Evidence: `verification/location-registry-retry-20261007.txt`. No security settings changed.
- The saved audit identifies `shell-quote` 1.10.0 as critical (GHSA-pqg4-j6r4-53mv), fixed at 1.11.0 according to that audit. The installed parent `react-devtools-core` accepts `^1.6.1`, so a compatible update is a candidate once the registry is reachable; no update has been installed or verified yet.
- Several other audit recommendations change Expo/React Native/Jest major versions or downgrade packages. They have not been forced into this project. The security gate remains FAIL with the last recorded 67 findings.

## Android device results

| Check | Status | Actual result |
| --- | --- | --- |
| Debug APK | PASS | `D:\Files\EDUCATION\NammaCrew\mobile\android\app\build\outputs\apk\debug\app-debug.apk`; 78,956,130 bytes; x86_64; Gradle BUILD SUCCESSFUL in 17m 39s, 317 actionable tasks. |
| Emulator | PASS | Existing `Medium_Phone_API_36.1`, `emulator-5554 device`; no data wipe. |
| Install | PASS | `adb install -r` returned Success after boot completed. An earlier attempt was rejected because Android was still booting. |
| Render | PASS | Welcome screen and Find Workers rendered after restarting the stale Metro server. |
| Foreground permission | PASS | Android showed precise/approximate and while-using/once/deny choices. Granted While using the app; fine/coarse permission confirmed. |
| Loading/error | PASS | Observed Finding your location and a recoverable timeout message during the initial balanced-accuracy attempt. |
| Autofill | PASS | Simulated Mumbai GPS 19.07600, 72.87770 filled automatically; backend returned No workers found. |
| Retry and nearby results | PASS | Simulated Bengaluru GPS 12.97160, 77.59460 followed by Use my current location changed the displayed coordinates and returned 3 workers. |
| Emulator/backend | PASS | `10.0.2.2:8080/actuator/health` returned HTTP 200 and `{"status":"UP"}`. Worker results also exercised the app API layer. |
| Reopen reliability | FAIL | One force-stop/relaunch remained blank with OkHttp ProtocolException during Metro bundle transfer. A second launch rendered successfully. This intermittent development transport issue remains unresolved. |
| Native fatal crash check | PASS | Crash log buffer was empty during the recorded checks; this does not certify long-running stability. |
| Physical phone GPS | DEFERRED | No physical phone was tested. Emulator coordinates are explicitly simulated. |

Evidence: `verification/location-autofill-mumbai-20261007.{xml,png}`, `verification/location-autofill-bengaluru-20261007.{xml,png}`, `verification/location-restart-20261007.xml`, `verification/location-adb-devices-20261007.txt`, `verification/location-emulator-health-20261007.txt`, and `verification/location-crash-buffer-20261007.txt`.

The final high-accuracy JavaScript change was served by Metro to the installed debug APK, which contains the Expo Location native module. No additional native rebuild was needed for that JavaScript-only change. Final tests, typecheck, lint and changed-file formatting passed. The simulator, Metro on port 8083, and local backend were left running. No Phase 5 work or full Phase 4 acceptance/sign-off was performed.

## State and city selection — 2026-10-07

Replaced the manual latitude/longitude fields with **Choose a city instead** → searchable **State / Union territory** → searchable **City**. Coordinates remain internal. Changing the state clears the previous city and search centre; results load only after selecting a city and pressing Search Workers. GPS remains available. The displayed city location is explicitly a city centre, not a precise address.

The offline catalogue contains 3,781 GeoNames places across all 36 states/union territories. Source, license, coverage and regeneration instructions are in `mobile/src/location/GEONAMES_NOTICE.md`. No dependency or paid API was added. Cities are filtered by state; large result lists show the first 50 matches with a prompt to type more. Missing towns can use GPS or a nearby city with a wider radius.

- PASS: 57 tests / 11 suites after this change (`verification/city-selector-all-tests-20261007.txt`). Includes typing/selecting city, state filtering, stale-city reset, denied-GPS fallback and GPS retry.
- PASS: TypeScript, lint, changed-file Prettier checks (`verification/city-selector-typecheck-20261007.txt`, `verification/city-selector-lint-20261007.txt`).
- PASS: On the Android emulator, typed Karnataka in the state selector, selected it, typed Bengaluru in the city selector, selected it and pressed Search Workers. The screen displayed **Bengaluru, Karnataka · City centre** and **3 workers shown**. No coordinate input was required. Evidence: `verification/city-selector-native-20261007.xml` and `.png`.
- The JavaScript update was served through Metro to the installed debug APK. The previously documented intermittent Metro reload issue and npm advisory blockers remain unresolved; this change does not certify overall project sign-off.
