# Bug fixes — 18 October 2026

## Fixed and regression tested

1. **Admin OTP request incorrectly failed after successful delivery.** Backend `AuthController.request` returns HTTP 204; admin POST helper always called `json()`. Empty successful responses now return normally. Tests cover 204 without JSON parsing, token-bearing verification responses and rejected requests.
2. **Discovery could trap users on a failed or empty later page.** Previous navigation was nested inside the nonempty-results branch. It is now available after an empty/error response on any later page, with tests proving return to page zero in both cases.
3. **Malformed result-counter separator.** Replaced the Unicode replacement character with a plain separator.

Changed files: `admin/src/api.ts`, new `admin/src/api.test.ts`, `mobile/src/app/(customer)/discover.tsx`, `mobile/src/__tests__/discovery.test.tsx`.

## Verification

- Full mobile: 148 tests passed across 30 suites.
- Admin: 5 tests passed across 2 files; build/typecheck and lint passed.
- Mobile typecheck and lint passed.
- Admin formatting initially flagged the new test; formatted using the admin tool/configuration and reran successfully.
- Read-only protected-record comparison: bookings, quotations and reservations unchanged; V1–V13 successful and source checksums match.
- Backend code and dependencies unchanged; no new backend test result claimed.
- Private logs: `.tools/bugs-mobile-*`, `.tools/bugs-admin-*`, `.tools/bugs-protected.json`.
- No new native interaction evidence for these fixes. Component/API tests are not native acceptance.

## Still open

The existing Android reload/Activity-recreation navigation investigation remains unresolved. Production OTP provider configuration, real WebSocket messaging, operations authorization, background push, reliable backend vulnerability assessment, TalkBack/physical-device acceptance and approved payment/call integrations remain open as described in `LABOURLY_PRODUCT_READINESS_20261018.md`. These are not waived by passing this regression suite.

No original database mutations, commits, pushes, tags, deployments or provider activations were performed. This report does not assert that all defects are fixed or that Labourly is production-ready.
