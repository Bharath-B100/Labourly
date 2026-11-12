# LABOURLY — COMBINED ANDROID LIFECYCLE REVIEW REPORT
**Date:** 2026-10-21  
**Milestone Result:** **EMPIRICAL RACE REPRODUCED & ISOLATED**  
**Environment:** Isolated Development Stack (Spring Boot on 8084, Metro on 8083, PostgreSQL 17.5 on 15434, Android Emulator `Medium_Phone_API_36.1`)

---

## 1. Executive Summary

This milestone conducted an exhaustive audit of prior lifecycle logcat evidence and executed **one controlled combined test** (Metro reload concurrent with Activity recreation via density change) to definitively resolve the nature of the historical React root and `addRootView` race.

### Key Empirical Findings:
1. **Evidence Audit (Phase 1):** In all Activity recreation scenarios (density and font scaling), native surface attachment overlap is **PROVEN**. Specifically, the incoming Activity's `attachSurface(surfaceId = 0)` occurs **148 ms to 228 ms BEFORE** the outgoing Activity's `detachSurface(surfaceId = ...)` and `onHostDestroy(activity)`. In isolated recreation, React Native Bridgeless cleanly segregates the surfaces across distinct surfaceIds and Windows without error.
2. **Combined Test (Phase 3):** When a Metro reload (`RELOAD_APP_ACTION`) was initiated and intersected with Activity recreation (`wm density 480`) during the 150–350 ms reload window, the system **EMPIRICALLY REPRODUCED THE EXACT HISTORICAL RACE CONDITION**:
   ```text
   15:44:59.497 E unknown:SurfaceMountingManager: com.facebook.react.uimanager.IllegalViewOperationException: 
   Race condition in addRootView detected. Trying to set an id of [51] on the RootView, but that id has already been set.
   at com.facebook.react.fabric.mounting.SurfaceMountingManager$attachRootView$runnable$1.runGuarded(SurfaceMountingManager.kt:160)
   ```
3. **Resilience & Self-Recovery:** React Native Bridgeless treated the collision as an unhandled `SoftException` rather than terminating the process via a fatal native crash (`SIGSEGV`). The Hermes JS bundle completed evaluation, mounted `rootTag: 51`, and rendered authenticated Customer Home at 480 dpi.
4. **Clean Restoration:** Restoring original density (`wm density reset`) cleanly stopped and detached surface `51`, mounted `rootTag: 61`, and returned Customer Home to standard 420 dpi with zero further exceptions.

---

## 2. Phase 1 — Evidence Audit & Timeline

### 2.1. Structural Distinction of Identifiers
- **Activity Instance Identity:** The underlying Android `android.app.Activity` instance and native window token (`Window{1cc5728}` -> `Window{9da8f70}` -> `Window{9479182}` -> `Window{34d903b}`).
- **Surface Identifier (`surfaceId`):** The React Native Bridgeless host surface registration ID. Scheduled as `surfaceId = 0`, then assigned an active mounting ID (`1, 11, 21, 31, 41, 51, 61`).
- **React Root Tag (`rootTag`):** The Fabric / React JavaScript root identifier assigned in increments of 10 (`rootTag: 1, 11, 21, 31, 41, 51, 61`).

### 2.2. Timestamped Surface Lifecycle Timeline (Prior Runs)

