# Google login build recovery — 4 November 2026

Status: native verification in progress; real Google authentication has not passed yet.

## Confirmed findings and changes

- Gradle's initial loopback error originates in the JDK Windows selector's Unix-domain socket setup. A minimal `Selector.open()` probe failed normally and succeeded with a short, process-scoped `jdk.net.unixdomain.tmpdir`. No firewall, TLS or system-wide configuration changes were needed.
- Added `scripts/build-google-development.ps1` to apply that setting only during the build and restore Java environment variables afterward.
- The local Expo module needed Android `versionCode` and `versionName` metadata; these are now declared in its library configuration.
- Initially escaped the `in` package keyword, allowing the bridge itself to compile. Expo's generated module list subsequently emitted an unescaped reference and failed compilation. Moved only the new library to `expo.modules.labourlygoogle` and updated its module metadata. The application ID remains `in.nammacrew.mobile`; existing application/backend namespaces and OAuth configuration are unchanged.
- Native compilation exposed an ambiguous zero-argument `Coroutine` overload in `clearSession`. Explicit zero-argument lambda syntax fixes that compiler ambiguity without changing session behavior. Reference: [Expo module API](https://docs.expo.dev/modules/module-api/); actual installed Expo overloads were inspected.
- Added the retained phone-login route explicitly under the unauthenticated route guard.
- Replaced a malformed character in the pending Google login button label.

## Verification so far

- Focused Google authentication, session, onboarding and root-mount tests: 40 passed across 4 suites, exit 0.
- TypeScript, ESLint and full mobile formatting: exit 0. The subsequent pending-label text correction also passed its targeted formatting check.
- Previous full mobile suite: 230 passed across 40 suites; this is earlier evidence, not a new full-suite execution.
- Native failed-run evidence retained: `.tools/google-build-20261104.log` (module metadata) and `.tools/google-build-module-fix-20261104.log` (Kotlin overload; build failed after 8m 4s).
- `.tools/google-build-coroutine-fix-20261104.log`: bridge Kotlin/Java compilation passed; Expo generated-list compilation failed, build exit 1 after 8m 38s. Namespace correction build: `.tools/google-build-namespace-fix-20261104.log`.

## Emulator and preservation

The first emulator process exited after boot with graphics-context errors. The exact exit cause is not established. A second launch uses the existing AVD with process-local `-gpu swiftshader_indirect`; it connected as `emulator-5554`. No data wipe, RAM-allocation edit or APK uninstall was performed. Metro's IPv4 status endpoint returned `packager-status:running`; adb reverse mappings for 8083 and legacy 8081 point to host 8083.

The mobile API URL remains `http://10.0.2.2:8084`. The disposable PostgreSQL container remains present. No database connection, migration or protected-record modification was performed in this recovery. No paid services, Cloud settings, commits, pushes or deployments were performed.

The emulator completed boot and Labourly's Activity was launched. Device-side Metro `/status` returned HTTP 200. A Pixel Launcher ANR appeared while the existing app waited for its bundle; Wait did not resolve it, and the launcher dialog was then closed. Labourly remained the foreground Activity. This is not a successful authenticated startup. Private screenshot and logs are under `.tools/labourly-login-current-20261104.png` and `.tools/google-native-startup-20261104.log`.

The existing `backend/target/backend-0.1.0-SNAPSHOT.jar` does not include Google authentication classes or V16. It has not been started or presented as a compatible Google backend.

## Outstanding acceptance

Successful APK compilation, signature verification, installation preserving data, native Google chooser, backend token exchange, cancellation, logout and session restoration still require actual results. Do not describe the earlier APK or mocked unit tests as proof of those flows. iOS Google sign-in remains outside this Android implementation.
