# LABOURLY — sixteen-screen gap analysis

14 October 2026. Source audit and supplied-reference review, not implementation or visual sign-off. The actual 16-screen image is now saved at `docs/reference/crewza/crewza-16-screens.png`. Paths below are relative to the repository. API paths under `/api/v1` are existing when marked **existing**, otherwise **proposed** contracts pending design. New table names are proposals, not applied migrations. S=1–3, M=4–8, L=9–15, XL=16–30+ engineering person-days including focused tests; shared dependencies overlap.

## Actual reference reconciliation — all sixteen screens

The user supplied this collage on 14 October 2026. File size: 1,796,992 bytes; SHA-256: `8f97dbb38d1051ba66576a7538e0f2a5be05d6e6e015ffde7e40998e31d061e9`. The saved copy matches the attachment byte-for-byte. These are observations of static screens, not evidence of animation, working APIs or additional unseen states. Reference names, portraits, prices and reviews are illustrative content, never Labourly customer data or production defaults. Labourly retains #FFCC25, #202326, #FFFFFF and #E5E7EB; Crewza branding/colors are not adopted.

| Screen | Visible reference | Correction or decision for Labourly |
| --- | --- | --- |
| 01 Splash | Logo, construction-site illustration, tagline and short progress indicator | Plan an original Labourly illustration/launch composition; a static image does not specify progress timing or animation. Preserve session bootstrap behavior. |
| 02 Onboarding | Marketing headline, worker illustration, three carousel dots and circular Next action | Separate this introductory tour from the existing persisted profile onboarding. Add IntroCarousel/PageIndicator to the plan; step completion must not imply profile completion. |
| 03 Role selection | Contractor, Engineer and Architect single-choice cards and Continue | These are customer categories, not CUSTOMER/WORKER/ADMIN authorization roles. Retain a worker entry path; resolve Engineer versus SITE_ENGINEER under D03. |
| 04 Sign in/up | Tabs, mobile number, password/visibility, forgot password, Google and Apple actions | Existing app is OTP-based. Password/social/recovery/account-linking scope needs D12 approval; do not replace secure OTP or show nonfunctional provider buttons merely to match the image. |
| 05 Home | Location/bell header, search/filter, seven trade tiles, promotional card; Home/Workers/Jobs/Chat/Profile tabs | Add real search/trade navigation and consent-aware promotional content. This differs from the proposed dedicated Post tab; D01 must settle navigation, with Post reachable from Home/Jobs. |
| 06 Labour listing | Trade/city heading; All/Nearby/Verified/Top Rated chips; photos, save hearts, reviews, daily rates and availability | Each chip needs real backend semantics. Schedule-specific availability and verified ratings cannot be inferred from decorative labels or global availability. |
| 07 Filters | Location/skill, daily-rate slider, Any/Today/This Week, Hourly/Daily/Weekly/Monthly, minimum rating, Verified Only, Reset/Apply | Add explicit rate-unit, availability-window and rating controls to planned filter contract. Weekly/monthly pricing and verified-only semantics need policy/data support, not client-only chips. |
| 08 Worker profile | Hero photo, save/more, verified badge, rating, experience, daily/hourly rate, skill tiles, availability, languages, reviews; Call/Hire Now | Add languages and rate-unit display to the plan; source trust/reviews/rates from real data. Hire Now remains D04 and calling D07, not an automatic confirmed booking. |
| 09 Post requirement | Title, skill, location, start date, duration-unit choices, worker-count stepper, optional details, Post Requirement | No attachment control is visible here; attachments are not established by this screen. Preserve explicit draft/edit/publish contract; define date range and quantity/unit before mapping reference controls. |
| 10 Schedule | Duration units, month/date grid, preferred time (Full Day / 8 hours), duration stepper, Confirm Schedule | Add customer SchedulePicker with preferred-time/duration summary, distinct from a worker availability calendar. D05 defines hours, weekly/monthly duration and time zone before backend changes. |
| 11 Chat/call | Participant/online header, phone and video controls, messages/read indicators, job/location card, quick replies, attachment/composer | Plan job-context card and quick replies; video is visibly present but provider, consent and scope remain D07 decisions. Do not promise voice/video from an icon. |
| 12 Projects | Active/Completed/Cancelled tabs, ongoing/upcoming labels, dates, worker avatars and filled-capacity progress | Add lifecycle tabs and distinguish filled worker slots from work-completion progress. Neither can be a fabricated percentage; existing booking enums alone do not supply project workflow. |
| 13 Wallet | Available balance/Add Money; Send/Request/Transactions/Invoice; payment/top-up/refund rows | All visible financial actions must be reconciled under D08. Decide stored value versus payment history and invoicing/transfer scope; no fictional wallet balance or automatic financial authorization. |
| 14 Notifications | Today/Earlier groups, event icons, timestamps and unread dots for booking/payment/work/message/reminder events | Add date grouping and accessible unread indicators. Existing in-app support does not implement payment/chat/reminder events or background push. |
| 15 Saved workers | Photo/name, rating/trade/rate/location rows and filled save hearts | Dedicated persisted owner-scoped list is required; no static favourites or duplicated worker data. |
| 16 Profile/settings | Edit profile/category/verification, KYC, language, country, notifications, help, privacy, terms and logout | Add these explicit settings entries only with meaningful destinations. Country setting does not expand the India marketplace; D12 settles languages and launch coverage. |

