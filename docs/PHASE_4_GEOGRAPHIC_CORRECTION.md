# Phase 4 geographic matching correction

Date: 2026-10-08. Branch: phase-4-development. No Phase 5, push, stable tag, migration, dependency upgrade or live acceptance mutation.

## Contract and smallest supported correction

There is no trustworthy point-in-administrative-boundary dataset in this project. The city catalogue identifies city centres and their administrative relationships; it cannot establish the state, district or country containing an arbitrary GPS point. Nearest-city inference would invent that relationship and was not implemented.

The shared `ServiceCoverage.geographic` predicate now requires a non-null job/search point. Administrative coverage (nationwide, state, district) additionally requires a real catalogue city, its matching state and coordinates within one metre of that city's centre. This is a catalogue consistency tolerance, not a geographic boundary. Existing city creation/search validation uses a tighter coordinate tolerance. District matching still requires exactly one source-verified district. Multiple states remain an OR set, independent of the worker's home state.

GPS-only locations retain their actual point and NULL administrative IDs. They match explicit radius coverage or legacy radius coverage (only when no explicit coverage configuration exists). A nationwide-only worker no longer matches an arbitrary GPS point or a job missing coordinates. A worker with nationwide plus radius coverage can still match GPS through the radius. Radius is a distance test, not an India-boundary guarantee.

| Path                       | Geographic contract                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Find Workers with GPS      | Distance coverage only; visible fallback explains selecting a city for administrative coverage                                     |
| Find Workers with city     | Backend validates city/coordinates, derives state and invokes shared predicate                                                     |
| Suitable Workers           | Same geographic predicate; unavailable workers remain informational                                                                |
| Worker opportunities       | Same geography plus profile, availability, trade and schedule restrictions                                                         |
| Quote submission/update    | Same geography plus eligibility and proposed schedule validation                                                                   |
| First quotation acceptance | Existing eligibility check retained; worker identity/profile locked before recheck so service-area saves serialize with acceptance |
| Accepted-quote retry       | Returns existing booking without recreating/reopening it, even if coverage later changes                                           |

The location-free worker search API remains general browsing, not a claim of nearby/job eligibility. Native Find Workers waits for a location before searching. It has no job schedule, so a search result is not a reservation promise. Suggestions likewise retain generic availability; the audit's schedule-specific suitability wording finding is separate and remains unresolved.

## Manual fallback

Post/Edit and Find Workers now explicitly explain that GPS matches distance-based service areas only. State/district/nationwide workers require a catalogue city. Selecting and confirming a city replaces the GPS coordinate with its approximate city centre; it does not attach a manually chosen state to the unchanged GPS point. No previous requirement is backfilled or rewritten.

The user's native Save/Reopen checks and GPS confirmation are recorded as user-verified baseline evidence. This task did not submit the open native form, replace its location, reload it or perform a new native acceptance sequence.

## Files changed for this correction

- `backend/src/main/java/in/nammacrew/marketplace/ServiceCoverage.java`: common location guard, catalogue identity check, shared worker locking for coverage edits.
- `backend/src/main/java/in/nammacrew/marketplace/QuotationService.java`: lock before the current acceptance eligibility check. Existing post-audit eligibility changes were preserved.
- `backend/src/test/java/in/nammacrew/marketplace/ServiceCoverageIT.java`: GPS versus administrative modes, missing/foreign/mismatched points, multi-state acceptance, changed worker eligibility, changed location, retry idempotency and legacy radius cases. Existing matching calls updated to the current customer-authorized signature.
- `backend/src/test/java/in/nammacrew/marketplace/QuotationTestSupport.java`: isolated valid-job fixture now has canonical Bengaluru coordinates and IDs instead of relying on nationwide matching a missing location.
- `backend/src/test/java/in/nammacrew/marketplace/QuotationIT.java`: overlap rejection can occur at the eligibility check before the unchanged database exclusion backstop.
- `backend/src/test/java/in/nammacrew/marketplace/MarketplaceControllerIT.java`: corrected the existing direct-read test URL from `/api/v1/marketplace/requirements/{id}` to the actual `/api/v1/requirements/{id}` route; retained its authorization assertions.
- `mobile/src/location/JobLocationPicker.tsx`, `mobile/src/app/(customer)/discover.tsx`: accurate GPS restriction/fallback copy; existing initial saved-location support preserved.
- `mobile/src/__tests__/job-location.test.tsx`, `mobile/src/__tests__/discovery.test.tsx`: visible fallback and GPS-to-canonical replacement tests.
- Format-only cleanup from the installed formatters includes existing post-audit edits in customer Post, marketplace controllers/services and MarketplaceControllerIT. No authorization changes were reverted.

