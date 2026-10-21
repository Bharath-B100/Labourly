# Uninstrumented Android lifecycle validation — 21 October 2026

**Recommendation: BLOCKED at the resource-controlled native acceptance gate.** A new uninstrumented APK built successfully. It has not been installed or launched. No cold-start failure or native success is claimed for this build.

## Build and instrumentation verification

- Branch: `codex/labourly-l1-foundation`; HEAD: `b82f84192871067d26628753a7e0a188b1789f4a`. Existing uncommitted UI/API work preserved.
- Expo config excludes `withActivityRootCleanup`. Its source remains preserved for comparison.
- Generated MainActivity has standard `onCreate`, delegate creation, component-name and back behavior only. No custom `onDestroy`, root detachment, logging, or eager ReactHost lookup.
- MainApplication retains lazy ExpoReactHostFactory initialization and standard application/configuration callbacks. No custom diagnostic logging.
- Root Layout still mounts its Stack through session restoration and role changes. Its source hash is unchanged.
- Expo Router's built-in linking diagnostics remain enabled. No custom linking counters or warning suppression were added. This Router version carries navigation internally; the absent standalone `@react-navigation/native` directory is not evidence of a missing dependency.
- Compiled MainActivity was inspected with `javap`; the packaged APK's MainActivity was independently inspected with `apkanalyzer dex code`. Neither contains the previous diagnostic/cleanup methods. This verification is of compiled code, not source alone.

### New APK

Path: `D:\Files\EDUCATION\NammaCrew\.tools\lifecycle-uninstrumented-20261021\Labourly-Uninstrumented.apk`

- Size: **81,270,286 bytes**.
- SHA-256: `39c84bb2fd13f9e579c69e980f3d99ac89944d9c05522f9228695789535a3862`.
- Package `in.nammacrew.mobile`, version 1.0.0/code 1, x86_64 debug; minSdk 24 / compileSdk and targetSdk 36; Hermes/new architecture unchanged. This is a Metro development APK, not a production-bundle acceptance result.
- Expo 57.0.26; Expo Router 57.0.24; React Native 0.86.3; React 19.2.3; screens 4.26.2; Expo modules core 57.0.20. Lockfile unchanged.
- Existing Java 21, Gradle 9.3.1, build tools 36.0.0, NDK 27.1.12297006; no upgrades or signing changes.

Command from `mobile/android`:

```text
gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=8083 "-Dorg.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=384m" --offline --max-workers=1 --no-daemon
```

**BUILD SUCCESSFUL in 7m 5s**, 317 actionable tasks: 28 executed, 289 up-to-date. The heap bound was command-local; no project/system configuration changed. Build warnings about NODE_ENV and Gradle 10 deprecations remain in the log; no errors were suppressed.

An initial default-heap attempt was deliberately stopped when available RAM fell to about 284 MiB. Only the two verified Java processes belonging to that attempt were terminated. A subsequent bounded attempt was interrupted before completion; its log is retained. The resumed bounded build above completed successfully. These were build attempts, not repeated app launches.

The old diagnostic APK hash was `ec6754a8c48769a092b8a6d63b47b38c31474e08823b3f73288c11a9b37cfc8b`. Its identical file size is not mistaken for identical contents; the new hash and DEX inspection distinguish them.

## Environment and native scenario results

At resumption, no emulator, Metro, or backend was running. Docker was stopped; normal Docker Desktop startup restored its existing containers without reset/recreation. The existing isolated backend was started against the labelled disposable database on port 15434, serving on **8084**, with seeding disabled. Health returned **UP**. Its existing launcher uses a new ephemeral signing secret per restart; access-token continuity therefore requires refresh and has not been natively verified. No secure storage/session data was cleared.

The mobile API URL remains `http://10.0.2.2:8084`; environment-file hash unchanged. No Metro server or emulator was started. The AVD remains configured with 2 GiB RAM, six cores, and its existing data. After Gradle and quality checks finished, host available RAM was **1,733,168 KiB (~1.65 GiB)**, insufficient headroom for that AVD plus Metro/backend in this resource-controlled investigation. Earlier observations varied from 284 MiB under pressure to 5.5 GiB before Docker/build loads. These are measurements, not a universal Android memory requirement.

| Scenario | Result | Evidence/limitation |
|---|---|---|
| Install new APK preserving data | PENDING | Emulator not started |
| Authenticated cold startup | BLOCKED | Resource prerequisite not met; zero launches |
| Process/Activity/root/JS/first authenticated paint timings | NOT MEASURED | No attempt |
| Authenticated Metro reload | PENDING | Cold-start gate not passed |
| Density recreation alone | PENDING | No display changes |
| Font-scale recreation alone | PENDING | No display changes |
| Logout/login | PENDING | No session mutations |
| Authorized customer/worker switching | PENDING | No roles granted or changed |
| Combined reload/recreation | NOT ATTEMPTED | Individual gates not passed |
| Profiles, Saved Workers native persistence/isolation, requirements/bookings | PENDING | Component regression is not native evidence |
| Duplicate simultaneous roots / linking-handler lifetime | UNKNOWN | No new runtime observation; no inference from historical tags |
| New native exceptions or ANRs | NOT ASSESSED | No launch; absence of testing is not PASS |

The historical root race and startup delay remain unresolved. This task establishes a clean comparison artifact, not a cause or fix for those runtime failures. No new chat/payment behavior was added or claimed.

## Regression and preservation

