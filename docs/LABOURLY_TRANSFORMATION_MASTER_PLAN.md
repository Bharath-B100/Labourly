# LABOURLY transformation master plan — Phase L0

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Date: 14 October 2026. **Planning only; L1 is not authorized.** No application, dependency, database, migration, branch or signing change is made by this plan. LABOURLY is the proposed product name; internal identifiers remain NammaCrew until individually reviewed.

## Executive assessment

Reuse the existing two-sided authentication/onboarding, worker discovery and coverage, requirement drafts/publishing, quotation acceptance, reservation constraints, cancellation history and in-app notifications. This is a substantial product expansion, not a cosmetic rename. Chat, private calling, saved workers, payments/wallet/payouts, operational teams, attendance, reviews/disputes and a functioning admin dashboard are not complete working features today.

All sixteen customer screens and all requested worker/team/admin journeys are retained in the launch scope. Phases describe implementation order, not permission to omit features from launch. No required feature can be deferred beyond launch without explicit written approval. Public launch remains blocked until all required backlog acceptance criteria pass.

The actual Crewza 16-screen reference was supplied on 14 October 2026 and saved at `docs/reference/crewza/crewza-16-screens.png` with a matching SHA-256. All sixteen screens have now been visually reconciled in `LABOURLY_16_SCREEN_GAP_ANALYSIS.md`. Labourly keeps #FFCC25 Safety Yellow, #202326 Charcoal Black, #FFFFFF White and #E5E7EB Concrete Grey. The image establishes screen composition and visible controls, not animations, unseen states, working capabilities or approval for providers. Adapted layouts and the product decisions below still require approval before L1.

Reference review adds a distinct introductory carousel, customer schedule picker with preferred time/duration, worker languages, explicit filter units, project capacity indicators and date-grouped notifications to the planning map. Its Home/Workers/Jobs/Chat/Profile navigation differs from the earlier dedicated Post tab proposal. Password/social authentication, video calls and wallet top-up/send/request/invoice controls are visible but require explicit D07/D08/D12 decisions; do not implement them silently or ship placeholder actions.

## Current checkpoint and evidence

| Item | Observed on L0 inspection |
| --- | --- |
| Branch | `phase-4-development` |
| HEAD | `93e3eb2c3fd192afaf69b32e70e8ae826e90f953` |
| Working tree before L0 files | 64 tracked changed files; 346 untracked files (`git status --porcelain -uall`); 0 staged. This count includes individual files inside untracked directories. |
| Backend | Java 21 / Spring Boot; `backend/src/main/java/in/nammacrew/{auth,user,marketplace,booking,notification}`; SQL Flyway V1–V12 |
| Mobile | Expo 57, React Native 0.86.3, Expo Router `mobile/src/app`; shared API/auth/location/navigation/components; 17 test files |
| Admin | React/Vite `admin/src/App.tsx`; explicit navigation-only shell, no management data or admin login |
| Runtime database | `nammacrew-db-1` exists but is stopped; no start/restart or new live query performed in L0. Fresh database verification is BLOCKED pending an approved running environment. |
| Latest stored regression | 94 backend (4 unit + 90 integration), 110 mobile / 17 suites, 2 admin retained from prior run. These are historical evidence, not a new L0 test run. |
| Latest protected-data evidence | `verification/notification-acceptance-preservation.json`: all 3 bookings, 4 quotes, 3 reservations equal; V1–V12 successful. Not a fresh current-state certification. |

Protected bookings: `TEST-RECORD-02` (Worker A, Oct 8–10, INR 2,500 per worker/day), `TEST-RECORD-04` (Worker A, Oct 15–17, INR 4,500 fixed), `TEST-RECORD-07` (Worker E, Oct 22–23, INR 1,000 fixed, cancelled). Preserve full rows, quotation/history, cancellation metadata and reservation relationships, not just counts/statuses. No time-based closure or correction of old dates during migration.

Read reports: `PHASE_4_FINAL_AUDIT.md`, `PHASE_4_DEPENDENCY_SECURITY_REVIEW.md`, `PHASE_4_GEOGRAPHIC_CORRECTION.md`, `PHASE_4_MILESTONE_READINESS.md`, `PHASE_4_NOTIFICATION_NATIVE_ACCEPTANCE.md`. The milestone file still contains older 93-test/inactive-backend statements; the later notification acceptance report establishes 94 and actual activation. Do not merge old native claims into a blanket PASS. Open-opportunity/accepted-notification destination completion, native network failure/retry and in-flight account-switch race remain unverified there.