The sections below retain the source/API/security gaps. Added visual controls are planning requirements pending the named decisions, not approval to install providers, change authentication, introduce money handling or start L1. Exact responsive layout and motion still require implementation-stage review; the collage alone cannot establish them.

## 01 — Splash Screen · S · L1

- **Source/current:** `mobile/app.json`, `mobile/assets/{icon,splash-icon}.png`, `mobile/src/components/LoginTransition.tsx`, `mobile/src/app/{index,_layout}.tsx`; NammaCrew assets/welcome and login transition exist. Login animation is not proof of a complete cold-start splash contract.
- **Missing/components:** LABOURLY native launch assets, accessible SplashBrand/StartupBoundary, consistent cold/warm/resume behavior and reduced motion; four-color treatment.
- **APIs/data:** No new API/table for branding; existing session hydration and `/users/me`. Optional first-run preference only if onboarding policy requires it.
- **Navigation/security:** Bootstrap → unauth welcome/auth or completed role home; never flash prior-account content while hydrating. Preserve secure storage and installed identity.
- **Acceptance:** Cold/warm/offline launch, expired session, large font and reduced motion; no splash hang or duplicate route; native rebuild/install-over-existing test.

## 02 — Onboarding · L · L1–L2

- **Source/current:** `mobile/src/onboarding/{ProfileEditor,profile}.tsx` (schema is `profile.ts`), `mobile/src/app/auth/onboarding.tsx`, backend `user/{ProfileController,ProfileService,ProfileData}.java`. Persisted customer/worker steps, validation and completion; team name/size are profile fields.
- **Missing/components:** Reference-aligned step layouts, progress/consent, real identity-document journey and team invites; StepHeader, FormSection, TradeSkillPicker, LocationPicker, review summary. KYC is separate L3 domain.
- **APIs/data:** Existing `/onboarding/catalogue`, GET/PUT `/onboarding`, POST `/onboarding/complete`, `/profile`; `onboarding_drafts`, profiles/catalogue. Proposed consent versions/records and private document metadata after policy approval.
- **Navigation/security:** Auth → role → steps → review → home; resume only owner draft. No granting admin or verification via form fields; restrict uploads and redact sensitive documents.
- **Acceptance:** Both roles/Individual/Team, resume/retry, validation, owner isolation, completion gating, account switch and unsaved navigation. Existing `onboarding.test.tsx`, AuthenticationIT supplement with native tests.

## 03 — Role Selection · M · L1

