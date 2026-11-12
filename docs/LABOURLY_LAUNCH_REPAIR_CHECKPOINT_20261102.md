# Labourly launch-readiness repair checkpoint — 2 November 2026

**Decision: NOT READY for public launch.** This checkpoint fixes demonstrated mobile defects and reruns mobile/admin gates. It is not a complete security audit, production deployment, or native acceptance certificate.

Branch: `main`. HEAD: `781f44de6d9dce02a51d3e1979f512a5b1837cac`. Extensive pre-existing staged, unstaged and untracked work was preserved. The changed-file list below describes this checkpoint, not the entire working tree.

## Fixes completed

1. Customer chat now always renders the real API-connected screen. Removed a hook-error fallback that let tests exercise a different unavailable screen from production.
2. Failed message sends retain the draft and show an explicit uncertain-delivery warning. No automatic retry is introduced: a network error does not prove that the server rejected the message.
3. A synchronous pending guard prevents repeated Send taps; a successful response does not erase subsequently edited text. Invalidations target the originally sent thread and account. Message ownership uses the authenticated user ID rather than display-name/read-state heuristics.
4. Conversation-load failure has a retry state and no false successful connection message.
5. Missing team size is no longer fabricated as four workers. The scripted help guide explicitly describes its limited preset answers and does not promise account access, support actions or a full team roster.
6. Onboarding GPS no longer infers a user's administrative district/state from the nearest city. The location catalogue contains points, not verified boundary polygons. Valid GPS coordinates retain an explicit manual-entry fallback; invalid coordinates fail safely. Removed automatic onboarding GPS requests so location collection is initiated by the user and cannot overwrite manual entry through the removed background effect.
7. Corrected formatting in the two affected location/onboarding sources and added focused regression coverage. Test-only query cache lifetime avoids the new chat test's delayed process exit.

The unused nearest-city helper remains a catalogue proximity utility; `detectDeviceLocation` does not use it or return its administrative labels. Automatic verified district resolution remains unavailable. Manual onboarding location fields still require user input; this change is not a claim of geocoding completion.

## Verification actually executed

| Gate | Final result |
|---|---|
| Mobile full Jest | **198 passed, 35 suites; 0 failed**, exit 0; 53.994 seconds |
| Mobile TypeScript | PASS, exit 0 |
| Mobile lint | PASS, exit 0; no reported warnings |
| Mobile formatting | PASS, exit 0 |
| Admin tests | **5 passed, 2 files**, exit 0 |
| Admin TypeScript/lint/formatting | All PASS, exit 0 |
| Admin production build | PASS, exit 0 |
| Backend tests | NOT RERUN in this checkpoint; no backend source changes made here |
| Native/two-device/release-build tests | NOT RUN |
| Protected database equality / live migration validation | NOT RUN; no database connections, writes or migrations performed here |

Earlier intermediate runs are not the final results: 192 and 193 mobile tests passed before the GPS tests; an added test initially failed TypeScript due to an indexed fixture possibly being undefined; formatting and an onboarding effect-dependency warning were also detected and corrected. Final gates above passed. Existing React test act warnings in the suite must not be confused with native evidence.

Local evidence (outside staged source): `.tools/launch-mobile-verified.log`, `launch-type-verified.log`, `launch-lint-verified.log`, `launch-format-verified.log`, and `launch-admin-{test,typecheck,lint,format,build}.log`.

Previous backend evidence is retained in `LABOURLY_EXPIRED_QUOTATION_FIX_20261101.md` (32 selected tests) and `LABOURLY_MODULE_REVIEW_20261029.md` (93 selected tests). Those counts are historical selections, not a new full-backend run. Backend dependency vulnerability status remains **UNASSESSED**.

## Exact files edited in this checkpoint

- `mobile/src/app/(customer)/chat.tsx`
- `mobile/src/components/LabourlyLiveChat.tsx`
- `mobile/src/__tests__/labourly-foundation.test.tsx`
- `mobile/src/__tests__/worker-chat-route.test.tsx`
- `mobile/src/__tests__/labourly-in-app-call-and-chat.test.tsx`
- `mobile/src/location/deviceLocation.ts`
- `mobile/src/onboarding/ProfileEditor.tsx`
- `mobile/src/__tests__/device-location.test.ts`
- This report.

