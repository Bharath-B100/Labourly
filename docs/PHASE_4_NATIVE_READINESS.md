# Phase 4 native recovery and draft editing readiness

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Validation date: 2026-10-08. Phase 4 is not declared stable. No Phase 5, dependency upgrades, commits, tags or pushes were performed.

## 1. Metro root cause and fix — PASS

The first failure occurred before JavaScript startup in Android OkHttp Http1ExchangeCodec.ChunkedSource.readChunkSize, through MultipartStreamReader and BundleDownloader: ProtocolException, expected a hexadecimal chunk-size character but received 0x0d. Metro was reachable; changing the development host alone did not fix it. This identifies the multipart/chunked bundle transport path, not a demonstrated JavaScript exception or native-module mismatch. The underlying reason for the malformed/interpreted chunk boundary is not established.

mobile/metro.config.js now negotiates application/javascript for .bundle requests. The resulting response uses a regular JavaScript body and Content-Length. Other routes retain normal handling. Android subsequently logged Running main and rendered the current screens. No TLS weakening, package patch, application-data wipe or reinstall was used. Development host is localhost:8083 through adb reverse; Metro runs offline on port 8083. The existing development APK remains usable; a standalone APK containing the changed JavaScript would require a rebuild.

## 2. Native evidence

- PASS: emulator-5554 reports device; application renders with retained customer session.
- PASS: Find Workers and Create Requirement screens rendered; Create location controls visible (native-recovered.xml, native-create-location.xml).
- PASS: Edit Draft populated the protected draft, including its existing location warning (native-edit-draft.png/xml).
- PASS: Karnataka selection, city search for Bengaluru and selection of Bengaluru exercised without saving (native-city-search.png, native-city-selected.png). The approximate city-centre warning and explicit confirmation button rendered.
- PASS: Requirement Details rendered DRAFT, Edit Draft action and Suitable Workers (native-draft-details.png).
- PASS: current emulator request to 10.0.2.2:8080/actuator/health returned HTTP 200 and UP (native-readiness-emulator-health.txt). Native Details successfully fetched backend data.
- PASS for observed session: no immediate fatal/runtime error in the sampled recent AndroidRuntime/ReactNativeJS error log (native-readiness-recent-errors.txt); this is not long-duration crash certification.
- DEFERRED: worker-authenticated Service Areas native screen, native GPS permission/error cases, full Create submission, full Edit save/refresh, and native discard warning. Component/integration tests do not substitute for these interactions. The existing customer session was preserved.

## 3. Defect 09 implementation and tests — PASS automated; native save pending

RequirementController and RequirementService provide owned-customer GET/PUT /api/v1/requirements/{id}/draft. Edits require DRAFT status and expected edit_version, lock the row and preserve its ID/status. Validation covers trade/skills, dates, worker count, budget and canonical location. Skill replacement occurs in the same transaction. V11 adds budget and edit_version without changing historical migrations.

The existing mobile Post form serves Create and Edit. Edit loads the draft, exposes budget and local start time, requires explicit location confirmation, submits an update instead of creating another requirement, displays failures and refreshes Details after success. Details exposes Edit Draft only for DRAFT. beforeRemove prompts for changed form values; native back/tab navigation behavior still needs manual acceptance, especially picker changes before final confirmation.

DraftEditingIT covers ownership/roles/status, invalid inputs, version conflict, same ID/status, no duplicate, and pending quotations without bookings. draft-editor.test.tsx covers prepopulation, explicit confirmation, update payload/navigation, save conflict and discard callback.

## 4. Legacy location workflow

Draft TEST-RECORD-08 remains DRAFT with its original Bengaluru coordinates and NULL canonical IDs. No inferred backfill occurred. the project owner must open Edit Draft, select the correct canonical state/city, confirm the location, review all fields and explicitly save. City selection uses catalogue coordinates; it represents an approximate city centre, not the precise worksite.

## 5. GPS boundary safety

GPS preserves authorized coordinates but does not assign unverified canonical state/district identifiers. Such points cannot gain state/district eligibility from arbitrary labels; radius matching remains available. Manual canonical selection is distinct from GPS. Production limitation: no authoritative point-in-administrative-boundary dataset verifies GPS jurisdiction, and nationwide coverage is not bounded by a verified country polygon. Do not describe GPS as administratively verified.