Security review is historical, not a fresh scan: mobile 12 moderate/54 high/1 critical and admin 2 moderate/6 high recorded on Oct 9. Current lockfile/advisory reconciliation must be refreshed before release. Backend vulnerabilities remain **UNASSESSED**. Production OTP provider explicitly fails closed with 503 because real SMS delivery is unconfigured. A debug client served by Metro is not a signed production app.

## Proposed preservation strategy — requires approval before execution

1. Freeze concurrent edits briefly; inventory tracked/untracked/ignored work and hash required source/assets/reports. Inspect untracked evidence for credentials and personal data before any commit. Never blanket `git add .`.
2. Make a verified filesystem backup that includes untracked work and needed ignored local configuration/tooling. Keep secrets/signing keys encrypted outside Git. A patch or Git bundle alone cannot preserve untracked and ignored files.
3. When database is running and approved, create a consistent database backup and restore it into a separate disposable database; verify protected rows, Flyway checksums and extension versions. Record recovery steps and owners. Do not use a live-volume filesystem copy as the sole database backup.
4. After user approval, create proposed branch `codex/labourly-l0-baseline` from the **current checkout including working-tree work**, with a reviewed checkpoint commit. HEAD alone is not the current product. Then use `codex/labourly-l1-foundation` for the approved L1 work. Branch names are proposals; neither branch nor commit has been created.
5. Review checkpoint diff and manifests; assign data steward and signing-key owner. Each subsequent phase closes with isolated test evidence, preserved-data comparison and user approval. A source rollback does not roll back financial or historical database events.

## Target architecture and sequence

Keep the existing modular Spring Boot service and PostgreSQL/PostGIS initially. Add explicit domain modules and APIs, not a second source of truth for booking eligibility. Use transactional persistence for state transitions and a durable outbox for external effects. Reuse mobile auth/session isolation and Router; evolve shared components before duplicating layouts. Admin must enforce server-side permissions independently of hidden navigation.

| Phase | Deliverable | Dependencies | Exit evidence / approval gate |
| --- | --- | --- | --- |
| L0 | These five plans; reference reconciliation and decision register | Existing source/reports | User approves scope, reference mapping, checkpoint and policy choices; no code implementation |
| L1 | Safe checkpoint; approved brand/tokens/navigation; truthful trust/price UI; production auth and secure admin foundation | L0 decisions D01–D03, D09/D12 | Small-screen/accessibility snapshots, auth/role tests, legacy-session/link tests, protected-data baseline; review before L2 |
| L2 | Customer/worker discovery, smart filters, profiles, saved workers, drafts, rate contracts and hire path | L1; hire/pricing/location policies | Real APIs and persisted actions for screens 5–9/15; eligibility parity, ownership, location and concurrency tests |
| L3 | Schedule calendar, teams/capacity, active projects, attendance/progress, reviews/disputes, operational admin controls | L2; lifecycle/capacity/trust decisions | Per-member capacity/concurrency tests, role audit trails, completion/no-show/dispute flows and native journeys |
| L4 | Authorized chat/private calls, payments/wallet/payout/refund flows, reliable in-app + background notifications | L3; external-service, consent and financial approvals | Provider sandbox contract tests, transactional/outbox fault tests, privacy review, end-to-end two-party flows |
| L5 | All sixteen screens reconciled to reference, signed release, production hardening and operational launch rehearsal | L1–L4 complete | Full regression, real-device lifecycle/push, migration restore drill, security triage, load/accessibility checks; explicit launch approval |

Production readiness work begins in L1 and continues through L5; do not wait until L5 to discover provider/legal constraints. Proposed architecture is approval material, not a financial integration authorization.

## Decisions requiring user approval