- **Source/current:** `ProfileEditor.tsx`, `mobile/src/auth/session.ts`, `backend/.../user/{UserController,ProfileService}.java`; CUSTOMER/WORKER flows exist; roles table also contains ADMIN. No standalone reference screen.
- **Missing/components:** RoleChoiceCard and explicit journey chooser; approve dual-role switching and category labels. Engineer category mapping is undecided.
- **APIs/data:** Existing `/users/me/roles` and onboarding role payload; `roles`, `user_roles`. Optional last active role preference; no new privileged self-enrolment.
- **Navigation/security:** Choice controls onboarding path, not trusted server authorization. Back preserves appropriate draft; customer type is not an authorization role.
- **Acceptance:** Role matrix, forged ADMIN rejected, invalid/incomplete role denied, switching clears role-specific caches and does not leak data.

## 04 — Sign In / Sign Up · L · L1

- **Source/current:** `mobile/src/app/auth/{login,verify}.tsx`, `mobile/src/auth/`, backend `auth/`; OTP/JWT/refresh/session revocation and development code exist. `ProductionOtpProvider` returns 503; production SMS is not implemented.
- **Missing/components:** LABOURLY AuthShell, PhoneInput/OtpInput, consent/error UX, approved real SMS delivery, recovery and abuse protections sized for public traffic.
- **APIs/data:** Existing `/auth/otp/request`, `/otp/verify`, `/refresh`, `/logout`; challenges, sessions and refresh-token tables. Proposed consent/abuse/provider delivery metadata with retention controls; no OTP plaintext retention.
- **Navigation/security:** New user → onboarding; returning user → authorized role. Rate limits, enumeration resistance, expiry/replay, log redaction, secure credential storage; dev OTP forbidden in production.
- **Acceptance:** Production provider sandbox delivery/failure, resend limits, incorrect/expired codes, refresh rotation/concurrency, logout offline, suspended account and cross-account cache tests. Existing ProductionAuthIT/AuthenticationIT baseline retained.

## 05 — Home Dashboard · L · L2

- **Source/current:** customer `discover.tsx`, worker `opportunities.tsx`, `components/RoleHome.tsx`, role `_layout.tsx`; customer home is worker discovery, worker home lists opportunities. No complete reference dashboard with projects/earnings widgets.
- **Missing/components:** DashboardHeader, QuickActionGrid, ActiveProjectSummary, notification entry and role-specific summaries; every count must come from authorized data, not demo constants.
- **APIs/data:** Reuse discovery, own requirements/bookings, unread count; proposed `/dashboard/me` summary if aggregation needed. Usually derived views/indexes, not duplicated balance/project state.
- **Navigation/security:** Customer → workers/post/projects/saved; worker → opportunities/quotes/calendar/earnings. Permission-based modules; no confidential home locations in public cards.
- **Acceptance:** Zero/large data, stale counts/retry, role isolation, accessible grid on 320dp, actual navigation and summary consistency after booking/cancel.

## 06 — Labour Listing · M–L · L2

- **Source/current:** customer `discover.tsx`, `components/WorkerCard.tsx`, `api/marketplace.ts`, backend `MarketplaceDiscoveryService`, `ServiceCoverage`; persisted discovery with trade/location/radius/availability and pagination support. Suggestions are not necessarily free on the requested dates.
- **Missing/components:** Reference list/cards, meaningful sort/paging UX, trustworthy ratings/rates, saved toggle, selected-date availability. WorkerList/WorkerCard/ResultSummary/PaginationState.
- **APIs/data:** Existing GET `/marketplace/workers`; profiles, skills, coverage/catalogue. Proposed date/sort query contract and saved relation; indexes after measured query plans.
- **Navigation/security:** Dashboard/filter → list → worker detail; preserve filters on Back. Enforce visibility/account state and bound query/radius/page inputs server-side.
- **Acceptance:** Canonical city vs GPS contract, cross-state coverage, paging without duplicates, changed visibility, schedule conflicts, no false rating/rate claims; MarketplaceIT/ServiceCoverageIT plus native scrolling.

## 07 — Smart Filters · L · L2

