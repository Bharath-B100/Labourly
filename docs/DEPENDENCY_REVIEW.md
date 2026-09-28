# Mobile dependency review — 22 September 2026

## Result

Initial audit: 13 moderate dependent-package findings, zero high/critical. After the verified scoped fix: 3 moderate dependent-package findings, zero high/critical. Do not interpret the count as 13 or 3 independent vulnerabilities.

## Fixed: uuid

Path: Expo → config plugins → `xcode@3.0.1` → `uuid@7.0.3`.

[GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) describes missing buffer bounds checks in v3/v5/v6. The inspected `xcode/lib/pbxProject.js` caller uses only `require('uuid').v4()` with no arguments and transforms it to a 24-character project ID. There is no application call to the affected buffer APIs.

Applied a narrow npm override under `xcode@3.0.1` to `uuid@11.1.1`, which retains the required CommonJS v4 API. No global override, Expo downgrade or forced install was used. `npm run test:dependencies` verifies the resolved version and exercises the actual Xcode caller to generate 10,000 distinct valid IDs. Native iOS compilation remains untested on this Windows machine.

## Unresolved: decode-uri-component

Path: `expo-router@57.0.22` → `query-string@7.1.3` → `decode-uri-component@0.2.2`.

[GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) affects versions through 0.4.2 and is fixed in 0.5.0. Malformed percent-encoded input can cause excessive decoding work and unresponsiveness. URL input is relevant to routing, so this is not dismissed as development-only.

The published 0.5.0 package was downloaded and inspected without replacing the installed dependency. It is ESM and exposes a default export; the installed query-string caller requires a CommonJS function. An executed compatibility probe returned `function` for 0.2.2 and `object` with a default function for 0.5.0. A direct override would break that caller. It also changes plus-sign handling. No speculative override or hand-written decoder was added.

The npm suggestions to downgrade Expo Router to 5.1.11 or Expo to 46 are incompatible with the chosen SDK and were rejected. Current SDK 57 and Router 57 patch lists had no newer compatible release at review time. Resolution needs an upstream compatible patch or a separately reviewed backport with URI parsing regression coverage. Keep the finding open before product release.

## Test dependency alignment

The React Native Testing Library peer range auto-selected `test-renderer@1.3.0`, whose reconciler expects React 19.3. Expo 57 fixes React at 19.2.3. Added exact development dependency `test-renderer@1.2.0`, using reconciler 0.33 for React 19.2. This matches the testing library's own declared development setup. The exact pin prevents a later install silently choosing 1.3 again.

The combined startup/offline test hit its 5-second limit on the memory-constrained machine. Split it into focused startup and offline tests, retaining every assertion and the default timeout; all three mobile tests subsequently passed. No test was skipped. Native rendering is still a separate uncompleted validation gate.

`expo-system-ui` was installed with Expo's resolver to satisfy the existing explicit light-interface configuration reported during native prebuild. This is foundation configuration only.

Audit evidence: `verification/mobile-npm-audit.json` (baseline) and `verification/mobile-npm-audit-final.json` (last successful audit). During the Android validation continuation, three fresh audit attempts failed with `ECONNRESET` from npm's advisory endpoint; see `verification/mobile-audit-recheck.json` and its stderr log. The three moderate entries therefore remain open but are not a freshly verified count. No dependencies or overrides changed in the continuation. Build/test results are in the Phase 1 report.

Subsequent retry after the user's instruction to continue **succeeded**: `verification/mobile-audit-after-continue.json` confirms 3 moderate, 0 high and 0 critical, superseding the failed retries above. The vulnerable entries remain decode-uri-component, query-string and expo-router. npm version queries still list Router 57.0.22 and query-string 7.1.3 as the latest within their respective installed major series. The scoped uuid compatibility test passed again. No incompatible fix was forced.

## Phase 1 continuation — 28 September 2026

Applied only Expo SDK 57 compatible patches using `npx expo install --fix`: Expo 57.0.25, Linking 57.0.11 and Router 57.0.23. The resolved tree also updates React Native Screens within its supported ~4.26 range to 4.26.2, Expo Modules Core to 57.0.19 and Expo UI to 57.0.20. Expo install --check and Expo Doctor (21/21) pass. `npm ls --depth=0` reports no invalid dependency, and the scoped Xcode/uuid caller check passes 10,000 IDs. Native rebuild and final regression results are recorded in ANDROID_VALIDATION.md.

The installed chain remains Router 57.0.23 -> query-string 7.1.3 -> decode-uri-component 0.2.2. Registry metadata lists 7.1.3 as the latest query-string 7 release. The [reviewed upstream advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) still marks decode-uri-component <=0.4.2 affected and 0.5.0 patched. The previously verified CommonJS/ESM caller incompatibility still precludes a blind major override. No forced incompatible fix was applied.

Fresh npm audit is BLOCKED, not PASS: the official bulk-advisory endpoint resets connections while metadata/package installation succeeds. A separate Windows HTTPS client and bounded IPv4/HTTP1.1 probe also failed, with TLS verification enabled. Therefore the historical 3 moderate / 0 high / 0 critical mobile count is not a fresh full-tree security result after these patches. Admin's latest audit is blocked for the same reason. Await approved working network access before the security sign-off gate.
