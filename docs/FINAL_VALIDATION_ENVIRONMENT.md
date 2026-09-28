# Final validation environment

Date: 22 September 2026. Scope: Phase 1 only.

Latest continuation: see [Android validation](ANDROID_VALIDATION.md). The user has confirmed SDK license acceptance and approved Maestro installation. The emulator has since recovered without a wipe and reached the backend through `10.0.2.2:8080` with HTTP 200/UP. The Android section below records the earlier attempt and is superseded by the continuation where results differ.

## Java

Installed Microsoft Build of OpenJDK 21.0.12.1+1 alongside the existing Oracle Java 25 using the official archive. The Temurin GitHub download failed with connection resets; Microsoft's official distribution downloaded successfully.

- Install directory: `%LOCALAPPDATA%\Programs\NammaCrew\Java\jdk-21.0.12.1+1`
- Verified archive SHA256: `192441a9d27da813bada974bb88b4cf64d37a9589ed37f204374d411ca5ce07f`
- Source: [Microsoft OpenJDK downloads](https://learn.microsoft.com/en-us/java/openjdk/download), linked ZIP and SHA256 file.
- User variable `NAMMACREW_JAVA_HOME` identifies this installation.
- `scripts/dev-env.ps1` sets JAVA_HOME and PATH only for the current shell; the system Java default is preserved.
- Maven Enforcer requires Java `[21,22)` so the wrong JDK fails explicitly.

Use from the repository root:

```powershell
. .\scripts\dev-env.ps1
.\scripts\verify-backend.ps1
```

Both JDKs were executed successfully to confirm they remain available. Full backend verification was executed on Java 21, not merely compiled with a Java 21 target.

## Docker diagnosis and recovery

Docker Desktop 4.78.0 / Engine 29.5.3 crashed while initializing Unix socket listeners. Logs specifically identified inaccessible zero-byte reparse-point sockets at `%LOCALAPPDATA%\Docker\run\dockerInference` and `%LOCALAPPDATA%\docker-secrets-engine\engine.sock`.

WSL 2.7.8 successfully started Ubuntu. Windows reported `HypervisorPresent=True`, and the Android emulator reported WHPX installed and usable. The CPU virtualization flags alone were misleading when the hypervisor was active; no BIOS or Windows virtualization change was needed.

With Docker processes stopped, attempted to rename the single stale socket; Windows rejected that operation. Preserved its containing runtime directories under these names, recreated empty runtime directories, and started the already-installed Docker Desktop:

- `%LOCALAPPDATA%\Docker\run.nammacrew-backup-20260922`
- `%LOCALAPPDATA%\Docker\run.nammacrew-backup-20260922-2`
- `%LOCALAPPDATA%\docker-secrets-engine.nammacrew-backup-20260922`

The last directory was checked to contain only the zero-byte `engine.sock` before moving it. No application data, database volume, image store or virtualization setting was deleted or changed by this recovery. Backup directories are retained. This task did not invoke factory reset or reinstall Docker.

`docker info` then returned server version 29.5.3. Pulled `postgis/postgis:17-3.5`, digest `sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6`. Testcontainers successfully ran PostgreSQL 17.5/PostGIS, applied migrations, ran tests and cleaned up its containers. Recovery across a future Windows/Docker restart has not been tested; recurrence requires investigation, not an automatic destructive reset.

## Android

Inspection beyond PATH found an existing SDK at `%LOCALAPPDATA%\Android\Sdk`, including platform-tools, Android platform 36, build-tools 35.0.0 and 36.1.0, emulator and a `Medium_Phone_API_36.1` AVD. The earlier report that SDK tools were missing was based on command availability; these existing files were not detected then.

Set user-level ANDROID_HOME and ANDROID_SDK_ROOT to the existing SDK and added its platform-tools/emulator directories to user PATH, preserving existing entries. The project environment script also supplies these values to the current session.

Android Studio is not installed. The approved installation attempt for `Google.AndroidStudio` 2026.1.4.7 stopped at the required [Android SDK License Agreement](https://developer.android.com/studio/terms); license authorization was requested and remains pending. No license-acceptance flag was supplied.

No physical device appeared in `adb devices`. Launched the existing AVD headlessly, read-only, without saving a snapshot. It failed loading its prior `goldfish_pipe` snapshot and remained offline. Stopped only this task's emulator processes to relieve memory pressure; the existing AVD was not wiped or overwritten. A native boot/device check is not passed.

Expo Android prebuild generated the native project. Java 21 then attempted `assembleRelease -PreactNativeArchitectures=x86_64`. The Gradle 9.3.1 distribution download failed with a TLS connection reset. Downloads from official alternate Gradle/GitHub endpoints also reset. Certificate verification was not disabled; no proxy or firewall settings were changed; no unofficial mirror or incompatible Gradle downgrade was used.

Therefore no APK was built, installed or launched. Maestro is unavailable and its native smoke test was not executed. Additional SDK/NDK/CMake requirements may surface once Gradle downloads successfully; their installation and native compatibility have not been validated.

Next actions: respond to the pending license question; restore access to the official Gradle distribution; complete Studio/SDK setup; cold-boot an emulator or connect an authorized device; build/install the APK and run native smoke tests. Any extra network/security, system or virtualization change requires approval first.

## Recurrence and recovery — 28 September 2026

The inaccessible `dockerInference` runtime socket startup error recurred. Docker was fully stopped. Both runtime directories were verified to contain only zero-byte socket reparse points, renamed to dated backups, and recreated empty. Docker Desktop restarted and Engine 29.5.3 responded successfully. Backups: `%LOCALAPPDATA%/Docker/run.nammacrew-backup-20260928` and `%LOCALAPPDATA%/docker-secrets-engine.nammacrew-backup-20260928`. No volume, image, application settings, security or virtualization changes. Root cause of recurrence remains unproven. Evidence: `verification/docker-recovery-20260928.txt`.

The subsequently executed Java 21 Maven clean verify passed 16 checks with no failures/errors/skips, including 12 PostgreSQL/PostGIS integration checks and ten repeated booking races. V3 addresses the newly observed exclusion-index deadlock through ordered worker row locks. Earlier failure remains in the 25 September log. Native APK and smoke results now supersede the historical missing-APK statements above; see ANDROID_VALIDATION.md.
