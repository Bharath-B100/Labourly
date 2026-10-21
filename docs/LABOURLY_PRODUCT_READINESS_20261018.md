# Labourly product readiness — 18 October 2026

This review combines current source inspection, prior acceptance reports and fresh local quality gates. It is not a comprehensive penetration test or public-release certification. The existing Labourly branch and uncommitted work are preserved.

## Changes delivered

- Discovery city selection is usable while a GPS request is pending. Switching to manual selection invalidates the pending result so a late GPS response cannot replace the chosen city.
- Changing state clears the old city identifier as well as coordinates.
- Discovery now offers next/previous server result pages and total-result/page information. Applying filters or changing availability restarts from page zero.
- Added regression tests for the GPS/manual race and server pagination/filter reset.
- Admin tests referred to the replaced seven-placeholder interface. They now verify the actual signed-out boundary (no worker/opportunity requests), current navigation and logout token clearing. This does not establish administrative authorization on the server.
- Removed an unused admin import and formatted the affected source. No dependencies or database records changed.

## Product assessment and remaining work

| Priority | Area | Evidence / next acceptance gate |
|---|---|---|
| P0 public launch | Production sign-in | `ProductionOtpProvider.sendOtp` throws 503. Select and approve an SMS provider, configure credentials outside source, and verify real OTP delivery, abuse limits and production/dev isolation. |
| P0 public launch | Security assurance | Backend vulnerability status remains UNASSESSED. Reliable dependency assessment and runtime exposure review are required; historical unit-test success is not security clearance. |
| P1 | Android navigation lifecycle | Prior reload/recreation root-navigation issue remains open. Reproduce on a bundled build and complete authenticated customer/worker acceptance. |
| P1 | Customer discovery | This increment closes blocked manual fallback and inaccessible subsequent pages. Native race/pagination acceptance remains pending; no isolated dataset with more than 20 workers was created. |
| P1 | Messaging | Chat route explicitly passes `isUnavailable`; the visual component includes sample-message defaults. Keep it unavailable until authenticated Spring Boot/WebSocket persistence, participant authorization, delivery/retry, retention and abuse controls work. Do not mistake local message rendering for delivery. |
| P1 | Operations | Current admin uses token presence and marketplace APIs, not a proven privileged operations contract. Validate server roles/permissions, scope, pagination and audit trails before use by real operators. Current dashboard hardcodes a Bengaluru search and must not be presented as global marketplace totals. |
| P1 | Customer trust | Real reviews, identity verification, support escalation and policy content are incomplete. Do not substitute reference ratings or claim KYC from synthetic data. |
| P1 | Notification delivery | In-app notifications exist; background/terminated-app delivery needs the separately documented push/outbox work and physical-device tests. |
| P1 | Booking lifecycle | Preserve quotation acceptance/conflict/cancellation contracts. Agree completion, disputes/no-shows, reposting and team-capacity semantics before introducing new status-changing actions. |
| Pending provider approval | Payments and payouts | Razorpay/RazorpayX selected, accounts/pricing/eligibility/security unapproved. No live transactions, balances or fake receipts. |
| Pending provider approval | Voice/video | Agora selected; private-call authorization, credentials, pricing and privacy review precede activation. |
| P1 | Accessibility | Complete 320dp/200% font, spoken TalkBack and physical-device acceptance. Existing screenshots do not close these gates. |
| P2 | Reference fidelity | Complete dedicated filters/calendar presentation and location summary; refine remaining screens against the actual reference while retaining genuine data and working paths. |

## Evidence and limits

- Mobile: **146/146 tests, 30 suites**. Typecheck and lint passed. Formatting initially flagged the changed test; it was formatted and the rerun passed.
- Discovery focused tests: **11/11**, including two new regression scenarios. Logs retain React test act warnings; no assertions were skipped to obtain success.
- Admin initial run: **2 failed**, stale placeholder expectations; lint also found one unused import. Updated tests: **2/2 passed**. Final admin build/typecheck, lint and formatting all passed.
- Backend unchanged in this increment; no new backend regression result is claimed.
- Read-only comparison confirms protected bookings, quotations and reservations unchanged. Flyway V1–V13 successful with matching source checksums.
- Emulator is online (`device`). A current Workers-screen capture exists; this is rendering evidence only, not complete native validation of the new race/pagination flows.
- Private evidence: `.tools/product-mobile-*`, `.tools/product-discovery-tests.log`, `.tools/product-admin-*-final.log`, `.tools/product-protected.json`, `.tools/saved-native/product-current.png` and XML. No private records are reproduced here.

## Next delivery order

1. Close native discovery and navigation acceptance, and provide a reliable location/search journey.
2. Implement authorized, persisted text conversations with retry/error/account-isolation tests; keep calls inactive.
3. Complete customer/worker booking lifecycle and operational support contracts with isolated data.
4. Complete provider/security/privacy approval gates, real OTP and notifications, then physical-device release acceptance.

**Public launch: NOT READY.** Improvements are implemented and tested, but the remaining provider, security, native and operational requirements cannot be represented as complete.

