# Phase 4 dependency security evidence closure

Date: **9 October 2026**, Asia/Kolkata. This replaces the previous **SECURITY SIGN-OFF READY** conclusion, which was not supported. Scope is dependency evidence only; no full Phase 4 re-audit, dependency upgrade, database action, push or stable tag.

## Approval gates

**A — PHASE 4 DEVELOPMENT MILESTONE: conditionally eligible for a development-only freeze after final regression, remaining native acceptance and explicit acceptance of documented production risks. Not an unconditional sign-off today.** Security evidence no longer needs to claim that every dependency is safe to permit a private development milestone. Any confirmed exploitable path in the intended development environment must be fixed or contained before that freeze. Confirm CI/developer protections and assign owners to the unresolved items below.

**B — PUBLIC PRODUCTION RELEASE: NOT READY.** Backend vulnerability status is **UNASSESSED**. Mobile runtime parsing risk needs reachability verification; developer/CI critical and high findings need remediation or supported disposition. A production JS export alone does not certify a signed APK/AAB, native dependencies, deployed backend or every application attack path.

## Current counts and lockfile reconciliation

Official `npm audit --json --fetch-retries=0 --fetch-timeout=12000` responses were obtained on 9 October. Security audit exit status 1 indicates findings, not an unavailable report.

| Application | Moderate | High | Critical | Total |
| ----------- | -------: | ---: | -------: | ----: |
| Mobile      |       12 |   54 |        1 |    67 |
| Admin       |        2 |    6 |        0 |     8 |

The 8 October mobile report contained 68 package findings (12/55/1). The fresh response no longer flags `@testing-library/react-native`; the underlying lockfile was not changed by this task. This is an advisory-response difference, not a dependency fix. npm counts include inherited/meta-vulnerabilities and must not be described as independent exploitable issues.

Every reported node was reconciled to its current lockfile version and reported vulnerable range; installed versions matched the stored-report nodes. No missing or out-of-range nodes were found. Evidence:

- `verification/security-mobile-audit-20261009.json` and `security-admin-audit-20261009.json`: fresh official responses.
- `verification/security-current-reconciliation.json`: fresh counts, node versions, range checks and lockfile hashes.
- `verification/security-lockfile-reconciliation.json`: earlier report reconciliation, advisory details and suggested fixes.
- Mobile lock SHA-256: `89b4f7fe4e4b541cae71d5252142b9ea0de7ccd5f460e7679b0d75bb60e93447`.
- Admin lock SHA-256: `1c4b11f5912be6d6513407e89cde23f3a8ed14fdb4b41cbbf0504423cb5be344`.

## Critical shell-quote: exact chain and exposure

Direct installed chain:

```text
mobile/package.json: react-native = 0.86.3
  react-native@0.86.3 -> react-devtools-core ^6.1.5
    react-devtools-core@6.1.5 -> shell-quote ^1.6.1
      shell-quote@1.10.0
```

The leaf is `mobile/node_modules/shell-quote`; npm labels these dependency edges `prod`. A dependency edge is not proof that a module ships in the application. The complete npm explanation (including other parent/peer paths) is saved in `verification/security-shell-quote-chain.json`.

The official npm response identifies [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), affected range `>=1.8.4 <1.11.0`: command injection in `quote()` involving a line terminator after a comment token. The installed version is affected. **No end-to-end NammaCrew exploit was demonstrated.**

Installed-source evidence:

- `react-native/Libraries/Core/setUpReactDevTools.js:32–39` requires react-devtools-core inside `if (__DEV__)`.
- The DevTools standalone source map embeds a shell-quote module and its editor code imports **parse**, not quote. The DevTools backend source map does not list shell-quote.
- Extracted editor source is retained in `verification/security-devtools-editor-source.txt`. Editor subprocess functionality makes development-host exposure relevant, but this import is not proof that the vulnerable quote function receives attacker-controlled input and executes a command. That sink path remains unverified.

### Production-mode Android JavaScript evidence

Generated offline with installed dependencies:

```text
NODE_ENV=production EXPO_OFFLINE=1
node node_modules/expo/bin/cli export --platform android --source-maps --no-bytecode --max-workers 1 --output-dir ../.tools/security-production-export
```