## Verification and preservation

Final results and preservation evidence are appended below. Tests use disposable PostgreSQL/PostGIS containers; all synthetic booking/cancellation tests are isolated from the development database.

Initial backend run found coverage tests using the old one-argument matching API; corrected to the current owner-scoped signature. Initial mobile run had 5 failures under heavy contention (including hook timeouts and asynchronous rendering assertions); the same two suites passed all 16 tests on rerun without weakening assertions or extending timeouts. Logs retain both initial failures and final results. A pre-existing Post formatting failure was corrected with the local formatter.

The first complete backend run also exposed an invalid missing-location test fixture (canonical IDs cannot accompany a NULL point), the wrong direct-read test endpoint and an existing past-start acceptance status mismatch. The legacy fixture now clears its canonical identity, the route is corrected and the existing 403 past-start check runs before the shared validation. None of the database constraints was relaxed.

Read-only preservation comparison passed for all 8 requirements, 3 bookings, 4 quotations, 3 reservations, 5 worker profiles and the existing coverage parent row. Evidence: `verification/geographic-preservation.json`. No write query was issued against these live tables by this task; test writes occurred only in disposable containers.

No automatic administrative resolution was added. District coverage remains unavailable for unresolved/multiple-district catalogue entries. Exact GPS worksite plus verified state/district, and guaranteed in-country radius containment, require trustworthy boundary data in future work. These limitations must not be described as verified GPS jurisdiction.

The running backend is not automatically replaced by Maven verification. No service restart or APK installation was performed, preserving the open native test form. The built backend must be activated and the native flows rechecked before claiming the installed application has passed this correction. Metro can deliver the JavaScript copy changes, but a Metro reload cannot update Java services.

## Final results and decision

| Gate                                                                 | Final result                                                                    | Evidence in docs/verification                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Java 21 offline Maven verify, package and Spotless                   | PASS: **85 tests** (4 unit + 81 integration), zero failures/errors/skips; 1m16s | `geographic-backend-verified.txt`, `geographic-backend-counts.json`                      |
| Geographic integration suite                                         | PASS: **24 cases**, including twelve added cases                                | same backend log, ServiceCoverageIT                                                      |
| Flyway V1–V11 / PostGIS / concurrency / cancellation / authorization | PASS in disposable databases                                                    | same backend log                                                                         |
| Mobile full Jest suite                                               | PASS: **87 tests / 15 suites**                                                  | `geographic-mobile-final.txt`                                                            |
| Mobile TypeScript and lint                                           | PASS                                                                            | `geographic-mobile-types.txt`, `geographic-mobile-lint.txt`                              |
| Mobile formatting                                                    | PASS final rerun                                                                | `geographic-mobile-format-final.txt`                                                     |
| Admin tests                                                          | PASS: **2 tests**                                                               | `geographic-admin-tests.txt`                                                             |
| Admin TypeScript/build, lint and formatting                          | PASS                                                                            | `geographic-admin-build.txt`, `geographic-admin-lint.txt`, `geographic-admin-format.txt` |
| Live record preservation                                             | PASS                                                                            | `geographic-preservation.json`                                                           |
| Fresh native/backend activation                                      | NOT PERFORMED                                                                   | Existing native form/session preserved; no new native PASS claimed                       |

**Geographic implementation blocker: cleared for the explicit radius-only GPS / canonical-city administrative contract, verified by automated tests. Native sign-off remains pending activation and verification of this backend build.** Automatic administrative GPS resolution remains unavailable and is not claimed. Multi-state workers are not limited to their home state. Existing correctly identified city jobs continue to support radius, district, state and nationwide coverage.

The separate schedule-specific suggestion wording issue and other non-geographic final-audit blockers are not declared resolved. Phase 4 is not declared stable or complete. Stop here; no form publication, push, tag or Phase 5.

## Subsequent backend activation

The corrected build was activated on 2026-10-08 following explicit authorization. PID 8448, Java 21, port 8080; migrations V1–V11 validated with no migration necessary; host and emulator health UP. Records preserved. See [PHASE_4_BACKEND_ACTIVATION.md](PHASE_4_BACKEND_ACTIVATION.md). This supersedes the pending activation statement above; native acceptance remains pending separately.