Several listed files already contained uncommitted work before this checkpoint. No migrations, native configuration, dependencies or environment files were edited.

## Module status and remaining work

“Implemented” means code/API paths and regression coverage exist; it does not mean real-device production acceptance is complete.

| Module | Current capability | Outstanding launch work |
|---|---|---|
| Login/session | OTP/JWT/refresh/logout and role routing | ProductionOtpProvider still fails closed with 503; provider/DLT, abuse-control integration and delivery testing required |
| Onboarding/profile | Customer categories, individual/team profiles, role-specific editing | Native role/session/accessibility acceptance; trustworthy administrative resolution or explicit manual selection |
| Home/discovery | Trade navigation, location selection, server-backed worker lists and coverage | Requested district-first/state-wide fallback, truthful availability, filter/reference parity validation; no invented ratings/KYC |
| Worker Find Jobs | Visible search area and manual/GPS radius narrowing | Native boundary/location-change checks; GPS is not district proof |
| Requirements/scheduling | Draft editing, publishing, date validation | Full native calendar/form/error-state acceptance; scheduling UI parity is not automatically complete |
| Quotations | Submit/edit/withdraw/accept/reject, expired-job protection | Two-account native acceptance and concurrency regression across current working tree |
| Bookings/cancellations | Reservations/conflict checks, cancellation metadata and release | Two-device visibility, complete start/completion/dispute/reposting product rules and operations |
| Saved Workers | API persistence and customer isolation | Current-build native persistence, hidden-worker, network and accessibility acceptance |
| Text chat | Booking-authorized REST chat; mobile failure/retry fixes above | Concurrent first-thread creation, bounded history loading, uncertain-send idempotency, rate limits and actual two-device delivery proof |
| Calls | Honest unavailable notice | Agora provider/account/security approval and real integration; not implemented |
| Notifications | In-app list/read/unread/routing | Reliable background push, token lifecycle, permission and physical-device delivery testing |
| Wallet/payments | Honest unavailable screen | Intentionally deferred; no real balance or financial transactions. Provider approval required if later enabled |
| Reviews/KYC | Truthful unavailable states | Real eligibility, moderation and verification implementation before advertising these capabilities |
| Support/privacy/deletion | Notices only for missing services | Real support contact, privacy/terms publication, in-app and web deletion requests with retention policy |
| Administration | Existing dashboard/API foundation | Operational moderation/support/audit procedures and authorization acceptance |

## Release blockers and order of closure

### Blocks safe public release

1. Owner confirmed no production HTTPS host/domain, approved SMS/DLT account, or public privacy/deletion website exists. These cannot be replaced by local development services or test OTP. Accounts, business details, provider approval and secret custody are needed.
2. Android release currently references debug signing. Establish approved release signing and test an actual standalone release artifact before store upload. No signing changes were made here.
3. Publish accurate privacy/terms and implement deletion requests with approved historical-record retention. Do not erase protected booking/quotation evidence to simulate compliance.
4. Complete reliable vulnerability assessment, production configuration, access control, monitoring, backup restoration and incident/support processes. Existing backend dependency status is not “secure”; it is UNASSESSED.
5. Complete authenticated real-device and two-account testing for booking, cancellation, chat, saved workers and session restoration. Prior root-race/ANR history is neither proven fixed nor proven a production-build defect by this checkpoint.

### Required for the full requested product scope

- Reliable background notifications; full worker-profile/review/verification capability; requested geographic discovery behavior; completed job lifecycle and support/disputes.
- Private voice/video needs approved Agora setup. Payments remain intentionally unavailable and can remain outside the initial product scope.
- Chat needs concurrency, pagination/operational-limit and ambiguous-delivery work. The current check-then-insert `ChatService.getOrCreateThread` path and unique booking constraint need a real concurrent integration test and compatible correction; no speculative unverified backend change was made here.

Next engineering gate: isolated backend chat/concurrency and full current backend regression, followed by controlled two-account native acceptance. In parallel the owner must establish production infrastructure/SMS and legal/support details. These prerequisites have not been re-requested or silently activated.

No commit, push, tag, deployment, paid-service activation, emulator launch, Android build, backend restart or protected-record operation was performed in this checkpoint.

Expo SDK 57 location API reference consulted before edits: https://docs.expo.dev/versions/v57.0.0/sdk/location/ . Framework location APIs do not replace the application's verified geographic data requirements.
