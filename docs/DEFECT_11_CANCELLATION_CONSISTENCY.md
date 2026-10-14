# Phase 4 Defect 11 — cancellation status and reason consistency

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Date: 2026-10-08. Branch: phase-4-development. Status: FIXED; native Worker E verification passed. This is not Phase 4 completion.

## Root cause and end-to-end trace

The cancellation form already posts the entered reason to POST /api/v1/bookings/{id}/cancel. BookingController obtains the actor from authenticated identity, and BookingService checks participation, a nonblank 1–2000-character reason and CONFIRMED status under a row lock. Within one transaction it transitions to CANCELLED, flushes the reservation-release trigger and stores cancel_reason, cancelled_by and cancelled_at. V8 already added these fields; V9 enforces complete and immutable cancellation audit metadata.

The read path lost information: BookingView and BookingQueryService did not select/return cancellation metadata, and the shared customer/worker Booking Details screen did not render it. Separately, QuoteView omitted associated booking status and My Quotes unconditionally displayed “Hired” for historical ACCEPTED quotes. This was a response/display defect, not missing persistence. No migration or cancellation mutation change was necessary.

## Actual database findings (read-only)

- Requirement: TEST-RECORD-11, Phase 4 cancellation Test.
- Booking: TEST-RECORD-07, CANCELLED, INR 1000 FIXED_TOTAL, 22–23 October 2026.
- Quotation: TEST-RECORD-10, ACCEPTED (retained historical fact).
- Reason: “[private cancellation text withheld; nonblank reason verified]”.
- Actor: Test Customer, customer of the requirement.
- Timestamp: [event timestamp retained in encrypted evidence] / [local event timestamp withheld].
- Worker assignment reserved=false.

Both protected Worker A bookings remain CONFIRMED/reserved: TEST-RECORD-02 (8–10 October) and TEST-RECORD-04 (15–17 October, INR 4500 FIXED_TOTAL). Full before/after JSON comparisons of every live booking, quotation and booking-worker reservation passed. No historical records were edited, recreated, reopened or deleted. Evidence: verification/defect11-preservation.json.

## Changes

- backend/src/main/java/in/nammacrew/booking/BookingDTOs.java: additive nullable cancellation reason, actor name/participant role and timestamp fields.
- backend/src/main/java/in/nammacrew/booking/BookingQueryService.java: select stored cancellation metadata for participant-scoped lists/details. Unrelated callers receive 404 instead of a generic exception. Actor name is display name only; no phone/token or other private profile fields are exposed.
- backend/src/main/java/in/nammacrew/marketplace/QuotationDTOs.java and QuotationService.java: LEFT JOIN the uniquely associated booking, expose bookingId/bookingStatus, retain quotation status. Existing customer-ownership and worker-self scopes remain enforced.
- mobile/src/api/quotations.ts: additive optional/null response fields, compatible with older responses.
- mobile/src/app/(worker)/schedule.tsx: separate Quote status from Booking status; cancelled bookings say Booking cancelled and explain retained accepted history. Missing booking information is unavailable, never assumed confirmed. Completed/in-progress bookings have their own wording. Existing focus fetch refreshes the view after navigation.
- mobile/src/app/(customer)/booking/[id].tsx: show cancellation reason, actor role/name and device-local timestamp. Worker booking route already reuses this screen. Legacy NULL metadata renders explicit unavailable messages, with no invented reason or backfill.
- backend/src/test/java/in/nammacrew/marketplace/CancellationPresentationIT.java: two new isolated integration tests for metadata/status, participant authorization, unaffected bookings, no duplicate/reactivation on repeated accept, worker actor and old NULL metadata.
- backend/src/test/java/in/nammacrew/marketplace/QuotationIT.java: expect the corrected 404 AuthFailure for unauthorized detail reads; existing conflict/release checks retained.
- mobile/src/__tests__/cancellation-consistency.test.tsx: eight cases for status distinctions, both detail routes, old metadata and unaffected confirmed bookings.
- mobile/src/app/(customer)/post.tsx and mobile/src/navigation/DraftNavigationGuard.tsx: the full lint gate exposed existing Defect 10 ref-during-render/immutability errors. Baseline now uses state initialized from the loaded form, latest callbacks update in an effect, and the context ref is explicitly named guardRef. No lint rule was disabled; draft regression tests were rerun.

## Verification

| Gate | Result | Evidence under docs/verification |
|---|---|---|
| Java 21 offline Maven verify, including Spotless | PASS: 4 unit + 67 integration = 71 tests, zero failures/errors/skips | defect11-backend.log |
| Flyway/PostGIS | PASS in disposable integration database; no new migration | defect11-backend.log |
| Booking reservation/conflict/concurrent acceptance | PASS existing regression plus new cancellation consistency tests | defect11-backend.log |
| Mobile | PASS: 15 suites, 84 tests | defect11-mobile-tests.log |
| Mobile TypeScript/lint/formatting | PASS final rerun | defect11-mobile-types.log, defect11-mobile-lint.log, defect11-mobile-format.log |
| Admin tests | PASS: 1 suite, 2 tests | defect11-admin-tests.log |
| Admin TypeScript/Vite build, lint, formatting | PASS | defect11-admin-build.log, defect11-admin-lint.log, defect11-admin-format.log |
| Historical preservation | PASS: every booking, quote and reservation unchanged | defect11-preservation.json |

Initial lint/format failures were corrected and rerun, not suppressed. Tests use disposable Testcontainers databases; no new live cancellation was performed. Existing exclusion constraints and transaction/locking logic were not weakened. Previously conflicting bookings can be accepted only after reservation release; retries of an already accepted/cancelled quote return the existing booking and do not create or reconfirm it.

## Native evidence

The existing emulator-5554 was online in Worker E's existing session. Backend was restarted once with the verified packaged JAR at .tools/backend-defect11-runtime/backend.jar, Java 21, seed=false, same approved database and port 8080. Health returned UP. Metro and the existing development APK delivered the JavaScript changes; no APK rebuild or app-data reset occurred.

Actually exercised read-only on the existing cancellation:

1. Opened My Quotes: Phase 4 cancellation Test shows Quote: ACCEPTED, Booking cancelled and Booking status: CANCELLED, with historical explanation. Its unrelated rejected quote remains REJECTED. Screenshot: verification/defect11-native-quotes.png.
2. Opened My Bookings and the cancelled booking: reason, “Customer (Test Customer)” and “[local cancellation timestamp verified]” are visible. Screenshot/XML: verification/defect11-native-worker-details.png and .xml.
3. Compared live historical data before/after: unchanged.

## Remaining limits

No blocker remains for the observed Worker E defect. Customer-role metadata visibility passed backend HTTP authorization tests and mobile tests of the shared screen; a separate customer-session native walkthrough was not performed, preserving the existing worker session. Legacy missing metadata cannot be reconstructed and is explicitly labeled unavailable. Display name is resolved from the current actor profile; immutable actor ID/time/reason remain the stored historical record. No fresh dependency audit was required/performed; no dependencies were upgraded. No Phase 5, push, tag or phase-4-stable declaration.
