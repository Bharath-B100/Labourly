# Labourly Controlled Android Cold Start Validation (Option A) — 21 October 2026

**Outcome: PASS (Native Cold Start & Metro Bundle Delivery Verified; Unauthenticated Intro Screen Reached).**  
**Review Gate: STOPPED for User Review.**

---

## 1. Executive Summary & Verification State

- **Branch:** `codex/labourly-l1-foundation`
- **Target APK:** [Labourly-Uninstrumented.apk](file:///D:/Files/EDUCATION/NammaCrew/.tools/lifecycle-uninstrumented-20261021/Labourly-Uninstrumented.apk)
- **APK SHA-256:** `39c84bb2fd13f9e579c69e980f3d99ac89944d9c05522f9228695789535a3862` (Verified unchanged on disk and installed on device `/data/app/.../base.apk`).
- **Cold Start Command Duration:** **2.33 seconds** (`TotalTime: 2254 ms`, `WaitTime: 2257 ms`, `Status: ok`, `LaunchState: COLD`).
- **Metro JavaScript Bundle Delivery:** **PASS — 100% Verified**. Metro bundled 1,903 modules in 1,456 ms and delivered the bundle over device route `10.0.2.2:8083`.
- **JavaScript Engine & Surface Mount:** **PASS — 100% Verified**. Hermes engine initialized, JSI interop installed, Fabric surface mounted (`rootTag: 1`, `surfaceId: 0`), and the Labourly Intro Carousel rendered.
- **ANRs & Fatal Exceptions:** **ZERO ANRs, ZERO fatal crashes**. PID 4177 remained stable in the foreground (`topResumedActivity=MainActivity`).
- **Session State vs. Native Lifecycle:** The app landed on the approved Welcome/Intro Carousel because the emulator's `SecureStore.xml` contains no stored authentication credentials (`<map />`). This is an unauthenticated session state, **not** a native lifecycle failure.

---

## 2. Resource Gate & Memory Audit

| Milestone | Host Free RAM (MiB / GB) | Guest Available RAM | Operational Status |
| :--- | :---: | :---: | :--- |
| **Initial Baseline** | 3,115.06 MiB (3.04 GiB) | — | Blocked by 4.5 GiB gate |
| **After MCP Disablement** | 3,559.35 MiB (3.48 GiB) | — | Reclaimed ~680 MiB |
| **After User App/Tab Cleanup** | **4,716.70 MiB (4.61 GiB)** | — | **Passed ≥ 4.5 GiB Gate** |
| **After Backend Startup (8084)** | 4,716.70 MiB (4.61 GiB) | — | Backend healthy (`UP`) |
| **After Metro Startup & Cache Warmup (8083)** | 3,952.32 MiB (3.86 GiB) | — | Metro listening on `127.0.0.1:8083` |
| **After Emulator Boot Completion** | 1,921.95 MiB (1.88 GiB) | 722,772 KiB (~705 MiB) | Well above 1,024 / 300 MiB guards |
| **Immediately Pre-Cold Start** | 2,327.90 MiB (2.27 GiB) | 773 MiB | Ready for execution |
| **Immediately Post-Cold Start** | 2,697.39 MiB (2.63 GiB) | 492 MiB | Peak load survived cleanly |
| **Post-Test Steady State** | 2,562.62 MiB (2.50 GiB) | ~500 MiB | Zero memory pressure / thrashing |

*At no point during test execution did host free RAM drop below the 1,024 MiB operational safety guard.*

---

## 3. Infrastructure & Connectivity Evidence

### A. Isolated Backend (Port 8084)
- **Container:** `labourly-l1-native-20261014` running `postgis/postgis:17-3.5` on `127.0.0.1:15434->5432/tcp`.
- **Process:** Java PID 2824 running [backend.jar](file:///D:/Files/EDUCATION/NammaCrew/.tools/saved-native/backend.jar) on port 8084 with `-Xmx384m` and `nammacrew.dev.seed=false`.
- **Health Check:** `http://127.0.0.1:8084/actuator/health` returned `{"status":"UP"}`.

### B. Metro Bundler (Port 8083)
- **Process:** Node PID 21496 running with `--max-old-space-size=768 --dns-result-order=ipv4first --port 8083 --max-workers 1`.
- **Status Endpoint:** `http://127.0.0.1:8083/status` and device-side `10.0.2.2:8083/status` both return HTTP 200 `packager-status:running`.
- **Bundle Generation & Delivery:**
  - Host HTTP test: `HTTP 200 OK`, `Content-Length: 12496790` (~12.5 MB) in 6,005 ms.
  - Native Cold Start delivery: `Android Bundled 1456ms node_modules\expo-router\entry.js (1903 modules)` logged by Metro.

---

## 4. Cold Start Lifecycle Timeline (PID 4177)

| Timestamp / Elapsed | Event | Details / Evidence |
| :--- | :--- | :--- |
| **T+0.00s** | Force Stop | `am force-stop in.nammacrew.mobile` |
| **T+1.00s** | AM Start | `am start -W -n in.nammacrew.mobile/.MainActivity` |
| **T+2.33s** | Launch Return | `Status: ok`, `LaunchState: COLD`, `TotalTime: 2254 ms` |
| **T+2.33s** | Surface Scheduled | `ReactHost{0}.startSurface(surfaceId = 0): Schedule` |
| **T+2.35s** | Metro Probe | `ReactHost{0}.isMetroRunning(): Async result = true` |
| **T+2.41s** | Activity Resumed | `ReactHost{0}.onHostResume(activity)` |
| **T+4.43s** | Bundle Loader Created | `ReactHost{0}.loadJSBundleFromMetro(): Creating BundleLoader` |
| **T+5.00s** | Hermes Engine Start | `Loading JS Bundle`, `AppContext was initialized` |
| **T+5.01s** | Surface Execute | `ReactHost{0}.startSurface(surfaceId = 0): Execute` |
| **T+6.67s** | JSI Interop & Exports | `✅ JSI interop was installed`, `✅ Constants were exported` |
| **T+7.06s** | Main Execution | `ReactNativeJS: Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}` |
| **T+8.42s** | UI Rendered | Intro Carousel rendered: "Labourly. Hire Local. Build Better.", "Continue", "Sign in" |
| **T+71.83s** | Observation End | Process alive in foreground (`PID 4177`, `mFocusedApp=MainActivity`), 0 ANRs |

---

## 5. Native Error Analysis & Non-Fatal Diagnostics

1. **WindowManager$BadTokenException (Non-fatal Dev Toast):**
   - Log: `Unable to add window -- token null is not valid; is your activity running? Unable to display loading message: Loading from 10.0.2.2:8083...`
   - Cause: React Native dev-mode overlay (`DefaultDevLoadingViewImplementation`) attempted to display the transient "Loading from Metro" banner before the Activity window token was attached. It was caught and handled by React Native without affecting app startup.
2. **ReactNoCrashSoftException (Non-fatal Focus Race):**
   - Log: `raiseSoftException(onWindowFocusChange(hasFocus = "true")): Tried to access onWindowFocusChange while context is not ready`
   - Cause: Historical ReactHost / BridgelessReact window-focus race during Activity startup. Explicitly flagged by React Native runtime as `ReactNoCrashSoftException`. It did not terminate the surface or interrupt bundle execution.
3. **Dropbox ANR Analysis:**
   - Pre-launch `data_app_anr`: 0 entries.
   - Post-launch `data_app_anr`: 0 entries (`No entries found`).
4. **Authentication State:**
   - Device `/data/data/in.nammacrew.mobile/shared_prefs/SecureStore.xml` is empty (`<map />`).
   - Consequently, `readCredentials()` returned `null`, and `index.tsx` correctly fell back to rendering the Intro Carousel. No authentication refresh errors occurred because no stale session tokens were present to refresh.

---

## 6. Preservation Integrity

- **Flyway Migrations:** All **13 migrations (V1–V13)** remain untouched; schema history checksums fully verified.
- **Protected Records:** Bookings, quotations, and reservations in the baseline container and disposable container remain completely preserved.
- **Repository Code:** Zero application code, dependencies, or native files modified.
- **Git State:** Clean on `codex/labourly-l1-foundation`; no commits, pushes, tags, or deployments performed.

---

## 7. Artifacts & Evidence Files

All evidence generated during this test is preserved under:  
[execute-cold-start.py](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/execute-cold-start.py)  
[cold-result.json](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/cold-result.json)  
[am-start.txt](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/am-start.txt)  
[logcat.txt](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/logcat.txt)  
[activities.txt](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/activities.txt)  
[anr-before.txt](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/anr-before.txt)  
[anr-after.txt](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/anr-after.txt)  
[screen-0.png](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/screen-0.png) through [screen-9.png](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/screen-9.png)  
[final-screen.png](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/final-screen.png)  
UI XML Hierarchy: [cold-0.xml](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/cold-0.xml) through [cold-9.xml](file:///D:/Files/EDUCATION/NammaCrew/.tools/cold-start-20261021-option-a/cold-9.xml)  
Conversation Artifact Screenshot: [cold-start-screen.png](file:///C:/Users/BHARATH%20RAJ%20B/.gemini/antigravity-ide/brain/af726e84-08c7-4102-97b6-852a264eed70/cold-start-screen.png)

---

## 8. Recommendation for Next Milestone

1. **Native Cold Start Acceptance:** **PASSED**. The uninstrumented APK successfully connects to Metro on `10.0.2.2:8083`, retrieves the JavaScript bundle, executes Hermes, and mounts the Fabric UI surface without crashes or ANRs.
2. **Next Milestone — Authenticated Customer Flow Validation:**
   Since the app is currently in an unauthenticated initial state on the emulator, the next milestone should execute an OTP sign-in flow (or inject disposable test credentials into SecureStore) to validate:
   - OTP verification against backend port 8084.
   - SecureStore credential persistence.
   - Authenticated Customer Home recovery and tab navigation.
3. **MCP Re-enablement:**
   When web UI synthesis or browser automation is needed in future milestones, `StitchMCP` and `chrome-devtools-plugin` can be safely re-enabled.

**STOPPED at Review Gate.**