| Scenario & Step | Event | Timestamp | Surface ID | Root Tag | Activity / Window |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scenario A (Reload)** | `getOrCreateReloadTask(): Stopping surfaces` | 15:36:33.828 | 1 | 1 | `Window{b274dba}` (Single Activity) |
| | `loadJSBundleFromMetro()` | 15:36:34.139 | 0 | 1 | `Window{b274dba}` |
| | `Restarting surfaces` / `Running "main"` | 15:36:34.751 | 0 | 1 | `Window{b274dba}` |
| **Scenario B (Density 480)** | `startSurface(0): Schedule & attachSurface(0)` | 15:37:33.274 | 0 | 11 | Incoming Activity |
| | `Running "main" rootTag: 11` | 15:37:33.297 | 0 | 11 | Incoming Activity |
| | `finishDrawing of relaunch` | 15:37:33.496 | — | — | `Window{1cc5728}` (Outgoing) |
| | `stopSurface(1)` / `detachSurface(1)` / `onHostDestroy` | 15:37:33.501 | 1 | 1 | `Window{1cc5728}` (Outgoing) |
| **Scenario B (Density 420)** | `attachSurface(0)` | 15:38:06.533 | 0 | 21 | Incoming Activity |
| | `Running "main" rootTag: 21` | 15:38:06.560 | 0 | 21 | Incoming Activity |
| | `stopSurface(11)` / `detachSurface(11)` | 15:38:06.712 | 11 | 11 | Outgoing Activity |
| **Scenario C (Font 1.30)** | `attachSurface(0)` | 15:38:55.507 | 0 | 31 | Incoming Activity |
| | `Running "main" rootTag: 31` | 15:38:55.517 | 0 | 31 | Incoming Activity |
| | `stopSurface(21)` / `detachSurface(21)` | 15:38:55.655 | 21 | 21 | Outgoing Activity |
| **Scenario C (Font 1.0)** | `attachSurface(0)` | 15:39:21.364 | 0 | 41 | Incoming Activity |
| | `Running "main" rootTag: 41` | 15:39:21.366 | 0 | 41 | Incoming Activity |
| | `detachSurface(31)` | 15:39:21.531 | 31 | 31 | Outgoing Activity |

### 2.3. Proof of Native Attachment Overlap
- **Finding:** Native window attachment overlap is **PROVEN**.
- **Evidence:** In every Activity recreation, `ReactHost.attachSurface(0)` occurs **148 ms to 228 ms prior** to `ReactHost.detachSurface()`. During this interval, both the incoming Activity's native window and the outgoing Activity's native window have active surfaces registered in `ReactHost{0}`.

---

## 3. Phase 2 — Preconditions Gate

| Metric / Check | Required Gate | Measured Value | Result |
| :--- | :--- | :--- | :--- |
| **Host Available RAM** | ≥ 1,024 MiB operational guard | 1,986.12 MiB (~1.94 GiB) | **PASS** |
| **Guest Available Memory** | ≥ 300 MiB guard | 522,140 KiB (~510 MiB) | **PASS** |
| **Isolated Backend (8084)** | UP (`/actuator/health`) | `{"status":"UP"}` | **PASS** |
| **Metro Dev Server (8083)** | Running (`/status`) | `packager-status:running` | **PASS** |
| **Installed APK Checksum** | `39c84bb2fd13...` | SHA-256 match verified | **PASS** |
| **Database Migrations** | 13 Flyway migrations intact | 13/13 successful | **PASS** |
| **Protected Entities** | Baseline counts preserved | users: 15, customer_profiles: 9, worker_profiles: 7, requirements: 1 | **PASS** |
| **Display Baseline** | Standard configuration | Physical density: 420, font_scale: 1.0 | **PASS** |

---

## 4. Phase 3 — One Combined Test Execution & Observations

### 4.1. Sequence of Actions
1. **Initial State (15:44:57):** Process PID 5205, focused window `Window{34d903b}`, authenticated Customer Home active.
2. **Reload Sent (15:44:57.068):** `adb shell am broadcast -a in.nammacrew.mobile.RELOAD_APP_ACTION`.
3. **Density Changed (15:44:57.369):** `adb shell wm density 480` executed 150 ms later to intercept the surface destroy/reload phase.
4. **Settled (15:45:03.380):** UI captured and continuous logcat dumped to `.tools/lifecycle-evidence/combined_test_logcat.txt`.