| ID | Decision / options to settle | Recommendation for review; consequences |
| --- | --- | --- |
| D01 | Adapted layouts, navigation and brand assets | Actual image received and all16screens reviewed. Approve Labourly layout adaptations and original illustrations; settle Chat tab versus dedicated Post entry and Inter versus initial platform font. Static reference does not define animation. |
| D02 | Checkpoint, branch and signing ownership | Approve above preservation strategy; identify owner of current package/store/signing/EAS assets. |
| D03 | Customer roles and role switching | Treat Contractor/Engineer/Architect as customer categories unless distinct permissions are required. Decide whether Engineer maps to existing SITE_ENGINEER or needs a new code. Keep account role authorization distinct from profile labels; decide dual-role switching UX. |
| D04 | Direct Hire versus Request Quote | Preserve proven quote-to-book path. Decide whether Direct Hire means a binding instant booking or a worker-confirmed request. Specify rate source, acceptance/expiry, reservation timing and payment requirements; same eligibility/concurrency rules must apply. |
| D05 | Pricing units and schedule duration | Reference includes hourly/daily/weekly/monthly choices, preferred time and duration. Decide whether weekly/monthly represent price units or scheduling periods; define currency, workday/hour duration, time zone, rounding, minimums, overtime, tax/fees, headcount and rate expiry. Existing FIXED_TOTAL/PER_DAY/PER_WORKER_PER_DAY do not establish these additional contracts. Snapshot agreed terms; do not reinterpret historical amounts. |
| D06 | Team capacity and authority | Decide team owner/member permissions, invitations, assignment, substitutions, partial availability and whether teams can exceed confirmed named members. Recommend per-member reservations; a teamSize number alone is insufficient. |
| D07 | Chat/calls | Reference includes phone and video controls, online/read indicators, job cards, attachments and quick replies. Explicitly settle voice/video scope, pre-booking access, expiry after cancellation, blocking/moderation, consent and retention. Recommend participant authorization and masked calls; exposing raw phone numbers changes privacy and abuse risks. No provider selected. |
| D08 | Payments/wallet/payouts/refunds | Reference includes available balance, Add Money, Send, Request, Transactions and Invoice. Settle each action's scope and gateway/merchant model, money custodian, settlement timing, payout/KYC ownership, fees, failed payments and refund authority. Clarify whether wallet is a payment/earnings view or stored value; do not invent an internal cash balance or escrow. Financial/legal review and external-service approval required before integration. |
| D09 | Identity/trust | Decide required checks/provider, reviewer authority, document storage/retention, badge meaning/expiry/revocation and appeals. SYNTHETIC_REVIEW cannot be marketed as real identity verification. |
| D10 | Completion/cancellation/disputes | Decide cancellation windows/fees, no-show evidence, reschedule approval, completion sign-off, dispute deadlines and refund holds. Preserve existing cancellation history; define rehire/repost as a new transaction rather than reopening cancelled bookings. |
| D11 | Reviews/promotions | Define verified-review eligibility, one-per-booking/party rules, moderation/appeals and promotional opt-in separately from service messages. No fabricated ratings. |
| D12 | Authentication, operations/launch | Reference uses mobile/password, recovery and Google/Apple actions, while the current app uses OTP. Decide supported login methods and secure account-linking/recovery before changing authentication; no inert social buttons. Approve admin permission matrix, support ownership, SMS/push/communications/payment providers, data-retention/deletion policy and launch geography/languages. The country setting is not authorization for international expansion. External accounts/paid services require approval. |

## Effort and acceptance contract

Screen effort ranges in the gap analysis are rough engineering person-days including focused tests, assuming stable approved contracts and existing toolchain. They are not a delivery promise, do not include external approval waiting, and overlap shared backend work. Do not sum screen estimates into a fixed-price proposal. XL domains (money, teams, communications) require a short design/prototype review before reliable scheduling. Build the detailed sprint estimate after D01–D12.

Every feature needs real persisted API behavior, negative authorization tests, loading/empty/failure/retry states, screen-size/font scaling, offline behavior and native two-party acceptance. Database tests use disposable containers/fixtures only; no acceptance mutations on protected history. Run backend/mobile/admin gates on relevant phase changes and full release regression at L5. L0 creates documentation only; no new test PASS, security PASS or native PASS is claimed.

Read next: [16-screen audit](LABOURLY_16_SCREEN_GAP_ANALYSIS.md), [design specification](LABOURLY_DESIGN_SYSTEM.md), [complete backlog](LABOURLY_FEATURE_BACKLOG.md), [migration risks](LABOURLY_MIGRATION_RISK_REGISTER.md).

**L0 planning delivered; awaiting user approval. Do not start L1.**