- **Source/current:** filters embedded in `discover.tsx`, `mobile/src/location/{CanonicalPlacePicker,JobLocationPicker}.tsx`, `api/marketplace.ts`; trade/radius/location supported, backend accepts availability. No complete smart-filter screen/ranking contract.
- **Missing/components:** FilterSheet with explicit apply/reset, searchable trade/skills/place, dates, team size, price and verified-review filters where real data exists. No implied AI matching.
- **APIs/data:** Extend `/marketplace/workers` using one shared eligibility contract. Price/review filters depend on real rate/review domains; no schema for cosmetic selections. Store preferences only if approved.
- **Navigation/security:** Filter state survives list/detail round-trip. GPS cannot invent state/district; manual city fallback remains. Bound expensive combinations and paginate.
- **Acceptance:** Apply/cancel/reset, no-result explanation, permission-denied manual fallback, exact filter/API parity and worker opportunities/quote/accept consistency.

## 08 — Worker Profile · L · L2–L3

- **Source/current:** customer `worker/[id].tsx`, MarketplaceDiscoveryService/DTOs; real profile, skills, experience, availability and coverage-related location. **Hardcoded `4.9 (120)` rating and `Book Worker • ₹500/day`; button only `alert('Booking flow...')`. Duration chips are local state, not a working hire contract.** Verification data uses SYNTHETIC_REVIEW.
- **Missing/components:** Truthful RateSummary, approved TrustBadge, portfolio, verified reviews, SaveWorkerButton, RequestQuote/DirectHire entry, private-contact control. Remove/relabel fictitious signals in approved implementation.
- **APIs/data:** Existing `/marketplace/workers/{id}`; proposed rate cards, review aggregates, portfolio storage, saved relation and hire request endpoint after D04. Extend verification with provenance; do not relabel synthetic rows as KYC.
- **Navigation/security:** Listing → profile → approved quote/hire flow/chat. Hidden/suspended workers and unrelated viewers get safe denial; no raw phone/document disclosure.
- **Acceptance:** No fake prices/reviews, empty-review state, verified badge source, hidden-worker denial, saved persistence, actual booking only through eligibility/locking path, price snapshot tests.

## 09 — Post Requirement · L · L2

- **Source/current:** customer `post.tsx`, requirement `[id].tsx`, `JobLocationPicker`, `DraftNavigationGuard`, backend RequirementService/Controller and MatchingEngine. Real drafts, explicit versioned editing, publishing, canonical city/GPS validation and matching exist.
- **Missing/components:** Reference layout, guided schedule/count/rate fields per policy, reusable RequirementForm/LocationSummary/DateRange/PublishReview, attachment handling if reference confirms it; clear schedule-aware match messaging.
- **APIs/data:** Existing POST `/requirements`, GET/PUT `/{id}/draft`, PATCH `/{id}/status`, GET own/detail/matches; requirements, V10 canonical location, V11 edit version. New fields only via additive migration with legacy-null handling.
- **Navigation/security:** Dashboard/post/draft/detail/quotes; owner-only DRAFT edits, explicit Save, no navigation autosubmit, immutable accepted terms and optimistic locking.
- **Acceptance:** Save/reopen, discard/header/tab/hardware Back, stale edit409, unauthorized publish, invalid coordinates, denied GPS/manual selection, publish retry and protected-data nonmutation. DraftEditingIT and requirement-publish/draft-editor/job-location tests are bases.

## 10 — Schedule Calendar · XL · L3

- **Source/current:** worker `schedule.tsx` is **My Quotes**, not a calendar. Both roles have booking lists/details; `BookingState`, V1 availability/booking_workers and V2 reservation triggers exist.
- **Missing/components:** Real month/week/agenda views, working hours/blocked dates, conflict feedback, approved rescheduling, team assignments. CalendarGrid/AgendaList/DateRange/CapacityBadge; accessible list equivalent.
- **APIs/data:** Existing `/bookings/me` and detail. Proposed `/schedule/me`, availability CRUD and versioned reschedule actions. Reuse booking_workers exclusion; extend per-member/team assignment and calendar exceptions, retain history.
- **Navigation/security:** Role home/project → calendar → authorized booking; never expose another worker's customer details. Date/time zone and half-open interval rules explicit.
- **Acceptance:** Overlap/adjacent/midnight/date-zone cases, simultaneous assignments, team members also booked individually, approved reschedule conflict rollback, cancelled reservation release and keyboard/screen-reader agenda.