No `--dev` option was used. `--no-bytecode` retains inspectable production-mode JS; this is **not** an APK or a debug-APK inspection. The existing emulator/Metro acceptance session was not reinstalled or reset.

Bundle: `.tools/security-production-export/_expo/static/js/android/entry-c3bb83fbc6cb01ab717d103c1fc37cae.js`.
SHA-256: `f68d254b8778cd805a7b5524ccfc4c36e7320d08725cf99204a416c32d80c88b`.
Source-map SHA-256: `e7a27753d602709940ddd6c09f588086f044870c321fee840a4da81c932d48b9`.

The emitted map contains 1,851 sources and **zero shell-quote or react-devtools-core sources**. This corroborates exclusion from this Android production JS export. Source-map inspection plus the guarded import is stronger evidence than a debug APK or a text search alone, but does not prove universal exclusion across future builds, iOS/web, packaged native libraries or changed build configuration. No signed production APK/AAB was generated in this task.

Evidence: `verification/security-production-export.log`, `security-production-bundle-evidence.json`; bundle/map retained in the project `.tools` directory.

## High/moderate findings: do not blanket-dismiss

| Category                                 | Evidence and assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Production mobile parser                 | **decode-uri-component@0.2.2 is present** in the production source map, alongside query-string and Expo Router. query-string imports it and calls it from decoding; Router path parsing imports query-string. The audit reports malformed-percent-input denial of service, [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). External-link input is a plausible entry route; attacker-controlled reachability, platform limits and exploit reproduction remain unverified. Must assess before public launch. |
| Runtime packages with inherited findings | React Native, virtualized-lists, Expo Router, Reanimated, Worklets and CSS interop have sources in the bundle. Presence of these parents does not establish inclusion of every vulnerable transitive tool, but disproves treating every flagged package as exclusively build-only. Follow each leaf advisory to its actual import/sink.                                                                                                                                                                                              |
| Expo CLI exception                       | The map includes `@expo/cli/build/metro-require/require.js`. A package named CLI is not automatically absent at runtime. This file's presence does not demonstrate reachability of the CLI's inherited node-forge/Metro advisories.                                                                                                                                                                                                                                                                                                  |
| Mobile build/test tools                  | The inspected map excludes shell-quote, braces, Jest families, Tailwind, node-forge, source-map-js and the listed Metro tool packages. This narrows this JS-runtime exposure only. Build/test/CI execution still processes source, globs, maps, certificates or formatting input and may have secrets/filesystem access.                                                                                                                                                                                                             |
| Admin browser artifact                   | Fresh local `vite build --sourcemap --outDir ../.tools/security-admin-production` succeeded. Maps contain none of the eight flagged package families: braces, chokidar, fast-glob, micromatch, postcss-nested, postcss-selector-parser, source-map-js, tailwindcss. Their tools run during build; browser absence does not clear CI/developer exposure. Evidence: `security-admin-production.log`, `security-admin-bundle-evidence.json`.                                                                                            |

Leaf advisories in the stored/fresh responses include braces stack exhaustion, source-map-js indexed-map denial of service, node-forge signature-verification behavior, selector-parser CPU exhaustion and sprintf-js precision denial of service. No exploitability experiment or comprehensive input-flow analysis was performed for each leaf. **Absence of a demonstrated exploit is not proof of safety.** Production maps are local evidence; do not publish source maps or embedded source unintentionally.

## Fix-availability correction

The previous assertion that no compatible fixes exist was unsupported. Audit `fixAvailable` is true for shell-quote and source-map-js. Reported shell-quote fix 1.11.0 fits the parent's `^1.6.1` range; source-map-js's reported affected range ends at 1.2.2. These are candidate compatible remediations, not verified fixes in this project. Inspect resolution paths and run focused build/regression checks in a separately authorized change. Some suggested root substitutions are major changes or downgrades; they are not reliable upgrade plans. The previous Expo SDK 52 / React Native 0.76 recommendation did not match installed Expo 57 / RN 0.86.3 and is withdrawn. No forced fix, override or upgrade was applied here.

## Backend: inventory available, vulnerability status UNASSESSED

The default offline dependency-tree command failed because maven-dependency-plugin 3.8.1 was not cached. Explicitly using already cached **3.6.1** succeeded:

```text
Java 21
mvnw.cmd -o org.apache.maven.plugins:maven-dependency-plugin:3.6.1:tree
```

Full compile/runtime/test graph: `verification/security-backend-dependency-tree.txt`; successful tool log: `security-backend-inventory-cached.log`. Examples include Spring Boot 3.5.16, Spring Web 6.2.19, Tomcat 10.1.55, Logback 1.5.34 and test-scoped Testcontainers 1.21.4 / commons-compress 1.24.0. Version listing is not a CVE assessment, and test-scoped dependencies still matter to CI.

No usable vulnerability data was located under the Maven OWASP cache; the usual `~/.m2/repository/org/owasp/dependency-check-data`, `%LOCALAPPDATA%/DependencyCheck` and `~/.dependency-check` data directories do not exist. Plugin JARs being cached does not mean its advisory database is cached. The cached Dependency-Check 13.0.0 offline invocation with auto-update disabled refused execution because the goal requires online mode; it produced no scan result (`security-backend-cache-scan.log`).

A bounded TLS-verified request to the official `https://services.nvd.nist.gov/rest/json/cves/2.0` endpoint timed out with zero bytes (`security-nvd-connectivity.txt`). npm connectivity succeeded but does not establish NVD connectivity. No security setting or mirror was changed and no repeated database download was attempted. A reliable backend vulnerability scan remains unavailable: **UNASSESSED, not SECURE, and not “unchanged from JavaScript evidence.”**

## Concrete disposition

### Confirmed exploitable issues

**None demonstrated end-to-end in NammaCrew by this task.** Affected installed dependency versions are confirmed, including critical shell-quote; the critical function's attacker-to-command path has not been demonstrated. This is an evidence limitation, not a zero-vulnerability claim.

### Unverified security risks

- Production-bundled decode-uri-component and deep-link/query decoding exposure.
- Development/CI command-injection and parsing/resource-exhaustion advisories, including whether untrusted PRs, sources or configuration can reach affected functions.
- Backend CVEs: UNASSESSED; no trustworthy completed scan/data freshness evidence.
- Signed release/native-library contents and per-leaf runtime reachability beyond the inspected Android JS/admin exports.

### Required before Phase 4 development milestone sign-off

- Complete the already required final regression/native acceptance against an identified candidate; this focused task did not rerun the entire audit.
- Accept explicitly that the milestone is private development only and does not authorize public launch; record owners for runtime parser triage, backend scan and tooling remediation.
- Verify containment: no secrets/privileged tokens for untrusted builds; trusted dependency sources/lockfiles; restrict development servers and do not run unreviewed input in privileged CI. These controls are recommendations, not verified infrastructure settings.
- Fix or contain any demonstrated exploit relevant to that development environment before freezing. No blanket “all high findings harmless” exception.

### Required before public launch

- Complete reliable backend scanning against current official data, retain dated results and triage runtime versus test findings.
- Establish and address malformed-link/query parsing reachability and input limits; test affected production routes with bounded adversarial inputs in isolation.
- Verify candidate compatible shell-quote/source-map-js remediation and assess the remaining high/critical development/CI findings; no automatic major upgrades.
- Rebuild the signed release from reviewed lockfiles, inspect its actual JS/native composition and validate the deployed configuration. Close other public-launch gates from the Phase 4 audit separately (this is not a re-audit).

### Risks conditionally deferred for a private development milestone

- Shell-quote mobile-runtime exposure: exclusion is supported for the inspected Android production JS export. Development/CI exposure still needs containment; exclusion alone does not justify public security sign-off.
- Admin flagged build tools and mobile tooling absent from the inspected bundles: remediation can be scheduled with named owners for a private milestone if trusted-input/least-privilege CI controls are verified. Do not defer a demonstrated exploitable CI path.
- Backend vulnerability assessment may remain explicitly UNASSESSED for an isolated development milestone with accepted risk, but cannot be converted to a public-launch security PASS.

**Final conclusion: DEVELOPMENT MILESTONE — CONDITIONAL; PUBLIC RELEASE — NOT READY; BACKEND VULNERABILITIES — UNASSESSED.** No security sign-off or stable tag is issued.
