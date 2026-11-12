# LABOURLY — PHASE 1 AUDIT & FEASIBILITY REPORT
**Task:** Standalone Android Lifecycle Validation  
**Date:** 2026-10-21  
**Repository:** `D:\Files\EDUCATION\NammaCrew`  
**Active Branch:** `main` (commit `781f44d First commit`, base `codex/labourly-l1-foundation`)  
**Gate Status:** **STOPPED FOR APPROVAL (PHASE 1 COMPLETE)**  

---

## 1. Executive Summary

This feasibility audit investigates the requirements, constraints, and risks of building and validating a **standalone, release-like Android APK** that operates completely decoupled from the Metro development server, targeting the existing `Medium_Phone_API_36.1` x86_64 emulator.

The primary objective is to determine whether native Android Activity recreation (density and font scaling) exhibits any React root collisions, window attachment races, or UI instability in an environment where Metro reload does not exist.

### Key Audit Finding — Network Security Blocker
In a standard Gradle `release` build (`buildType "release"`), Android API 28+ enforces strict HTTPS. Cleartext HTTP (`http://10.0.2.2:8084`) is prohibited by default because `src/main/AndroidManifest.xml` does not specify `android:usesCleartextTraffic="true"`.  
Per project constraints, **no permanent cleartext exceptions or production security degradations are permitted**. This audit details two safe, isolated build approaches that enable standalone native lifecycle validation against the isolated backend without weakening production release security.

---

## 2. Review of Combined Lifecycle Evidence

From the combined lifecycle test (`docs/LABOURLY_COMBINED_LIFECYCLE_REVIEW_20261021.md`):
1. **Isolated Activity Recreation is Clean:** In Scenarios B (density 480/420) and C (font scale 1.30/1.0), Activity recreation proceeded with 0 crashes, 0 ANRs, and 0 React root exceptions.
2. **Native Window Attachment Overlap is Proven:** During Activity recreation, the incoming Activity attaches its surface 148 ms to 228 ms *before* the outgoing Activity's surface is stopped and detached. In isolation, React Native Bridgeless cleanly segregates these surfaces across distinct window tokens and surface IDs.
3. **Combined Reload Collision Isolated:** When Metro reload (`RELOAD_APP_ACTION`) intersected with Activity recreation, `SurfaceMountingManager` raised:
   ```text
   com.facebook.react.uimanager.IllegalViewOperationException:
   Race condition in addRootView detected. Trying to set an id of [51] on the RootView, but that id has already been set.
   ```
   This collision occurred because `ReloadTask` and `ActivityThread` recreation attempted to mount root tag `[51]` simultaneously onto the same `RootView`. Bridgeless React Native caught this via `raiseSoftException`, recovered the UI, and rendered Customer Home.
4. **Standalone Hypothesis:** In a standalone APK where Metro is nonexistent, `ReloadTask` does not run. Therefore, this specific collision mechanism cannot be triggered by Metro reload. Phase 3 will test whether standalone Activity recreation exhibits any native surface or window collisions.

---

## 3. Git State & Working Tree Audit

- **Branch:** `main` (Tracking `codex/labourly-l1-foundation` baseline at commit `781f44d`).
- **Working Tree:** Completely clean.
  - Tracked modifications: `0` files.
  - Untracked files: Only audit documentation in `docs/`.
- **Integrity Guarantee:** All UI/API implementation code, database migrations (V1–V13), and test accounts are preserved and unmodified.

---

## 4. Gradle & Expo Build Configuration Audit

Inspected `mobile/android/app/build.gradle` and `mobile/android/gradle.properties`:
- **React Native Version:** 0.76+ with Fabric and Bridgeless Architecture (`newArchEnabled=true`, `hermesEnabled=true`).
- **Bundling Mechanism:** `react.bundleCommand = "export:embed"` invokes Expo CLI to compile JS into Hermes bytecode (`assets/index.android.bundle`).
- **Target Architecture (x86_64):**
  - `gradle.properties` line 31: `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`.
  - Passing `-PreactNativeArchitectures=x86_64` restricts compilation strictly to the emulator ABI, drastically cutting compilation time and memory overhead.
- **Signing Configuration:**
  - `build.gradle` lines 112–115: `buildTypes.release` is configured to use `signingConfig signingConfigs.debug` (`debug.keystore`).
  - **No production keystore or sensitive signing credentials are required or used.**
