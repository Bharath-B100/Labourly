# Labourly local Android startup

Use the existing isolated database/backend on port 8084. These commands do not start Docker, change database records, build an APK, install an app, or launch the emulator.

From `mobile`, start Metro:

```sh
npm run start:emulator
```

This uses the installed Expo CLI, IPv4-first localhost resolution, port 8083, one worker and a 768 MiB Node heap. It avoids the observed IPv6-only localhost binding mismatch with the emulator's `10.0.2.2:8083` debug-server address. Stop the existing Metro terminal before starting a second server. Do not disable TLS/firewall protections or upgrade packages to run this command.

In another terminal, before launching Android:

```sh
npm run check:emulator
```

The check verifies the isolated backend is UP, IPv4 Metro responds, and a nonempty Android JavaScript bundle is returned with a JavaScript content type. The first bundle may take several minutes on this machine: the 27 October run recorded 460,419 ms for 2,048 modules. The check streams/discards bundle contents instead of retaining a large copy in memory, has a ten-minute bundle deadline and returns a nonzero exit code on failure. It does not bypass a failing backend or bundle.

This is a **host readiness check**, not native acceptance. Check available host/guest memory, emulator-to-Metro and backend connectivity before launching. The existing emulator uses `10.0.2.2`; physical phones require a separate approved connection setup and compatible APK. Keep `.env`, app data, native lifecycle code and database history unchanged.

## Current limitations

- Cached bundle readiness improves the development launch workflow; it does not fix slow compilation or prove production startup performance.
- Metro reload combined with Activity recreation still has unresolved historical race evidence. Do not describe this workflow as lifecycle sign-off.
- Newer local 21 October reports describe individual lifecycle/authentication acceptance; those reports were discovered on 27 October and are not new test runs by this change.
- No new payment, calling, messaging, verification or production OTP capability is introduced.

Reference: [Expo CLI development server documentation](https://docs.expo.dev/more/expo-cli/).

## Verification — 27 October 2026

- Actual preflight: backend UP, IPv4 Metro running, Android bundle HTTP 200 with JavaScript content, 9,229,386 bytes delivered in 180,092 ms; exit 0.
- TypeScript typecheck and lint: both exit 0. Changed files formatted with the existing Prettier installation; script syntax check passed.
- Native read-only hierarchy capture showed an authenticated Worker Profile after the earlier 460-second compilation. This is rendering/session evidence, not a fresh cold-start or complete lifecycle acceptance test.
- An initial version of the probe incorrectly sent JavaScript Accept headers to backend health, receiving HTTP 500 with HttpMediaTypeNotAcceptableException. Corrected the probe to request JavaScript only for bundles; the final run above passed. No backend fix or security claim is implied.
- No dependencies, native sources, environment files or protected records changed. No full mobile/backend regression rerun for these development-command-only changes. Private logs: `.tools/run-20261027/preflight.log`, `startup-typecheck.log`, `startup-lint.log`, `startup-quality.json`.
