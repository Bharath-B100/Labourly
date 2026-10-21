# Native lifecycle safety recovery — 18 October 2026

**Recommendation: BLOCKED.** The plugin-disabled APK built and installed, but its first cold start suffered a startup ANR. Native transitions stopped at that point as instructed. Removing the plugin is not demonstrated to resolve the navigation blocker.

## Preserved evidence and identity

Private evidence and rollback files: `.tools/lifecycle-safety-20261018-run2/`. This contains complete logcat captures, original sources and hashes, the installed APK pulled before replacement, package metadata, native exception stack, lifecycle/reload sequence, ANR evidence and protected-record comparison. No logs or private screenshots were added to Git.

- Branch: `codex/labourly-l1-foundation`; HEAD `b82f84192871067d26628753a7e0a188b1789f4a`. Existing uncommitted UI/API work was retained.
- Expo 57.0.26; Expo Router 57.0.24; React Native 0.86.3.
- Package `in.nammacrew.mobile`, version 1.0.0/code 1, x86_64, DEBUGGABLE, minSdk 24/targetSdk 36. Both artifacts use Metro, with no embedded `assets/index.android.bundle`; neither is production-bundle evidence.
- Installed plugin-enabled APK before this run exactly matched preserved `B.apk`: 79,413,662 bytes; SHA-256 `b1d9f7da5e77f9d746ce0b78b05cfcbc53c35fe1b9a2f1dcca71e0a973662f28`.
- Plugin-disabled test APK: `.tools/root-investigation/SafetyOFF.apk`, 81,270,286 bytes; SHA-256 `ec6754a8c48769a092b8a6d63b47b38c31474e08823b3f73288c11a9b37cfc8b`.
- Build: Java 21, existing SDK, `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=8083 --offline --max-workers=2`. PASS in 4m13s. No dependency upgrades or security bypasses.
- Installation: `adb install -r`, Success. No uninstall, data reset, signing change, database reset or emulator wipe.

Times below are the device log timestamps, retained verbatim; they have not been converted to the desktop's timezone.

## Plugin-enabled exception and trigger

The retained `B-current-overlap.log` shows:

1. `00:20:32.696`: scenario marker; authenticated customer app was open.
2. `00:20:38.781`: Metro reload starts.
3. Activity `62942121` is destroyed. Activity `184471872` starts at density 540/font 1 while reload remains pending; its surface start is queued.
4. Font becomes 2.0; the intermediate Activity is destroyed. Its surface stop is requested, but native stop work is dropped because the ReactInstance is null. Activity `148199179` queues another surface start.
5. `00:21:26.440–445`: two queued starts execute after reload restarts attached surfaces.
6. `00:21:26.471`: native duplicate attachment soft exception. Tags 51 and 41 subsequently run at `00:21:35.211` and `.434`.
7. `00:21:46.345`: navigation-before-Root-Layout error. The bounded authenticated-screen recovery check failed.

Full exception stack recorded by Android:

```text
com.facebook.react.uimanager.IllegalViewOperationException:
Race condition in addRootView detected. Trying to set an id of [51]
on the RootView, but that id has already been set.
  at com.facebook.react.fabric.mounting.SurfaceMountingManager$attachRootView$runnable$1.runGuarded(SurfaceMountingManager.kt:160)
  at com.facebook.react.bridge.GuardedRunnable.run(GuardedRunnable.kt:19)
  at android.os.Handler.handleCallback(Handler.java:1070)
  at android.os.Handler.dispatchMessage(Handler.java:125)
  at android.os.Looper.dispatchMessage(Looper.java:333)
  at android.os.Looper.loopOnce(Looper.java:263)
  at android.os.Looper.loop(Looper.java:367)
  at android.app.ActivityThread.main(ActivityThread.java:9282)
  at java.lang.reflect.Method.invoke(Native Method)
  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:566)
  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:929)
```

Android labels this an **Unhandled SoftException**. It is not by itself evidence of a fatal process crash. The complete original log is preserved, including the separate JavaScript exception and component stack.

## Standard-framework comparison

The plugin entry was removed from Expo config. Its `detachReactRoot` field, early `onDestroy` override and delegate callback were also removed from generated MainActivity; removing the config entry alone would not have undone these changes. Plugin source is preserved unchanged.

Temporary Activity logs and root/linking counters were added for measurement only, without changing lifecycle ordering or suppressing warnings. The JavaScript mount-order fix was preserved. All temporary JavaScript/library instrumentation was restored byte-for-byte after the attempt. Native source is now the standard plugin-disabled MainActivity, without diagnostic overrides. The installed test APK still contains its diagnostic-only Activity logging.

| Scenario | New plugin-disabled run | Evidence / limitation |
|---|---|---|
| A Authenticated cold start | FAIL / BLOCKED | Updated package started as PID 4468; Android killed it for failure to complete startup. No authenticated recovery established. |
| B Authenticated Metro reload | NOT RUN | Stopped after A per safety instruction. |
| C Density recreation alone | NOT RUN | Stopped after A. |
| D Font-scale recreation alone | NOT RUN | Stopped after A. |
| E Reload plus recreation | NOT RUN | Stopped after A; historical comparison below is not a substitute. |
| F Logout/login | NOT RUN | No account mutation attempted after failure. |
| G Authorized role switching | NOT RUN | No role grants or fixture changes made. |

