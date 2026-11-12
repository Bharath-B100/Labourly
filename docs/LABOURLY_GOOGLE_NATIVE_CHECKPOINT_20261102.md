# Google native integration checkpoint — 2 November 2026

Status: implementation prepared; Android build and real Google acceptance BLOCKED.

## Implemented
- Local Expo Android module `modules/labourly-google`, using pinned AndroidX Credential Manager 1.5.0 and Google ID 1.1.1. No licensed React Native Google library, Firebase setup, billing, client secret, or SMS service.
- Explicit Google account chooser with the backend-generated nonce; token returned only to existing backend verification/session endpoints. Cancellation returns no credentials. Native and JavaScript guards reject overlapping sign-in attempts.
- Main login uses Google. Existing OTP login retained at `/auth/phone-login` for existing accounts; no automatic merging or privileged roles.
- Existing SecureStore/JWT/session handling reused. Nullable Google authentication phone accepted; contact phone remains separate profile data, not a verified login credential.
- Logout clears local credentials, attempts provider session cleanup, and retains backend refresh revocation. Provider cleanup failure does not prevent revocation.
- Expo autolinking detects the module. No MainActivity, ReactHost, lifecycle cleanup or signing configuration edits.

## Verified configuration
Google Cloud inspected with account selector `authuser=1`. Android OAuth client package `in.nammacrew.mobile` and SHA-1 match the local debug keystore and the existing APK:
`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`.
Web client matches the backend audience. No Cloud settings changed. Consent/audience and real provider login still need acceptance. No emulator/device was connected during the certificate check.

## Build limitation
Two build attempts exited 1 before compilation: `java.io.IOException: Unable to establish loopback connection`. The second used process-scoped IPv4 preference and no persistent environment changes. No successful compilation of the new Kotlin module, dependency resolution, installation, or real Google authentication is claimed. Existing APK predates the bridge and cannot run Google login. Do not distribute it as the completed integration.

Command: `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --max-workers=2` (second attempt added `--no-daemon` with scoped JAVA_TOOL_OPTIONS). Logs `.tools/google-android-build.log`, `.tools/google-android-build-ipv4.log`.

## Tests
Initial mobile run: 227 passed, 1 failed (old phone test imported the now-Google route), exit 1; preserved `.tools/google-mobile-tests.log`. Test now follows retained phone route; assertions preserved. Added native-transport mocked tests for nonce/token exchange, cancellation, missing module/token, backend rejection/retry, concurrent invocation and provider cleanup. Added UI entry and nullable-phone restoration coverage.
Final results recorded below after execution. These mocked tests cannot establish native SDK compatibility or Google token issuance.

## Files for this task
- mobile/modules/labourly-google/package.json
- mobile/modules/labourly-google/expo-module.config.json
- mobile/modules/labourly-google/android/build.gradle
- mobile/modules/labourly-google/android/src/main/java/in/nammacrew/google/LabourlyGoogleModule.kt
- mobile/src/auth/google.ts
- mobile/src/auth/session.ts
- mobile/src/app/auth/login.tsx
- mobile/src/app/auth/phone-login.tsx
- mobile/src/__tests__/google-auth.test.ts
- mobile/src/__tests__/onboarding.test.tsx
- mobile/src/__tests__/session.test.ts
- this report

Next: diagnose Gradle loopback failure without security bypass; compile and resolve any native compatibility errors; install without clearing data; verify real Google login/cancellation/logout, restored sessions and both-role onboarding against isolated backend with V16 available. Existing accounts must use explicit linking rather than inferred phone/email merges. iOS implementation remains unavailable.

Sources: https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation and https://docs.expo.dev/versions/v57.0.0/ .

Final verification: full mobile Jest 230/230 passed across 40 suites (52.224 s), exit 0; TypeScript exit 0; ESLint exit 0. Formatting initially exited 1 for the new google-auth test; formatted that file and reran the full formatting gate, exit 0. Logs: `.tools/google-mobile-final.log`, `google-types-verified.log`, `google-lint-verified.log`, `google-format-verified.log`, `google-format-retest.log`. Backend code/migrations unchanged, backend tests not rerun. Native compilation and device tests remain BLOCKED as above. No commits, deployment, billing changes or database access.
