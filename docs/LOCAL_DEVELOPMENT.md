# Local development

## Updated Windows setup

Java 21 is now installed alongside Java 25. From the repository root, run `. .\scripts\dev-env.ps1` to select NammaCrew's JDK 21 and Android SDK for the current terminal, or run `.\scripts\verify-backend.ps1` for the full backend gate. Maven rejects other major JDKs. Docker has been recovered and full backend verification passed.

Android SDK files were found at the user's existing LocalAppData Android directory and environment variables configured. Android Studio installation still awaits SDK license acceptance; Gradle downloads and native-device validation are blocked. See [current environment and blockers](FINAL_VALIDATION_ENVIRONMENT.md) for authoritative details. The prerequisite inspection below describes the original foundation run.

## Prerequisites and approval boundary

This task installed only repository dependencies and the project Maven wrapper. No system installer, account authentication, paid service, SDK license acceptance or production deployment was performed.

The inspected machine has Node 22.16.0, npm 11.4.2, Git 2.50.0, Java 25, and Docker CLI 29.5.3. Maven is supplied through `backend/mvnw` and `mvnw.cmd`. The wrapper downloads Maven 3.9.16 to the standard Maven cache. Android SDK tools, Maestro and Java 21 were not found. Docker's Linux engine was unavailable even after a CLI start attempt.

Approve these system-level setup steps before asking the agent to perform them:

1. Install a Java 21 JDK (Temurin 21 is suitable), then point JAVA_HOME to it. Retain the existing Java 25 installation if other work uses it.
2. Open Docker Desktop and complete any necessary setup yourself; verify Linux containers with `docker info`. If WSL/virtualization setup is required, approve that separately before enabling Windows features or restarting.
3. Install Android Studio and its SDK, platform tools, Android API 36 and an emulator. Accept licenses yourself. Set ANDROID_HOME to the actual SDK path and add platform-tools to PATH.
4. For native E2E, set up Maestro using its supported installation path and run it against an installed development APK. On Windows, use a supported WSL workflow if needed; do not assume the Maestro flow was run merely because its YAML exists.

Node 22.16.0 satisfies the selected frontend versions. Vite 6.4.3 was chosen to work with that Node installation. Newer Vite releases may require a newer Node patch; upgrade together after compatibility checks. Do not use `--legacy-peer-deps`, `--force`, or blind `npm audit fix --force` to hide dependency conflicts.

## Database and backend through Docker

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
# Edit .env: choose a unique local POSTGRES_PASSWORD and use the same value for DB_PASSWORD.
docker compose --profile app up --build
```

This builds using Java 21 inside Docker and starts PostgreSQL/PostGIS. The migration user must be allowed to create PostGIS and btree_gist extensions locally. Data persists in the named volume. Stop with `docker compose down`; deleting the volume deletes local data and is not part of routine shutdown.

## Backend with the Maven wrapper

Start only the database using `docker compose up -d db`. Supply these values in the backend process environment; Spring does **not** read the root `.env` automatically:

```powershell
$env:JAVA_HOME = 'C:\path\to\your\jdk-21'
$env:DB_URL = 'jdbc:postgresql://localhost:5432/nammacrew'
$env:DB_USERNAME = 'nammacrew'
# Set DB_PASSWORD to your local password without putting it in tracked files.
cd backend
.\mvnw.cmd spring-boot:run
```

Use your terminal/IDE secret environment configuration for the password. The backend fails startup when required credentials are missing. On macOS/Linux use `bash mvnw` if the checkout did not preserve executable permission.

```powershell
.\mvnw.cmd test                 # Unit/security slice tests, no database
.\mvnw.cmd spotless:apply       # Java formatting
.\mvnw.cmd package             # Unit tests + executable jar
.\mvnw.cmd verify              # Full gate: unit + PostgreSQL integration + formatting
```

Full verification requires a working Docker engine even when a separate development database is running. Testcontainers creates an isolated PostGIS database with synthetic data. CI uses Java 21. This machine compiled with `--release 21` under Java 25; that is not proof of execution under Java 21.

## Mobile

```powershell
cd mobile
npm ci
Copy-Item .env.example .env
npm start
```

Use `http://10.0.2.2:8080` for an Android emulator, `http://localhost:8080` for a browser on this computer, or a reachable LAN address for a physical device. Compose binds backend access to loopback by default; physical-device testing needs a deliberately configured development-only network binding and firewall access. Do not expose database ports or administrative endpoints publicly.

Expo's dev server can present the shell in a compatible client. `npx expo run:android` builds a local native app once the Android SDK and Java toolchain are installed. A Metro export is **not** an APK or native-device test. Native builds need a reviewed development HTTP policy or HTTPS API; do not enable global cleartext traffic in a release build. Future iOS builds require macOS/Xcode or separately approved cloud builds.

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform android --platform web
maestro test .maestro/smoke.yaml
```

The Maestro command requires the installed app `in.nammacrew.mobile`; it cannot target Expo Go using that package identifier. Its smoke flow verifies the public foundation screen only. Authentication is not implemented, so protected worker and customer routes cannot be entered through a fake login.

## Admin

```powershell
cd admin
npm ci
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

The navigation shell is public, contains no administrative data, and makes no administrative API requests. The page shows an explicit authentication-not-configured notice. Do not interpret it as an operational dashboard.

## Environment variables

| Variable            | Consumer           | Meaning / default                                              |
| ------------------- | ------------------ | -------------------------------------------------------------- |
| POSTGRES_DB         | Compose            | Local database name; required                                  |
| POSTGRES_USER       | Compose            | Local database owner; required                                 |
| POSTGRES_PASSWORD   | Compose            | Unique local password; required, no default                    |
| DB_URL              | Backend            | JDBC URL; defaults to local nammacrew database                 |
| DB_USERNAME         | Backend            | Required database username                                     |
| DB_PASSWORD         | Backend            | Required database password                                     |
| OPENAPI_ENABLED     | Backend            | Default false; true still requires ADMIN                       |
| EXPO_PUBLIC_API_URL | Mobile             | Public base URL; emulator default 10.0.2.2:8080                |
| VITE_API_URL        | Admin              | Public API configuration, default localhost:8080; no calls yet |
| JAVA_HOME           | Maven/native build | JDK root; use Java 21 for backend validation                   |
| ANDROID_HOME        | Native toolchain   | Actual Android SDK path                                        |

EXPO_PUBLIC_ and VITE_ values are bundled into clients and must never contain secrets. `.env` files are ignored; examples contain no credentials. Use managed secrets when a production environment is approved.