- Focused root-mount, session and Saved Workers suites: **3 suites, 15 tests passed**, 0 failures. npm warned about flag parsing, but the log confirms all three intended suites actually executed.
- TypeScript typecheck: **PASS**, exit 0.
- Lint: **PASS**, exit 0.
- Full mobile/backend suites and fresh formatting gate: not run; no application/backend source edits were made. Prior suite counts are not presented as fresh results.
- Original PostgreSQL container was started normally solely for read-only verification. Protected bookings, quotations and reservations match the saved baseline. Flyway V1–V13 all successful with matching source checksums. The isolated database's V1–V13 checksums were also checked read-only.
- No application/business logic, migration, dependency, environment file, protected account or booking edits. No emulator reset, display changes, install, data clearing, commit, push, tag or deployment.
- Source hashes checked for Expo config, Root Layout, MainActivity, MainApplication, plugin, package-lock and environment file; unchanged throughout this work.

## Files and private evidence

Added this report and private files under `.tools/lifecycle-uninstrumented-20261021/`: build logs, APK, `mainactivity-methods.txt`, `apk-mainactivity.txt`, dependency/source hash inventories, `protected-current.json`, migration checks, focused tests/typecheck/lint logs and `quality.json`. `cold-start.py` is an unexecuted one-attempt evidence collector, not application instrumentation. The existing private `.tools/l1/database-final.json` was refreshed by its read-only verification script. Gradle generated normal local build outputs.

## Next review action

Free additional host memory by closing unused applications, then reassess available memory before starting the existing emulator and Metro. Use this verified APK with data-preserving installation. Execute one authenticated cold start first; proceed to separate scenarios only on successful recovery. Stop on failure/instability. Do not repeat the build merely to start native testing unless source/artifact verification shows it is necessary.

**BLOCKED — uninstrumented build verified; native lifecycle acceptance still pending. STOP at the review gate.**

## Subsequent resource check and AVD attempt — 21 October 2026

On the user's later continuation, host available memory was 6,483 MiB before starting services. The APK hash again matched `39c84bb2fd13f9e579c69e980f3d99ac89944d9c05522f9228695789535a3862`. No rebuild occurred. Existing Docker, isolated database/backend and Metro were started; available memory was 3,205 MiB before the existing AVD was launched with `-no-snapshot-load` (no wipe or data clearing).

The AVD reached `emulator-5554 device`, but `sys.boot_completed` was still empty and host available memory fell to **501 MiB**. The resource gate failed before APK installation or application launch. The newly started emulator was closed with `adb -s emulator-5554 emu kill`, which acknowledged shutdown. No app cold start, reload or Activity recreation was attempted. Thus startup timings, authenticated recovery and root/linking behavior remain **NOT TESTED** for this APK. The emulator log includes a transient boot-time offline ADB warning and a window-layer warning; neither is evidence of a Labourly exception because Labourly was not launched.

Private evidence: `emulator.log`, `emulator.err`, `emulator-resource-result.json`, and `metro-final.log` under the existing evidence directory. No code, dependencies, environment settings, protected records or migrations were changed. No new protected-record comparison was performed during this continuation; earlier read-only verification remains the latest evidence.

**Recommendation remains BLOCKED: use a physical Android device or obtain more host-memory headroom before another emulator attempt. No further attempt was made.**

## Later authorized continuation: one cold launch executed

The environment was already running when inspected: emulator boot completed, backend 8084 UP, Metro PID 5492 on IPv6 localhost (`::1:8083`), and an existing adb reverse for port 8083. The installed base.apk SHA-256 exactly matched the verified uninstrumented APK, so no reinstall or rebuild was needed. These intervening environment changes were observed, not performed by this capture.

The existing bounded capture was executed once. At its resource guard, host free memory was 1,056 MiB and guest available memory 740 MiB (above its local 1,024/300 MiB guards, with limited headroom). Result: **FAIL — no authenticated recovery** over 37.36 seconds. No second launch, reload, density change or font change followed.

| Event | Device time / result |
|---|---|
| Process started | 13:13:51.810, PID 5447 |
| Surface start scheduled | 13:13:54.460, surfaceId 0; not proof of a mounted JS root |
| Activity host resume | 13:13:54.549; precise onCreate entry uninstrumented |
| Android cold launch | Status OK, TotalTime 3,102 ms; command elapsed 3.31 seconds |
| Metro probe | 13:13:54.466; false at 13:13:59.487 |
| Bundle exception | 13:14:00.340: `java.lang.RuntimeException: Unable to load script`, `loadJSBundleFromAssets` |
| JavaScript main / authenticated Home | Not reached/observed |
| ANR evidence | Before/after DropBox contents identical; no new app ANR recorded |

The visible native error screen confirms bundle delivery failure. The host could reach `http://localhost:8083/status`, but `http://127.0.0.1:8083/status` was refused; Metro was bound to IPv6 loopback only. The app's own Metro check failed, then fell back to a missing embedded bundle. **Confirmed immediate failure: no usable JS bundle. Probable connection contributor: localhost/address binding mismatch.** The exact device debug-server address was not established. This does not establish or resolve the historical root race. ReactHost destruction soft exceptions followed the bundle failure.

Evidence: `cold-result.json`, `cold-am-start.txt`, `cold-marker.txt`, `cold-logcat.txt`, `cold-target.log`, `cold-0.xml` through `cold-4.xml`, `cold-screen.png`, and ANR before/after captures in the private evidence directory. No application source, dependency, environment configuration, protected record or Flyway change was made. Latest protected-data comparison remains the earlier read-only verification; it was not rerun for this launch.

**STOP — one cold-start attempt failed at Metro bundle delivery. Lifecycle acceptance remains BLOCKED. Next work requires correcting/verifying device-to-Metro connectivity before another approved attempt.**