The initial capture helper returned customer UI text, but it was not sufficient to establish new-process recovery: ActivityManager subsequently showed the launcher and recorded the startup process death. That capture is **not counted as PASS**.

### Cold-start failure

`off-cold-settled.log` / `off-startup-anr.txt`:

```text
10-18 00:36:12.703 ActivityManager: PID: 4468
Reason: Process ProcessRecord{... in.nammacrew.mobile/u0a219} failed to complete startup
10-18 00:36:12.822 ActivityManager: Killing 4468 ... bg anr
10-18 00:36:13.286 Zygote: Process 4468 exited due to signal 9 (Killed)
```

The process was loading native libraries; MainActivity's OFF diagnostic callbacks did not appear. Stack-dump attempts themselves timed out. Windows reported 421,752 KB free physical memory (about 412 MiB). Host memory pressure is a material confounder, **not a proven sole cause**. The build's Gradle daemon was stopped to release resources, but no further app launch/recreation was attempted after the failure. The first daemon-stop attempt lacked the existing process-local Java socket option and failed; retry with that existing option stopped one daemon successfully. No system settings were changed.

## What prior A/B evidence actually establishes

- Earlier plugin-disabled `A-overlap.log:72454` already contains the same `addRootView` race (tag 61), followed by linking counts 1→2 at lines 72777–72778 and navigation-before-root at 72811.
- Earlier normal A recreation recovered: `A-display.result = CUSTOMER_HOME`. Linking briefly reached two, then cleaned up to zero and back to one. Sequential root tags alone do not establish a leak.
- Earlier plugin-enabled B cold/reload/display result files reported customer recovery, but the combined B scenario later failed. Those older results do not close today's stopped matrix.
- Simultaneous linking registrations are observed in earlier A instrumentation. This is stronger evidence than two root-tag log lines, but does not prove two persistent, fully mounted app navigators or a permanent memory leak.
- Current OFF cold start never reached the instrumented JS registration phase. Its active-root/linking count is **unmeasured**, not zero or one by inference.
- The newly built artifact uses current sources/assets; a strict same-source A/B matrix under matched resource conditions was not completed. Do not infer a causal A/B verdict from the startup ANR.

## Cause assessment and plugin decision

**Observed classification: Development reload interaction. Exact lifecycle ownership: still unresolved.** A plugin-specific regression is not established because the same race exists in prior plugin-disabled evidence.

Installed source supports a probable mechanism: `ReactHostImpl.startSurface` attaches a surface and queues work behind reload; `stopSurface` detaches it without cancelling that queued start. Reload separately restarts attached surfaces. Previously queued work can then start a detached surface or attach the current root again. `SurfaceMountingManager` detects the duplicate ID. Per-surface identity tracing is still needed to prove every ownership edge and assign an upstream defect conclusively.

The custom plugin calls `unloadApp()` before Expo's serialized destruction path. In the installed RN implementation, surface stop is asynchronous. The plugin does not cancel pending starts and demonstrably did not prevent the reported race. Necessity is unproven; safety under delayed loading is unverified. It remains disabled for this reversible comparison, with its original source and rollback APK retained. No replacement custom cleanup or framework patch was introduced.

## Verification and final state

- Focused tests: **15/15, three suites** (`root-mount`, `session`, `saved-workers`). They verify JS mount order/session behavior and Saved Workers isolation; they do not certify native lifecycle behavior.
- TypeScript typecheck, Expo lint and changed Expo-config formatting: PASS. Logs: `typecheck.log`, `lint.log` in the private evidence directory.
- Protected bookings, quotations and reservations: unchanged by read-only comparison. Flyway V1–V13 successful and source checksums match.
- Source hash checks confirm unchanged plugin implementation, Root Layout fix, MainApplication, Gradle build file, original environment configuration and restored linking library.
- Display: physical density 420, no override; font scale 1.0. These were already restored by the prior interrupted command and remained unchanged in this attempt.
- Backend/Metro configuration retained: isolated API `10.0.2.2:8084`, Metro 8083. No switch to the original development database.
- Installed app: plugin-disabled diagnostic test APK. App process stopped following Android's startup kill; emulator remains available at launcher. No repeated forced transitions.
- Exact persistent source changes in this task: `mobile/app.json` (plugin disabled), ignored generated `mobile/android/app/src/main/java/in/nammacrew/mobile/MainActivity.kt` (cleanup removed), this report. Private artifacts/scripts/logs remain under `.tools/`; plugin source is not deleted. Temporary root/linking changes were restored.

## Next gate

Establish a responsive, resource-stable emulator before one controlled cold start. Once A succeeds, run B, C and D independently, then E, then authenticated logout/login and authorized role switching with isolated accounts. A local bundled comparison remains necessary to separate development reload from non-Metro behavior. No upgrade or native patch is justified by the present incomplete comparison.

No commits, pushes, tags, deployments, new marketplace/provider features or protected-record mutations. **STOP — lifecycle gate remains BLOCKED.**
