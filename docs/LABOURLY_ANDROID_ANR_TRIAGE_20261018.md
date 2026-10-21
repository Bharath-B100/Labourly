# Android ANR root-cause triage — 18 October 2026

**Decision: the single controlled cold start recovered, with substantial delay. The wider Android lifecycle gate remains BLOCKED.** No production code, dependencies or native configuration changed in this triage. No second launch, Metro reload or display recreation was attempted.

## Phase 1 — conclusions from preserved evidence

| Question | Classification | Conclusion and evidence |
|---|---|---|
| Before or after JavaScript startup? | **Probable: before JavaScript startup** | Failed PID 4468 has no `Running main`, JS-bundle evaluation or OFF Activity diagnostic events in the preserved interval. It was still loading native libraries when Android reported failure to complete process startup. The absence of a valid thread dump prevents proving the precise instruction reached. |
| Was the main thread blocked, and where? | **Confirmed: startup missed Android's deadline. Unknown: exact blocking operation** | Main-thread native-loader records include `libc++_shared.so` and `libjsi.so`; Android's Java/native stack-dump attempts timed out. These are last-observed operations, not proof of a deadlock inside those libraries. A particular lock, synchronous I/O call or application method cannot be named from this evidence. |
| Did root initialization overlap recreation during that ANR? | **Unknown / not observed for PID 4468** | No root-start or Activity recreation sequence is recorded for the failed process. Earlier overlapping surface work belongs to another PID and a different reload experiment. It must not be merged into this startup timeline. |
| Were resources constrained? | **Confirmed: severe guest pressure and low host headroom. Probable: contributor to ANR** | At the ANR, Android reported 95% total CPU, 79% kernel CPU, `kswapd0` at 41%, memory PSI some/full avg10 17.59%/9.74%, CPU PSI some avg10 79.08%, and I/O PSI some avg10 15.70%. The application had 26,980 KB swapped. Host observation from the failed run was 421,752 KB free (about 412 MiB). Other processes were also faulting heavily. |
| Do the ANR and addRootView race share a demonstrated cause? | **Unknown; no demonstrated shared cause** | Startup ANR is a process-start deadline failure under pressure. The earlier root race follows Metro reload plus Activity recreation and queued surface starts. They are distinct observed failures. Load could affect both, but neither event establishes that it caused the other. |

The most likely explanation for the original startup ANR is **system-wide CPU/memory/I/O contention delaying native initialization**, with moderate confidence. It is not established as an exclusive cause or a framework/plugin defect. A separate permission-controller process also ANR'd during this period, supporting the systemic-pressure interpretation.

### Evidence limitations and corrections

- New read-only DropBox retrieval preserves the PID 4468 startup event: timestamp `2026-10-18 00:35:50.704+0530`, reported at `00:36:13`. It includes resource pressure and process memory, but no usable main-thread stack.
- `dumpsys activity lastanr` reports a different, older focus/input timeout at `00:35:04` on task 149. It is **not** the PID 4468 startup event. Both are retained separately.
- Direct reads of `/data/anr/...` and `/proc/pressure/...` were denied. No root, privilege change or security bypass was attempted. Empty failed-output files are not treated as valid traces.
- The installed diagnostic APK evaluates `(application as MainApplication).reactHost` inside its logger before `super.onCreate`. That property is lazy. The logger can initialize the host earlier; therefore the earlier report's description of logging as having no lifecycle-ordering effect is too strong. No log before this evaluation does not prove `onCreate` was never entered. This is an unresolved measurement confounder, not a proven cause.
- Historical JS linking/root counters are no longer in the served source. Native root tags can be observed, but today's active linking-registration count is not directly measured. Absence of a multiple-linking warning is not proof of exactly one handler.

## Phase 2 — one controlled recovery

### Preconditions and justification

The running installed APK's device-side SHA-256 matched the saved plugin-disabled `SafetyOFF.apk`. A later process (PID 4858, first Activity event `00:40:05.554`) was already showing authenticated customer Home when triage inspected it. Its launch initiator was not established and it is not counted as this controlled test.

Read-only inventory found:

- One Metro process on 8083, one intended backend on 8084 and one AVD. The emulator launcher and its QEMU child are one emulator, not duplicate AVDs. No Gradle/Kotlin build daemon was active.
- Backend health UP; Metro status HTTP 200. Original API configuration remained `http://10.0.2.2:8084`.
- Guest CPU had settled to about 6% in the reported interval, versus 95% during the failed startup.
- Immediately before the controlled launch: host **1,562 MiB free**, guest **474 MiB available**. This was sufficient headroom for one bounded attempt without a build/test workload; it does not guarantee resource independence. The script guarded against host memory below 1,024 MiB or guest memory below 300 MiB. These are local operational test guards, not platform requirements or production acceptance thresholds.
- Density remained physical 420 without override; font scale 1.0. No display setting changes were performed.

These improvements and the observed recovery of the same artifact supported **one** controlled attempt. Only Labourly was force-stopped, then launched once with `am start -W -n in.nammacrew.mobile/.MainActivity`. Application data and credentials were not cleared.

### Exact observations