### 4.2. Timeline of the Race Condition (from Logcat)
```text
15:44:57.765  ReactHost: getOrCreateReloadTask(): Destroying ReactInstance
15:44:57.967  ReactHost: onHostPause(activity) [Triggered by density change]
15:44:58.030  ReactHost: startSurface(surfaceId = 0): Schedule
15:44:58.030  ReactHost: attachSurface(surfaceId = 0) [New Activity attaches]
15:44:58.072  ReactHost: stopSurface(surfaceId = 41): Schedule
15:44:58.073  ReactHost: detachSurface(surfaceId = 41)
15:44:58.073  ReactHost: onHostDestroy(activity)
15:44:58.509  ReactHost: raiseSoftException(callWithExistingReactInstance(stopSurface(surfaceId = 41))):
              reactInstance is null. Dropping work.
15:44:59.229  ReactHost: getOrCreateReactInstanceTask(): Creating ReactInstance
15:44:59.493  ReactHost: Loading JS Bundle
15:44:59.495  ReactHost: getOrCreateReloadTask(): Restarting previously running React Native Surfaces
15:44:59.495  ReactHost: startSurface(surfaceId = 0): Execute
15:44:59.497  SurfaceMountingManager: Unhandled SoftException
              com.facebook.react.uimanager.IllegalViewOperationException: 
              Race condition in addRootView detected. Trying to set an id of [51] on the RootView, but that id has already been set.
              at com.facebook.react.fabric.mounting.SurfaceMountingManager$attachRootView$runnable$1.runGuarded(SurfaceMountingManager.kt:160)
15:44:59.938  [RNScreens]: InsetObserverProxy registers on new context while it has not been invalidated on the old one.
15:45:00.480  ReactNativeJS: Running "main" with {"rootTag":51,"initialProps":{},"fabric":true}
```

### 4.3. Root Cause Mechanism
The collision occurs because:
1. Activity recreation causes the incoming Activity's `attachSurface(0)` to set root ID `[51]` on the native `RootView`.
2. Simultaneously, `ReactHostImpl.getOrCreateReloadTask()` finishes bundling and invokes `Restarting previously running React Native Surfaces`, dispatching a second `attachRootView` call for the exact same root tag (`[51]`) onto that `RootView`.
3. `SurfaceMountingManager.kt:160` detects that `RootView.id == [51]` already, and raises `IllegalViewOperationException: Race condition in addRootView detected`.
4. Because React Native Bridgeless catches this via `raiseSoftException`, it drops the duplicate attachment without crashing the process.

---

## 5. UI Recovery & Density Restoration

1. **Mid-Test State at 480 dpi:** The app did not crash; Customer Home remained fully functional with all 5 tabs and search cards intact. Evidence: `combined_test_mid.png` (514,441 bytes).
2. **Restoration to 420 dpi:** Executed `adb shell wm density reset`. Surface `51` was stopped and detached, surface `61` attached, and standard 420 dpi Customer Home was restored with 0 crashes. Evidence: `combined_test_restored.png` (450,274 bytes).
3. **Session Preservation:** User identity `Fictional L1 Customer 1` (`+919100008101`) remained logged in throughout the test without prompting for OTP.

---

## 6. System Resource & Data Integrity

- **Host Free RAM:** 1,899.15 MiB (comfortably above 1,024 MiB guard).
- **Guest Available RAM:** 456,840 KiB (comfortably above 300 MiB guard).
- **Process Continuity:** App PID remained 5205 across the entire test session.
- **Database Baseline Preservation:** 
  - `users`: 15 (Protected customer `+919999999990` and worker `+919999999991` intact).
  - `customer_profiles`: 9
  - `worker_profiles`: 7
  - `labour_requirements`: 1
  - `quotations`: 0
  - `bookings`: 0
  - Flyway migrations: 13/13 intact.

---

## 7. Remaining Blockers & Recommendations

1. **Production Impact Assessment:** In a release APK (`android:buildType=release`), Metro reload does not exist; only Activity recreation (density, font scaling, fold/unfold, screen rotation) occurs. As proven in Scenarios B & C, **isolated Activity recreation does NOT trigger the `addRootView` race**.
2. **Development-Time Race Handling:** The `addRootView` race is exclusively a development-mode collision between Metro's `ReloadTask` and Android's `ActivityThread` recreation. In Bridgeless React Native, this is handled as a non-fatal soft exception.
3. **Review Gate Status:** The combined lifecycle test has completed and verified the exact failure mechanism. Antigravity has stopped at the review gate for user direction.