## 11 — Chat / Call · XL · L4

- **Source/current:** No dedicated chat/call route/controller/table in inspected application. Existing auth and booking ownership can supply permissions; no complete communication feature.
- **Missing/components:** ConversationList, MessageThread/Composer, delivery/retry indicators, attachments, block/report, call consent/status and accessibility. Approve pre/post-booking access and masked provider.
- **APIs/data:** Proposed conversations/messages/read cursor, authorized realtime subscription, attachments and short-lived call-session API; participant/message/delivery/moderation/call metadata tables. Provider choice after approval.
- **Navigation/security:** Profile/project/inbox → participant thread; validate on every fetch/send/subscription/call, rate limit, scan attachments, revoke on account changes, retain per approved policy. Notification previews must respect privacy.
- **Acceptance:** Two real identities exchange persisted messages; offline resend dedup, no outsider subscription, blocks/reports, cancelled job access policy, reconnect, call expiry/no answer and no leaked raw numbers/tokens.

## 12 — Active Hires / Projects · XL · L3

- **Source/current:** customer `requirements.tsx`, both `bookings.tsx` and `booking/[id].tsx`, shared `components/BookingDetails.tsx` if present (see booking route implementation), backend booking/quotation modules; confirmed booking and cancellation are real. IN_PROGRESS/COMPLETED enum states alone are not working progress/attendance UX.
- **Missing/components:** ProjectList/Timeline, assignment roster, attendance/progress, start/complete approval, reschedule, no-show/dispute, safe rehire/new requirement linkage.
- **APIs/data:** Existing booking/detail/cancel and quote accept. Proposed project/action endpoints with expected version; project grouping only if needed, append-only progress/attendance/dispute/history tables and completion/review linkage.
- **Navigation/security:** Dashboard/calendar/notification → project → chat/payment/review; owner, assigned member and authorized admin permissions separated. Evidence/time edits auditable; no unilateral forged completion.
- **Acceptance:** Accept exactly once, losing quote no booking, lifecycle permissions, failed transition rollback, attendance correction trail, completion/dispute rules, cancellation releases reservation and historical amounts unchanged.

## 13 — Wallet / Payments · XL (requires re-estimation) · L4

- **Source/current:** No wallet/payment UI/controller/ledger/provider integration. Quotation amounts and booking terms are not payment collection or earnings.
- **Missing/components:** PaymentSummary, approved checkout, payment history/receipt, earnings, payout account/status, refund/dispute states; never fabricate spendable balance.
- **APIs/data:** Proposed server-created payment intents/orders, signed webhook receiver, authorized payment/payout/refund reads/actions. Immutable monetary ledger/provider events/reconciliation/refunds/payouts; decide monetary model before schema. Money in integer minor units or approved exact decimals; no floating-point ledger.
- **Navigation/security:** Project → pay → pending/success/failure; worker → earnings/payouts; admin audited reconciliation. Provider approval, secret isolation, webhook signature/replay checks, idempotency and no client-trusted amount/success.
- **Acceptance:** Provider sandbox + approved physical-device flow, duplicate/out-of-order webhooks, timeout/reconciliation, partial/full refund, payout failure/retry, ledger balancing and unauthorized account access. No live money during implementation tests.

## 14 — Notifications · L–XL · L4

- **Source/current:** `app/notifications.tsx`, `components/NotificationBell.tsx`, `notifications/{navigation,session}.ts`, backend notification module and V12. Real in-app events/list/unread/read/read-all and role-aware links; no background push. Broadcast capped at 20; broad catch is not durable delivery.
- **Missing/components:** LABOURLY NotificationRow/Preferences, transactional vs promotional choices, durable delivery, device registration, push permissions/background/dead-app behavior, lifecycle-aware historical wording.
- **APIs/data:** Existing `/notifications` reads/write-read routes. Proposed devices/preferences and outbox/delivery attempts/provider-message IDs with dedup keys; additive migrations, retain V12 IDs/read state.
- **Navigation/security:** Bell/push → session gate → authorized destination; deleted/private target safe fallback. Logout removes token/account association, notification cache isolation and preview privacy; marketing consent independent.
- **Acceptance:** All event/recipient tests, transaction rollback, retries/dedup, unread races, token rotation/multi-device/account switch, provider outage and physical Android lock-screen/terminated delivery; finish documented native gaps first.