Times below are device timestamps; the collected marker and DropBox include `+05:30`.

| Event | Observed time/result |
|---|---|
| Launch marker | `00:48:32.157`, `ANRTRIAGE_SINGLE_COLD_START` |
| New process | PID 5328 |
| Activity diagnostic create begin | `00:48:43.669`, density 420/font 1.0 |
| Activity create return / resume | `00:48:44.694` / `00:48:44.820` |
| Android launch result | `Status: ok`, `LaunchState: COLD`, TotalTime **13,853 ms**, WaitTime **13,884 ms** |
| Metro bundle loader created | `00:48:55.254` |
| JS bundle loading | `00:48:58.666` |
| React app startup | `00:49:09.807`, **rootTag 1** (about 37.65 seconds after marker) |
| Initial UI checks | Three captures were empty at the bounded initial observation, **35.38 seconds** elapsed. Recorded as `NO_AUTHENTICATED_RECOVERY` at that time, retained in evidence. |
| Later read-only UI check | Same process, no intervening launch/reload: authenticated customer Home visible during `00:49:31–39` observation window, approximately **59–67 seconds** after marker. Exact first authenticated paint was not instrumented. |

The same attempt recovered after the initial observation window. This was **not a second retry**, and the initial empty-screen result was not erased.

Within the captured PID 5328 interval:

- One Activity create event; no Activity destruction/recreation events.
- One `Running main` event, root tag 1; no observed second root tag.
- No Metro reload task, `addRootView` race, navigation-before-root error or multiple-linking warning.
- No new app ANR appeared in DropBox; its captured contents were unchanged. No target-process kill was observed.
- Two `WindowManager.BadTokenException` entries and a ReactHost window-focus-before-context soft exception were present. They are retained, not suppressed, and did not prevent the observed recovery. Their cause is not closed by this task.
- Active linking-handler count remains **unmeasured**. A single root tag and no warning are insufficient to prove there is exactly one handler.

**Result: authenticated cold recovery observed; startup performance remains poor.** This does not pass Metro reload, density/font recreation, role-switching or the full lifecycle gate. Those scenarios were intentionally not executed in this triage.

## Exact installed build

- `.tools/root-investigation/SafetyOFF.apk`, **81,270,286 bytes**.
- SHA-256 `ec6754a8c48769a092b8a6d63b47b38c31474e08823b3f73288c11a9b37cfc8b`, verified against the installed `base.apk`.
- `in.nammacrew.mobile`, version 1.0.0/code 1; x86_64; DEBUGGABLE; minSdk 24 / targetSdk 36.
- Expo 57.0.26, Router 57.0.24, RN 0.86.3; existing Java 21/Gradle 9.3.1 build configuration.
- Cleanup plugin absent from Expo config and generated MainActivity. Plugin source retained. Installed APK still contains OFF Activity diagnostic logging with the lazy-host caveat above.
- No embedded `assets/index.android.bundle`; this is a Metro development build, not release-startup evidence. Metro's short bundling messages do not measure native loading, transfer, JS execution or authenticated first paint.
- JavaScript Root Layout mount-order fix preserved byte-for-byte. No new instrumentation or production changes made.

## Preservation, changes and evidence

**Changes:** this report and private evidence/triage scripts only. One authorized app process stop/start; no reinstall, emulator reset, dependency change, database write, display change, production-code edit, commit, push, tag or deployment.

Source-hash comparison confirms unchanged Expo config, Root Layout, MainActivity, plugin source and mobile environment. Read-only protected bookings, quotations and reservations match; Flyway V1–V13 remain successful with matching source checksums. No additional regression suite was required for documentation/read-only triage; prior 15 focused tests are not represented as newly run here.

Private evidence: `.tools/anr-triage-20261018/`, including:

- `dropbox-app-anr.txt`, `lastanr.txt`, `current-native.log`;
- `resource-samples.json`, `cpuinfo-before.txt`, `cpuinfo-latest.txt`;
- `controlled-result.json` (initial and final outcomes), `am-start.txt`, `controlled-interval.log`, `controlled-target-final.log`;
- `controlled-final.xml`, `controlled-final.png`, `controlled-final-dropbox.txt`;
- `source-preservation.json`, `protected-after.json`.

## Decision at review gate

1. **Most likely ANR cause:** resource contention during native startup, probable; exact main-thread blocker unknown.
2. **Relationship to root race:** separate observed mechanism; causal independence or a shared deeper cause is not proved.
3. **Was another controlled test justified?** Yes, the single attempt was justified by improved resources and completed with delayed authenticated recovery. No further attempts were performed.
4. **Remaining risks:** slow cold startup; diagnostic lazy-host access; development warning/soft exceptions; unresolved concurrent reload/recreation race; missing valid ANR thread stack; no release/bundled comparison or physical-device result.
5. **Next review recommendation:** retain BLOCKED for lifecycle sign-off. A future approved comparison should use a truly uninstrumented standard-framework build under stable resources, then test reload and recreation separately. Do not attribute responsibility conclusively to the plugin or framework or introduce a speculative native patch.

**STOP — ANR triage complete; lifecycle sign-off remains BLOCKED.**
