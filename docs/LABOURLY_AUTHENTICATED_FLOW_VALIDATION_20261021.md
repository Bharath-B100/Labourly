# LABOURLY — AUTHENTICATED ANDROID FLOW VALIDATION REPORT
**Date:** 2026-10-21  
**Milestone Result:** **PASS**  
**Environment:** Isolated Development Stack (Spring Boot on 8084, Metro on 8083, PostgreSQL 17.5 on 15434, Android Emulator `Medium_Phone_API_36.1`)

---

## 1. Executive Summary

The authenticated Android flow validation for Labourly has **PASSED**. 
Genuine UI-driven OTP authentication, native Android Keystore SecureStore session persistence, authenticated Customer Home restoration, and full core tab navigation were verified end-to-end on the uninstrumented Android build without modifying application code, dependencies, or database records.

---

## 2. Resource & Precondition Gate Results

| Metric / Check | Required Gate | Measured Value | Result |
| :--- | :--- | :--- | :--- |
| **Host Available RAM** | ≥ 1,024 MiB operational guard | 2,371.52 MiB (~2.32 GiB) | **PASS** |
| **Guest Available Memory** | ≥ 300 MiB guard | 464,960 KiB (~454 MiB) | **PASS** |
| **Isolated Backend (8084)** | UP (`/actuator/health`) | `{"status":"UP"}` | **PASS** |
| **Metro Dev Server (8083)** | Running (`/status`) | `packager-status:running` | **PASS** |
| **Installed APK Checksum** | `39c84bb2fd13...` | SHA-256 match verified | **PASS** |
| **Database Migrations** | 13 Flyway migrations intact | 13/13 successful | **PASS** |
| **Protected Data Guard** | No alteration of protected accounts | Accounts intact; 0 alterations | **PASS** |
| **Authorized Account** | Disposable test customer | `+919100008101` (`Fictional L1 Customer 1`) | **PASS** |

---

## 3. Normal Authentication Verification (Phase 2)

All steps were executed through the actual application UI via native touch input without synthetic state injection:

1. **Welcome Screen:** Screen mounted `IntroCarousel` cleanly. Tapped *"Sign in or skip introduction"* (`bounds="[63,1857][1017,1973]"`).
2. **Login Screen (`/auth/login`):** Focused phone input (`bounds="[107,1239][973,1344]"`), entered authorized test phone `9100008101` (normalized by client to `+919100008101`), and tapped *"Send code"*.
3. **OTP Request:** Received and processed by `DevelopmentOtpProvider` under isolated Spring Boot profile `dev`.
4. **OTP Verification (`/auth/verify`):** Entered development code `123456` and tapped *"Verify and continue"*.
5. **Session Establishment:** Client received tokens from `POST /api/v1/auth/otp/verify`, and executed `useSession.signIn(tokens)`.
6. **Encrypted Storage:** Persisted to guest OS in `/data/data/in.nammacrew.mobile/shared_prefs/SecureStore.xml` using Android Keystore AES ciphertext (`scheme: aes`, `keystoreAlias: key_v1`).
7. **Customer Home Entry:** Verified identity via `GET /api/v1/users/me` and navigated automatically to `/(customer)/home`.

---

## 4. Tab Navigation Verification (Phase 3)

Each primary tab was selected, rendered, and inspected:

| Tab | Accessibility / Target | Screen Observations & Verification | Crash / ANR |
| :--- | :--- | :--- | :--- |
| **Customer Home** | `Home` (`[0,2190][216,2316]`) | Rendered location selector, trade search bar, "Find your crew" (Carpenter, Electrician, Plumber), "Post a requirement" banner, and "Manage your work" options. | None (0) |
| **Workers** | `Workers` (`[216,2190][432,2316]`) | Rendered "Find workers" header, trade dropdown, 15 km radius filter, "Search Workers" CTA, and location status. | None (0) |
| **Jobs** | `My Requirements` (`[432,2190][648,2316]`) | Rendered "My jobs", "Post a requirement", "My bookings", and empty state notice. | None (0) |
| **Chat** | `Chat` (`[648,2190][864,2316]`) | Rendered "MESSAGING IS NOT AVAILABLE YET", "Direct Messaging In Development" banner, and disabled input placeholder confirming messaging unavailable requirement. | None (0) |
| **Profile** | `Profile` (`[864,2190][1080,2316]`) | Rendered test identity **"Fictional L1 Customer 1"**, **"Customer · +919100008101"**, "Phone Verified" badge, KYC Phone only, Language (English), and Country (India). | None (0) |

---

## 5. Session Persistence & Cold Restoration Verification

1. **Termination:** Executed `adb shell am force-stop in.nammacrew.mobile`. Verified process completely ceased via `pidof` returning empty string.
2. **Cold Launch:** Reopened via `adb shell am start -W -n in.nammacrew.mobile/.MainActivity` without clearing data:
   - `LaunchState: COLD`
   - `TotalTime: 2177 ms`
   - `WaitTime: 2179 ms`
3. **Session Restoration:**
   - React Native Bridgeless host initialized (`startSurface(surfaceId = 0)`).
   - Fabric surface mounted with `rootTag: 1`.
   - `useSession.loadSession()` decrypted credentials from `SecureStore.xml` via Android Keystore.
   - Token validated with backend (`/api/v1/users/me`).
   - App bypassed Welcome/Login/OTP screens entirely and immediately recovered `/(customer)/home` within 2.18s.
4. **Screen Integrity:** Customer Home UI rendered with full interactive widgets, bottom tabs, and zero flickering or layout distortion.

---

## 6. Stability, Runtime & Data Integrity Diagnostics

- **Native Exceptions / Crashes:** 0 (zero fatal exceptions across authentication, navigation, and cold restart).
- **ANR Incidents:** 0.
- **React Root Status:** Bridgeless surface attached cleanly; no React root racing detected.
- **Credential & Secret Protection:** In accordance with strict guidelines, zero OTP codes, access tokens, refresh tokens, or raw keys were output in logs or artifacts.
- **Database Baseline Preservation:**
  - `users`: 15 (Protected customer `+919999999990` and worker `+919999999991` intact).
  - `customer_profiles`: 9
  - `worker_profiles`: 7
  - `labour_requirements`: 1
  - `quotations`: 0
  - `bookings`: 0
  - Flyway migrations: V1 through V13 all verified `success: true`.

---

## 7. Evidence Artifacts

The following screen captures and logs were recorded in `.tools/auth-flow-evidence/`:
- `auth_customer_home.png`: Authenticated Customer Home following initial OTP verification.
- `tab_workers.png`: Workers discovery screen with smart filters.
- `tab_jobs.png`: Jobs and requirements management screen.
- `tab_chat.png`: Messaging unavailable banner and direct messaging notice.
- `tab_profile.png`: Profile displaying test identity `Fictional L1 Customer 1` (`+919100008101`).
- `restored_customer_home_fresh.png`: Customer Home after app force-stop and cold-restart session restoration.

---

## 8. Gate Status

**STATUS: PASS**  
The authenticated Android flow and session persistence validation is complete and fully verified.