- **Code Optimization / Minification:**
  - `enableMinifyInReleaseBuilds` defaults to `false`.
  - `enableShrinkResources` defaults to `false`.
  - R8 dead-code stripping is off by default, avoiding Proguard reflection pitfalls during validation.

---

## 5. Network Security, Authentication & Cleartext Analysis

### 5.1. The Cleartext Constraint
- Backend runs on `http://10.0.2.2:8084` (plain HTTP, isolated development profile).
- `src/main/AndroidManifest.xml` does not set `android:usesCleartextTraffic="true"`.
- `android:usesCleartextTraffic="true"` is declared only in `src/debug/AndroidManifest.xml` and `src/debugOptimized/AndroidManifest.xml`.
- In a standard `assembleRelease` APK, Android API 36 will block all calls to `10.0.2.2:8084` with `java.io.IOException: Cleartext HTTP traffic to 10.0.2.2 not permitted`.
- The user directive states:
  > *"Do not change production security settings or introduce a permanent cleartext-network exception merely to make the test pass. If the build cannot safely use the isolated backend, report the blocker instead of switching to a production database."*

### 5.2. Proposed Safe Candidate Solutions

| Strategy | Mechanism | Metro Required? | Cleartext to 8084 Allowed? | Production Security Impact |
| :--- | :--- | :---: | :---: | :--- |
| **Candidate 1 (Recommended): Standalone Pre-bundled Debug Build** | Assemble a debug variant with `bundleInDebug=true` (or `debuggableVariants = []` in Gradle override) so the full Hermes JS bundle is packaged into `assets/index.android.bundle`. | **NO** (Metro completely stopped) | **YES** (uses existing `src/debug/AndroidManifest.xml`) | **ZERO** (`src/main/AndroidManifest.xml` and `release` config remain 100% untouched) |
| **Candidate 2: Test-Scoped Network Security Config** | Create a temporary Android network security configuration scoped strictly to IP `10.0.2.2` in an isolated build variant or flavor (`releaseTest`), leaving `src/main` unmodified. | **NO** | **YES** (scoped exclusively to `10.0.2.2`) | **ZERO** (reverted immediately after test) |
| **Candidate 3: Unauthenticated Pure Release Build** | Build standard `assembleRelease` with no network exceptions. Validate cold start, Welcome screen, and Activity recreation without backend network calls. | **NO** | **NO** (Backend calls fail) | **ZERO** (Cannot validate authenticated Customer Home) |

**Recommendation:** **Candidate 1** provides the exact operational behavior of a release build (100% standalone, Hermes bytecode loaded from APK assets, zero connection to Metro) while naturally inheriting debug cleartext permissions for `10.0.2.2:8084` without modifying or compromising production security manifests.

---

## 6. Resource, RAM & Disk Feasibility

| Resource | Current Available | Required for Build & Run | Safety Margin |
| :--- | :--- | :--- | :--- |
| **Host Free RAM** | 1,975 MiB (~1.93 GiB) | ≥ 1,024 MiB operational guard | Gradle configured with `-Xmx1536m -XX:MaxMetaspaceSize=384m`; Metro stopped during build saves ~180 MiB. |
| **Guest Available RAM** | 616 MiB | ≥ 300 MiB operational guard | +316 MiB margin. |
| **Disk Space (Drive D:)** | 149.0 GB Free | ~350 MB (APK + build cache) | Massive headroom. |
| **Build Time Estimate** | — | ~2.5 to 4.5 minutes | Single ABI (`x86_64`) with pre-cached Gradle dependencies. |

---

## 7. APK Preservation & Installation Plan

- Existing verified development APK (`39c84bb2fd13f9e579c69e980f3d99ac89944d9c05522f9228695789535a3862`) currently resides on the emulator.
- The new standalone APK will be built to an isolated directory (`mobile/android/app/build/outputs/apk/...`).
- SHA-256 checksum and asset verification will be logged before touching the emulator.
- Per constraint, **the emulator installation will NOT be overwritten without explicit user approval**.

---

## 8. Review Gate & Decision Point

Antigravity has **STOPPED** at the Phase 1 Review Gate. No build tasks have been launched, no configuration files have been altered, and no signing keys have been generated.