## 6. Quotations and booking regression — PASS

Isolated backend tests verify pending quotations across jobs do not create reservations/bookings, geographic/availability/visibility enforcement, confirmed-booking conflict protection, atomic acceptance and losing-quotation behavior. Existing acceptance data was not used as test fixtures or mutated.

## 7. Actual automated gates

| Gate | Result | Evidence under docs/verification |
|---|---|---|
| Java 21 Maven verification | PASS: 4 unit + 65 integration = 69; zero failures/errors/skips | draft-backend-verify.log |
| Flyway/PostGIS | PASS: V1–V11 in isolated integration database; live V11 applied | draft-backend-verify.log; backend runtime logs |
| Backend formatting | PASS within Maven verification | draft-backend-verify.log |
| Mobile tests | PASS: 14 suites, 70 tests | native-readiness-mobile-tests.log |
| Mobile TypeScript | PASS | native-readiness-types.log |
| Mobile lint | PASS | native-readiness-lint.log |
| Mobile formatting | PASS | native-readiness-format.log |
| Admin tests | PASS: 1 suite, 2 tests | draft-admin-tests.log |
| Admin TypeScript/Vite build | PASS | draft-admin-build.log |
| Admin lint/formatting | PASS | draft-admin-lint.log; draft-admin-format.log |

A missing Trade.code in the new mobile test fixture initially failed TypeScript; it was corrected and all mobile gates rerun. No checks were suppressed. No fresh dependency audit was performed in this task; prior advisory totals are not presented as a new audit result.

## 8. Protected records — PASS

Read-only comparison against the earlier snapshot confirms all original fields unchanged for the protected draft, confirmed booking TEST-RECORD-02, accepted quotation TEST-RECORD-01 and Worker A/C/E profiles/service locations. Additive draft columns remain location IDs/source NULL, budget NULL and edit_version 0. Evidence: native-data-preservation.json. No draft was saved/published and no quotation submitted/accepted/cancelled by this validation.

## 9. Remaining acceptance work

No current blocker to starting the project owner's native testing. End-to-end native save, GPS and worker coverage acceptance remain DEFERRED, not PASS. GPS jurisdiction and catalogue unresolved/multiple-district places remain documented production limitations. Runtime is the existing development APK plus Metro, not a newly packaged standalone APK.

## 10. Exact next native steps for the project owner

1. On the displayed protected Requirement Details screen, tap Edit Draft. Review prepopulated title, trade, skills, date/time, duration, workers, description and budget.
2. Choose Karnataka and the intended Bengaluru catalogue entry; inspect its location description and tap Confirm this job location. Only save if this is the intended worksite representation. Do not publish yet.
3. Tap Save draft. Verify the same requirement ID remains DRAFT, saved fields persist on reopening, and Suitable Workers refreshes.
4. Change a field, navigate back and test Keep editing / Discard. Also test leaving through a tab; report any departure without the expected warning before relying on it.
5. On an unsaved Create form test manual state/city selection, then GPS grant/denial and fallback. Do not create acceptance data accidentally.
6. When ready to change sessions, log in as the intended worker and open Profile / Service Areas. Inspect radius, district, state and nationwide controls. Change protected A/C/E coverage only through your own explicit choice.
7. Continue quotation/acceptance testing only after reviewing geographic matching and schedules. Existing confirmed acceptance records remain protected.

PHASE 4 NATIVE READINESS — READY FOR PROJECT OWNER TESTING

## Defect 10 follow-up
Native acceptance identified missing tab/hardware Back protection in the original Edit Draft implementation. See [DEFECT_10_UNSAVED_CHANGES.md](DEFECT_10_UNSAVED_CHANGES.md) for the fix, persistence diagnosis, 76 mobile / 69 backend regression results and actual native discard verification. Earlier discard acceptance was pending, not passed.

## Defect 11 follow-up
Cancellation presentation is corrected and verified in Worker E's native session. See [DEFECT_11_CANCELLATION_CONSISTENCY.md](DEFECT_11_CANCELLATION_CONSISTENCY.md) for database findings, native evidence, preservation results and final 71 backend / 84 mobile / 2 admin test totals. Phase 4 acceptance remains ongoing.
