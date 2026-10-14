# Location and service coverage implementation — 2026-10-08

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Status: PARTIAL. Automated gates pass; native acceptance is blocked by the installed debug client's Metro transport failure. Phase 4 is not signed off. No Phase 5, commit, tag or push.

## Stages

- A: Implemented. Versioned explicit state crosswalk, retained 3,781 places, 763 GeoNames district references, 3,754 source-resolved relationships and 27 explicitly unresolved relationships. V10 applied successfully in disposable tests and local development through Flyway. V1–V9 were not edited.
- B: Implemented and integration-tested. Authenticated worker self-service GET/PUT `/api/v1/workers/me/service-coverage`; normalized radius/state/district coverage and explicit nationwide flag. Shared server-side predicate used by Suitable Workers, opportunities, worker discovery, quotation creation and editing.
- C: Implemented; component tests pass. Worker profile includes Service Areas, independent home label, local base city/radius, multiple states/districts, nationwide toggle, review/save and failure states. Native interaction remains unverified.
- D: Implemented; tests pass. Post Requirement has no hardcoded Bengaluru coordinate state. GPS or offline canonical city selection requires explicit confirmation. City-centre positions are marked approximate. Backend derives city labels and checks submitted city-centre coordinates. GPS coordinates retain no asserted state/district identity.
- E: PASS for executed automated gates below.
- F: PARTIAL. Backend/PostGIS healthy; emulator is `device`; Metro serves the new Android bundle. Installed application relaunch remains blank after an HTTP chunk parsing failure. No new APK was built.

## Crosswalk and provenance

See `reference/location/STATE_CROSSWALK.md` for all 36 entries and `state-crosswalk-v1.json` for identifiers, official names, URLs, reference dates and review notes. Karnataka GeoNames 19 maps to LGD 29, while LGD 19 is West Bengal. Current CLDR suffixes CG/TS/UK and merged UT DH are distinguished from historical CT/TG/UT/DN/DD. Existing free-text application codes are not rewritten; observed live values KA/TN remain compatible. The original GeoNames-key city selector remains intact.

Government LGD HTML downloaded successfully from https://dilrmp.gov.in/dilrmpold/dashboard/state-list-dashboard . CLDR release-48 English subdivision XML and validity XML were readable through the web reader. Direct raw.githubusercontent.com requests failed TLS/connection-reset; no TLS settings changed. The data.gov.in catalogue did not provide a usable dataset download in this session. Source hashes and the government snapshot are retained. The builder uses explicit reviewed tuples, not numeric equality or fuzzy name matching.

District identifiers are explicitly `geonames:<id>`; they are not falsely presented as LGD district codes. District relationships are verified against the local source, not independently surveyed administrative boundaries. Many-to-many city/district storage is supported. Multi-district/ambiguous cities do not grant district-only coverage without verified worksite disambiguation. All unresolved places retain state, coordinates and identity.

## Matching behavior and limitations

- Radius OR selected district OR selected state OR explicit nationwide coverage.
- Existing radius behavior is retained until a worker explicitly saves new coverage; no missing centre is invented and no nationwide rows are backfilled.
- Active, completed, visible workers are required. UNAVAILABLE workers may appear informationally in Suitable Workers but cannot receive actionable opportunities or create/edit quotes.
- Opportunities filter reserved booking overlaps. Quote submission/edit checks its proposed future schedule for overlap. Acceptance retains the database reservation/exclusion constraints, including concurrency protection. Quote schedules may differ from the requirement's requested dates, consistent with the existing negotiation model.
- Missing distance is not reported as zero. Available workers rank ahead of unavailable workers; distance orders eligible candidates without excluding outstation coverage.
- GPS state/district labels are unverified; state/district-only eligibility cannot be inferred. No administrative boundary dataset was added. GPS location attestation and India-boundary validation are not implemented; nationwide geographic jurisdiction must not be treated as independently verified for arbitrary client GPS coordinates.
- Protected legacy draft `TEST-RECORD-08` has NULL canonical identifiers, deliberately unchanged. Selecting district/state coverage alone will not match that legacy draft. A separately authorized location-confirmation flow or a new native-created canonical requirement is needed for that acceptance case. No silent free-text backfill was performed.
- Team tables exist, but the current mobile marketplace exposes worker/team-owner profiles rather than a complete separate team service. Coverage is attached to that profile; independent team coverage and membership-based eligibility are not introduced.

