# Local development

## Windows toolchain

From the repository root, dot-source `scripts/dev-env.ps1` to select Java 21 and Android SDK for this terminal. Java 25 remains installed. Backend Maven enforces Java 21. Android CLI components and the existing AVD were validated during Phase 1; see ANDROID_VALIDATION.md for historical evidence. Phase 2 requires a new APK including SecureStore and real authentication flows; a historical APK is not Phase 2 validation.

Gradle 9.3.1 is cached under the normal Gradle wrapper directory. The verified binary ZIP is `.tools/gradle-9.3.1-bin.zip`, SHA-256 `b266d5ff6b90eada6dc3b20cb090e3731302e553a27c5d3e4df1f0d76beaff06`. Preserve the normal HTTPS wrapper URL; no mirror or TLS workaround is needed. `.tools/android-sdk` is a local junction to the approved SDK, avoiding native compiler problems with spaces. The React Native Gradle plugin also needs the locally available JDK 17 toolchain; backend execution remains Java 21.

Docker must report an engine in `docker info`. On 30 September, a normal startup failed on a stale Secrets Engine socket. With Docker stopped, only the temporary socket directories were preserved under dated `.nammacrew-backup-*` names and recreated; engine 29.5.3 became available. No image/volume reset or virtualization/security setting change was made. Do not factory-reset Docker to resolve this error.

## Database and backend

Copy `.env.example` to `.env` only if no local file already exists, and configure a unique local database password. Start the database with `docker compose up -d db`. Spring does not automatically read the repository `.env`; supply DB_URL, DB_USERNAME and DB_PASSWORD to the backend process. Default local JDBC URL uses port 5432. Do not publish database access beyond local development.

```powershell
. ./scripts/dev-env.ps1
$env:SPRING_PROFILES_ACTIVE = 'dev'
# Supply DB_URL, DB_USERNAME and DB_PASSWORD from your private local configuration.
cd backend
./mvnw.cmd spring-boot:run
```

Development OTP delivery logs the generated code only under dev without prod/production; use synthetic validation phone numbers. OTPs are never returned in API responses. Production delivery is deliberately unconfigured (503); no paid SMS service is enabled. A production profile takes precedence over dev and must never expose development codes.

Outside dev/test, JWT_SECRET is mandatory: base64 encoding of at least 32 cryptographically random bytes, stored in private process/deployment secrets. Never place it in EXPO_PUBLIC_/VITE_ values, tracked files, command evidence or screenshots. Dev/test may use an ephemeral startup key; restarting the backend invalidates access signatures, while a valid persisted refresh session can issue replacements. Access tokens default to 15 minutes, refresh sessions to 30 days.

V5 retires old V4 refresh credentials and requires existing profiles to finish the newly required onboarding fields. Back up persistent data before applying a migration to a shared environment. Never delete a Compose volume as routine shutdown.

```powershell
./mvnw.cmd -B -ntp clean verify   # unit + real PostGIS integration + formatting
./mvnw.cmd spotless:apply        # format source before verification
```

Tests require Docker and isolated PostGIS containers, even when a development database is already running. Booking invariants remain in the suite. Current results belong in PHASE_2_REPORT.md, not inferred from successful compilation.

## Mobile

```powershell
cd mobile
npm ci
npm start
npm test
npm run typecheck
npm run lint
npm run format:check
npx expo install --check
npx expo-doctor
npm audit
```

EXPO_PUBLIC_API_URL defaults to `http://10.0.2.2:8080` for Android emulator access to the host. Host localhost is appropriate only for browser testing. Physical devices need a reachable LAN address and separately approved network configuration. Credentials live in Expo SecureStore; no fake session entry is used. Server identity and saved onboarding drafts determine routing.

After changing native plugins, generate Android configuration with `npx expo prebuild --platform android --no-install`. This is not an APK build. For the existing Windows toolchain, from mobile/android:

```powershell
$env:ANDROID_HOME = 'D:/Files/EDUCATION/NammaCrew/.tools/android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=D:/Files/EDUCATION/NammaCrew/.tools/java-sockets'
$env:CMAKE_BUILD_PARALLEL_LEVEL = '2'
$env:NODE_ENV = 'development'
./gradlew.bat :react-native-reanimated:prefabDebugPackage :app:assembleDebug --no-daemon --max-workers=1 '-PreactNativeDevServerPort=8083' '-PreactNativeArchitectures=x86_64' '-Porg.gradle.java.installations.paths=D:/Files/EDUCATION/NammaCrew/.tools/jdk17-local/jdk-17.0.20.1+1' '-Porg.gradle.java.installations.auto-download=false'
```

Expected artifact: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Only an existing, successfully built and installed artifact counts. Start Metro on port 8083 for this debug variant, reverse that port with adb, and install on the existing AVD only when `adb devices` reports device. Do not wipe AVD data. Verify customer/worker flows using the real backend and development OTP, not authenticated fixtures. Maestro remains optional tooling; never claim its YAML was executed unless the runner actually ran.

## Admin and boundaries

```powershell
cd admin
npm test
npm run typecheck
npm run build
npm run lint
npm run format:check
npm audit
```

Admin remains a public Phase 1 shell with no administrative data or operational API calls. Phase 3 features are not authorized. No deployment, paid service, new license acceptance, privileged system change, security exception or stable tag is implied by local verification. Do not force incompatible dependency overrides. An audit connection reset means unknown current vulnerability counts, not a clean audit.
