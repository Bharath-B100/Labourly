# Labourly module review — 29 October 2026

## Outcome

Core regression checks pass. This is not public-release approval or proof that every native interaction works. Existing uncommitted work was preserved on `main`; no commit, push, deployment or normal backend restart was performed.

## Changes and verified behavior

- Home uses larger responsive trade tiles, real trade data and canonical location selection. Saved profile location now requires an unambiguous state/city catalogue match; manual selection is not overwritten by profile defaults.
- Discovery carries validated selected-location identifiers and does not silently substitute Bengaluru for an unsupported GPS location.
- Booking lists/details refresh on focus and foreground, with polling, retry and guards against stale account responses. Component coverage verifies isolation and refresh behavior; actual two-device synchronization is still pending.
- Profile and wallet presentation avoids invented verification, balances and transactions.
- Customer booking details now call the router hook unconditionally; its cancellation test uses the actual hook contract.
- Migration tests now expect the current V15 tip rather than stale V13 expectations. Historical migration contents were not changed.
- Targeted source formatting was applied to touched mobile files, new chat Java sources, BookingQueryService and BookingDTOs. No broad repository reformat was performed.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Full mobile Jest | 171 passed, 31 suites | `module-review-mobile-final.log` |
| Mobile TypeScript | PASS | `module-review-typecheck-final.log` |
| Mobile lint | PASS | `module-review-lint-complete.log` |
| Mobile formatting | PASS | `module-review-format-final.log` |
| Selected backend authentication, migration and marketplace integration regression | 93 passed; 0 failures, errors or skips; Maven exit 0; 56.683 seconds | `module-review-backend-recheck.log` |
| Backend Spotless | PASS, exit 0 | `module-review-backend-format-final.log` |
| Admin retained 28 October evidence | 5 tests passed; typecheck, lint, formatting and build passed | `module-admin-tests.log` and preceding verification logs |
| Native/two-device acceptance | NOT RUN; no adb devices attached | No native pass claimed |

Mobile async act warnings remain in existing discovery/notification tests. The backend selection is not the complete OTP/Redis test collection. Initial backend errors were Docker-unavailable startup errors; after the user started Docker, the isolated rerun passed. Existing development databases were not queried or migrated. Testcontainers applied V1–V15 to disposable databases only. Protected-record equality was not independently rechecked in this pass; no application operations against those records were performed.

## Next work, in priority order

1. **Chat routing and privacy:** newly present live chat needs dedicated tests. Shared worker booking details currently route to the customer chat destination. Correct participant labels and authorized role-specific routing, expose failed thread-opening errors, and test account-switch cache isolation. Remove test-environment-dependent unavailable fallbacks so tests exercise the real screen. Review phone-number fallback disclosure, concurrent thread creation and bounded message loading. Current green tests do not certify live chat.
2. **Native end-to-end acceptance:** use isolated customer and worker accounts to verify booking acceptance/cancellation appears on both devices, Saved Workers persistence/isolation, profile editing and each Home action. Test 320dp, 200% fonts, keyboard, scrolling and spoken accessibility. Capture actual outcomes rather than inferring them from component tests.
3. **Production readiness:** SMS remains unconfigured, background push remains outstanding, and dependency-security uncertainties remain. Payment/payout and private voice/video provider integrations require the previously requested approvals; unavailable UI must stay truthful. REST chat polling is not proof of WebSocket or private calling support.

## Changed-file groups

Home/discovery and profile/wallet presentation; customer and worker booking lists and shared booking details; `useFocusedResource` and its tests; affected mobile regression tests; FoundationIT and MigrationIT expectations; targeted formatting of chat API/component, profile component, chat Java files and booking query/DTO files. The working tree also contains earlier authentication/OTP/Redis and chat implementation changes; these were preserved and must not be attributed wholesale to this review.

## Recommendation

Continue with chat correctness and authorization coverage, then controlled native two-account acceptance. **Not ready to claim every feature works or approve public launch.** No live SMS, payment, calling or new external services were activated.