## 15 — Saved Workers · M · L2

- **Source/current:** No saved-worker route, API or table. WorkerCard and profile are reusable presentation only.
- **Missing/components:** SaveToggle, SavedWorkerList with current availability/visibility and real empty/error states.
- **APIs/data:** Proposed GET/PUT/DELETE `/saved-workers/{workerId}` (collection GET); `saved_workers(customer_id,worker_id,created_at)` with unique pair/FKs. Idempotent writes; avoid duplicating worker profile snapshots.
- **Navigation/security:** Listing/profile save → dedicated collection; customer owner scope; remove hidden/deactivated worker detail access even if saved.
- **Acceptance:** Persist across restart/account switch, double-tap/idempotence, pagination, unauthorized modification, unavailable/hidden worker behavior and optimistic UI rollback.

## 16 — Profile & Settings · L · L1/L3/L4

- **Source/current:** customer/worker `profile.tsx`, shared `ProfileEditor`, backend ProfileService and coverage controller; profiles, worker availability, coverage edits and sign-out exist. No complete privacy/preferences/deletion/help settings.
- **Missing/components:** ProfileHeader, SettingsRow, language/accessibility/preferences, identity status, team management, support/privacy/delete-account workflow. Payout settings depend on approved payment model.
- **APIs/data:** Existing `/profile`, coverage GET/PUT and availability PATCH; proposed `/settings`, consent/preferences, account-deletion request/export and support tickets. Retain protected transactional history under approved retention policy, do not cascade-delete bookings.
- **Navigation/security:** Profile → edit/team/KYC/payment/preferences; reauthentication for sensitive changes, encrypted documents, per-field disclosure and server role checks. Deletion/retention rules require review.
- **Acceptance:** Own-account edit only, no role escalation, unsaved changes, coverage consistency, logout clears account data, deletion lifecycle and retained records, large fonts/accessible toggles.

## Worker/team and admin coverage beyond the customer reference

| Journey | Reuse / gap | Phase / dependency | Acceptance |
| --- | --- | --- | --- |
| Worker registration/trades/location | Working profiles/catalogue/coverage; LABOURLY UX and real trust missing | L1–L2; D03/D09 | Both roles and multi-state worker never constrained to home state |
| Identity verification | SYNTHETIC_REVIEW records only; no real KYC/review queue | L3; D09 | Private upload, reviewer ACL/audit, badge revocation/appeal |
| Opportunities/quotes | Working API/eligibility/quotes; no complete direct-hire/rate model | L2; D04/D05 | Discovery/submit/accept share authoritative eligibility |
| Team membership/capacity | Team metadata and base tables exist; no end-to-end member/assignment workflow | L3; D06 | Invite consent, membership authorization, per-person nonoverlap, safe substitution |
| Progress/attendance | State enum and reservations exist; no operational UI/API workflow | L3; D10 | Authorized start/complete, attendance evidence/corrections/history |
| Communication/earnings | No implemented domains | L4; D07/D08 | Participant privacy and reconciled money, not UI-only counts |
| Reviews/disputes/no-show | No implemented workflows; profile rating is static | L3; D09–D11 | Booking-qualified review, abuse report, appeal and immutable audit |
| Admin | `admin/src/App.tsx` navigation shell; security matches `/admin/**` but no operating APIs | L1 foundation, L3 queues, L4 finance, L5 rehearsal | Non-admin denied at API; scoped reviewer/support/finance capabilities, action reason/audit, no direct database editing |

No absent workflow above is considered implemented because a table, enum, navigation label, test fixture or placeholder exists.