## Executed gates

| Gate | Actual result | Evidence |
|---|---|---|
| Java 21 Maven offline verify | PASS: 4 unit + 61 integration, 65 total, zero failures/errors/skips | `verification/location-backend-final-20261008.log` |
| PostGIS / Flyway | PASS: migrations V1–V10, canonical constraints/coordinates, isolated tests | same backend log |
| Mobile | PASS: 13 suites, 68 tests, zero failures | `verification/location-mobile-final-tests.log` |
| Mobile TypeScript | PASS | `verification/location-mobile-final-types.log` |
| Mobile lint | PASS, no warnings in final run | `verification/location-mobile-final-lint.log` |
| Mobile formatting | PASS | `verification/location-mobile-final-format.log` |
| Admin | PASS: 1 suite / 2 tests; TypeScript/Vite build, lint, formatting | `verification/location-admin-*-20261008.log` |
| Emulator backend health | HTTP 200, UP | `verification/location-runtime-emulator-health.txt` |
| Android Metro bundle | HTTP 200, 9,229,386 bytes | `verification/location-native-bundle-retry-20261008.log` |
| Native new-screen rendering | BLOCKED: blank after reload | `verification/location-native-final.xml`, `verification/location-native-transport-error.txt` |

Earlier failed runs are retained: a PowerShell Maven argument parsing error, initial Java formatting failure, two updated-contract test failures, and a Jest query-cache timer leak. These were corrected and rerun without disabling checks. No dependency changes or fresh security audit were performed in this upgrade.

## Runtime and data preservation

Backend PID 33124 runs the separate `.tools/backend-location-runtime-20261008/backend.jar` with seeding disabled, Flyway enabled, on port 8080. PostgreSQL/PostGIS remains `nammacrew-db-1`. Metro port 8083 remains available. Emulator `emulator-5554` is online. The existing APK is `mobile/android/app/build/outputs/apk/debug/app-debug.apk`, 78,956,130 bytes, built 2026-10-07. These source changes add no native dependency/configuration, so the development client can normally consume them from Metro; a self-contained distribution APK would need a new build.

Before/after comparison confirmed all original protected record fields unchanged: booking `TEST-RECORD-02` CONFIRMED; quotation `TEST-RECORD-01` ACCEPTED; competing requirement DRAFT; Worker A/C/E profiles and service locations unchanged. Only additive NULL location columns appeared on the requirement. New coverage table contains zero configured workers. Evidence: `verification/location-data-preservation-20261008.json`.

## Remaining acceptance work

Resolve debug-client/Metro chunked-response ProtocolException without changing security settings; then visually exercise Service Areas and GPS/manual posting. Do not mark these interactions passed based on bundle generation or component tests. the project owner must explicitly configure live worker coverage; the agent has not saved coverage, published a requirement, submitted or accepted a quotation.

Resolve the protected draft's missing canonical identity through a separately approved workflow before expecting district/state coverage to match it. Complete native acceptance and review GPS jurisdiction limitations before sign-off.

LOCATION COVERAGE PARTIAL — REPORT BLOCKERS

## Follow-up — 2026-10-08
The earlier blank-screen blocker is resolved. V11 draft editing and updated test totals/native evidence are documented in [PHASE_4_NATIVE_READINESS.md](PHASE_4_NATIVE_READINESS.md). Earlier results above remain historical; native acceptance is not declared complete.
