# Labourly reference screen implementation

Updated 17 October 2026. This is an implementation increment, not complete product or native acceptance sign-off. Labourly branding and the approved yellow, charcoal, white and grey palette are retained. Reference sample prices, ratings, identities and balances are not production data.

## Screens 5–16

| Screen | Implemented in this increment | Remaining work |
|---|---|---|
| 5 Home | Compact brand/notification header, discovery entry, real trade catalogue grid, yellow requirement banner and working job/booking destinations | Actual selected-location summary in the Home header; further native layout acceptance |
| 6 Labour listing | Compact portrait worker cards, actual experience and availability, functional All/Available server filters | Broader native list acceptance and reference refinements |
| 7 Smart filters | Collapsible trade/radius filter panel, reset, existing GPS/manual city selection; availability connected to the search API | Dedicated reference-style filter screen; genuine review/rate/identity contracts before those filters can be offered |
| 8 Worker profile | Large portrait, skills chips, quotation information card and existing save/requirement actions | Real reviews and identity verification; private calls require approved provider integration |
| 9 Post requirement | Existing draft, explicit save, publishing and location flows retained; calendar connected to the real start-date fields | Further form composition refinement; no publication performed during this visual check |
| 10 Schedule | Reusable month calendar, selected date, month navigation and past-date prevention; integrated with new and edited drafts | Dedicated calendar presentation and preferred-time contract; existing duration fields remain |
| 11 Chat/call | Existing truthful unavailable state retained | Spring Boot/WebSocket text messaging is not implemented. Agora private voice/video remains pending |
| 12 Projects | Active/Completed/Cancelled tabs filter real bookings | Reference progress/capacity displays require genuine project-progress data |
| 13 Wallet/payments | Profile destination and honest inactive wallet screen; links to real booking amounts, explicitly not receipts | Razorpay/RazorpayX accounts, eligibility, pricing, security and integration approval; no live transactions |
| 14 Notifications | Today/Earlier grouping, wrapping titles, unread visual distinction and usable action targets; existing authorized routing/read APIs retained | Full native walkthrough of this presentation; background push remains pending |
| 15 Saved workers | Uses refreshed worker cards and compact page composition; existing account-scoped persistence retained | Existing native stability/accessibility gate remains open |
| 16 Profile/settings | Compact page headings and role-aware menu retained; wallet destination added | Support, legal and language domains require actual content/contracts |

## Provider decisions

The user selected Razorpay plus RazorpayX for payments/payouts, Agora RTC for private voice/video, and Spring Boot plus WebSocket for text messaging. Provider accounts are unconfirmed. No credentials, paid services or live financial transactions have been configured. Provider selection does not constitute approval of pricing, eligibility or security requirements.

## Validation

- Full mobile regression: **135 tests passed, 21 suites passed**, zero failures. Private log: `.tools/crewza-reviewed-tests.log`.
- TypeScript: PASS (`.tools/crewza-reviewed-types.log`).
- Lint: PASS (`.tools/crewza-reviewed-lint.log`).
- Original formatting gate: PASS (`.tools/crewza-reviewed-format.log`).
- Added two calendar tests for date selection/month navigation and past-date rejection, plus availability-filter API coverage. Existing booking, draft, authentication and saved-worker component tests remain in the full suite.
- No backend code or schema was changed by this UI increment; backend tests were not rerun for it. Earlier backend changes in the working tree belong to prior work.
- Read-only protected-record comparison: bookings, quotations and reservations match saved evidence. Flyway V1–V13 are successful and match source checksums. Private evidence: `.tools/crewza-protected-verification.json`.
- Android rendering observed for the Home and Workers screens through the existing Metro development bundle. Private captures: `.tools/saved-native/crewza-home-settled.png`, `crewza-final-home-settled.png`, `crewza-final-workers.png` with companion XML. Workers showed the real empty result for the current GPS search; no worker result was fabricated.
- These captures are not complete native acceptance of calendar submission, publishing, payments, chat, profile, notifications or project filtering. No new APK build was required or claimed for these JavaScript-only changes.
- The prior reload/Activity recreation duplicate-root investigation remains unresolved. Two root tags alone do not establish a leak. No claim of native lifecycle closure is made here.
- TalkBack and physical-device acceptance remain pending.

## Changed UI files in this increment

`mobile/src/components/ui.tsx`, `theme.tsx`, `WorkerCard.tsx`, `ProfileSettings.tsx`, new `ScheduleCalendar.tsx`; customer `home.tsx`, `discover.tsx`, `worker/[id].tsx`, `post.tsx`, `bookings.tsx`, `saved-workers.tsx`, `_layout.tsx`, new `wallet.tsx`; `mobile/src/app/notifications.tsx`; `discovery.test.tsx` and new `schedule-calendar.test.tsx`.

Other existing uncommitted changes were preserved. No commit, push, tag, deployment, original database mutation or provider activation was performed. The full sixteen-screen feature set remains incomplete; this report must not be used as public-release sign-off.

