# LABOURLY feature backlog and launch contract

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

14 October 2026 · proposed work only. Phase means implementation sequence. **R = required before public launch; NONE of the requested features is deferred beyond launch.** B = foundational release gate. O = genuinely optional extra, outside the supplied requirement; not a substitute for R. Priorities: P0 unsafe release/data/security integrity blocker; P1 required product/launch work; P2 later-phase required scope or scaling; P3 optional enhancement. P2 does not imply post-launch deferral.

Decisions D01–D12 are defined in the master plan. Test types: U unit; C component; I isolated database/API integration; N native physical/emulator; X external-provider sandbox/contract; O operational/security/accessibility. Named owners are to be assigned by the project owner before implementation.

## Supplied-reference reconciliation — 14 October 2026

All sixteen screens in `reference/crewza/crewza-16-screens.png` were reviewed against this backlog; the gap analysis records each observation. B01's image-receipt requirement is now satisfied, while adapted layouts and product decisions remain pending. These planning clarifications supplement the existing rows without authorizing L1:

- F02 separates the marketing IntroCarousel (dots/Next) from persisted profile onboarding; test first-run, skip/return policy and accessibility once approved.
- F03 treats Contractor/Engineer/Architect as customer categories; retains worker journeys and backend roles.
- F04 needs D12 resolution of reference password/recovery/Google/Apple versus current OTP, including account-linking and security tests if approved.
- F05/F06/F07 include actual trade/search navigation, save controls, availability windows, hourly/daily/weekly/monthly choices, rate range, verified/rating filters. D05 must define these units before API/filter implementation; no decorative filters or invented rates.
- F08 includes worker languages, skill tiles and the D04 Hire Now/D07 Call contract; sample ratings, prices and badges are not acceptance data.
- F09/F10 distinguish customer SchedulePicker (preferred time, duration and count) from worker calendar/capacity management. The Post screen does not establish an attachment requirement. Test schedule-summary/API agreement and unit/date boundaries.
- F11 adds shared job/location cards and quick replies. Reference video controls require an explicit D07 decision and provider/privacy review; no assumed video implementation authorization.
- F12 adds Active/Completed/Cancelled tabs and filled-worker capacity; distinguish staffing counts from work-completion progress in API and UI tests.
- F13 requires an explicit D08 decision for every visible Add Money/Send/Request/Transactions/Invoice action, including its financial model and authorization; no fake balance or unsupported button.
- F14 adds Today/Earlier grouping and accessible unread indicators; payment/chat/reminder examples depend on their actual domains and reliable delivery.
- F15 retains persisted account-owned saved workers. F16 includes KYC, language, country, notifications, help, privacy and terms destinations; country does not expand launch geography without D12.

The reference's Home/Workers/Jobs/Chat/Profile tabs are now recorded in the design system; proposed Labourly labels and Post entry location await D01. No required feature is silently removed by this review, and newly exposed policy decisions are not automatically approved.

| ID / feature | Priority / phase / launch | Dependencies | Acceptance criteria | Required tests |
| --- | --- | --- | --- | --- |
| B00 Checkpoint/data preservation | P0 / L0 approval→L1 / B | D02, running DB approval | Reviewed full working-tree backup, restored DB copy, protected rows/checksums identical; secrets excluded from Git | O restore drill, read-only comparisons |
| B01 Reference/brand/signing decisions | P1 / L0→L1 / B | D01/D02 | All16 layouts approved; exact palette; ownership/legacy IDs recorded | O reference checklist, source/asset inventory |
| F01 Splash/launch | P1 / L1 / R | B01 | LABOURLY branding; correct auth destination; no blocking animation | C/N cold/warm/offline/reduced motion |
| F02 Onboarding both sides | P1 / L1–L2 / R | D03, B03 | Persistent/resumable customer/worker/team profile, validated completion | U/C/I/N interrupted/invalid/cross-user |
| F03 Role selection/switch | P0 / L1 / R | D03 | Only allowed roles; correct journey; stale account caches removed | I privilege escalation; C/N switches |
| F04 Production sign-in/up | P0 / L1 / R | D12 SMS approval | Real delivery; fail closed; no dev bypass; secure refresh/logout/rate limiting | I auth/production-mode; X SMS failures; N session expiry |
| B02 Design system/accessibility | P1 / L1 / B | B01 | Shared tokens/components; four colors; readable focus/errors/font scaling | C snapshots; N TalkBack/320dp/200% font |
| F05 Customer/worker home | P1 / L2 / R | F03,F06,F12,F14 | Authorized live summaries/actions, correct empty/failure states | I totals/ownership; C/N navigation |
| F06 Labour listing | P1 / L2 / R | B04,F08 | Real paged results; accurate visibility/trade/location/date indications | I filters/pagination/conflicts; N scroll/retry |
| F07 Smart filters | P1 / L2 / R | D05,B04,F06 | Every filter changes actual API results; apply/reset/manual fallback work | U/C state; I parity/invalid/large queries; N GPS-denied |
| F08 Worker profile/truthful trust | P0 / L1 remove misleading claims, L2–L3 complete / R | D04/D05/D09,B08 | No static4.9/120 or fake500/day; actual profile/rate/review/verified sources; working actions | C no fabricated data; I private/hidden worker; N full actions |
| F09 Requirement post/edit/publish | P1 / L2 / R | B04,D05,F10 | Real draft/publish, correct place/date/count; explicit save, stale edit protection | I owner/version/location; C/N dirty Back/tab/keep/discard |
| F10 Schedule calendar | P1 / L3 / R | B05,B06,D10 | Calendar+agenda with actual bookings/blocks; approved rescheduling; correct time zone | U boundaries; I concurrent overlap; N accessible date flows |
| F11 Chat/private calls | P1 / L4 / R | D07,F12,B03 | Persisted participant conversation; reliable resend; approved private call path; block/report | I/X authorization/reconnect/abuse; N two devices |
| F12 Active hires/projects | P1 / L3 / R | B05/B06,D10 | Actual progress, attendance, completion, cancellation and dispute entry | I state/actor/race/rollback; N customer/member/admin |
| F13 Wallet/payment UI+collection | P0 / L4 / R | D08,F12,B07 | Approved wallet meaning; server-priced payment, pending/paid/refund separation, reconciled ledger | U money; I idempotency; X webhook/reconciliation; N checkout |
| F14 Notifications/push | P1 / L4 / R | D11/D12,B09,F11/F13 events | In-app and physical-device background/terminated push, correct recipients, consent, reliable retries | I rollback/dedup; X outage; N all states/account switching |
| F15 Saved workers | P1 / L2 / R | F06/F08 | Owner-scoped durable save/unsave, list/restart/hidden-worker behavior | I unique/idempotent/ACL; C optimistic rollback; N restart |
| F16 Profile/settings | P1 / L1/L3/L4 / R | D03/D09/D11/D12 | Edit own data, coverage/preferences/privacy/help and approved deletion workflow | I ACL/retention; C/N validation/signout/large font |
| B03 Privacy/consent/retention | P0 / L1 design, L3–L5 enforce / B | D07–D12 | Data map, least disclosure, secure uploads, retention/deletion/export consistent with protected history | O review; I redaction/retention/ACL |
| B04 Geographic parity | P0 / L2 / B | Existing catalogue, D12 | Suggestions/opportunities/submit/accept obey same documented geography; GPS radius-only fallback explicit; genuine multi-state jobs supported | I all modes/missing coords/change-after-quote; N manual fallback |
| B05 Quote/direct hire/rates | P0 / L2 / R | D04/D05 | Approved direct-hire contract, quote edits/rejection/expiry, hourly/daily/fixed terms snapshots, exactly one winner/reservation | U pricing; I double-accept/conflict/unauthorized/retry; N both journeys |
| B06 Teams/membership/capacity | P0 / L3 / R | D06,F10 | Owner/member consent/roles, actual assignments, no person double-booked, substitution auditable; headcount conserved | I membership/individual-vs-team concurrency/partial coverage; N team journey |
| B07 Earnings/payouts/refunds | P0 / L4 / R | D08/D10,F13 | Real earnings derived from reconciled transactions, approved payout timing/refund/hold rules; no fabricated spendable balance | I double-entry balance/replay/partial refunds; X payout failure; N worker finance |
| B08 KYC/verification/reviews | P1 / L3 / R | D09/D11,B03 | Real identity evidence and scoped review; synthetic provenance preserved; only eligible completed-booking reviews; appeal/revocation | I reviewer ACL/duplicates/forgery; X approved verification; N badges/reviews |
| B09 Outbox/reliable effects | P0 / L3 foundation,L4 integrations / B | Existing transaction boundaries | Durable event IDs, atomic writes, bounded retry/dead letters, dedup per recipient/channel; eliminate silent loss/capped unnoticed omission | I crash-before/after-send/retry/rollback; O queue replay/alerts |
| B10 Attendance/no-show/disputes | P1 / L3 / R | D10,B06/B08 | Actor/evidence/time audit, correction approvals, no-show resolution and dispute/refund linkage; no guessed penalties | I forgery/state/retention; N customer/member/support |
| B11 Admin operations | P0 / L1 auth,L3 moderation,L4 finance / R | D09/D12,B03 | Real least-privilege customer/worker/verification/jobs/bookings/support queues; audited status actions; finance separation | I direct-endpoint/non-admin denial; C screens; N/browser operator runbook |
| B12 Security/supply chain | P0 / L1 triage,L5 release / B | Reliable official advisory access | Backend UNASSESSED resolved with dated scan; all known runtime/tooling issues triaged/remediated; signed artifact evidence and secret controls | O SCA/reachability/secret scan; I auth adversarial |
| B13 Production operations | P0 / L1 design,L5 rehearsal / B | D12,B00/B09/B12 | Approved hosting/HTTPS/secrets/backups/restore, monitoring, audit access, support incidents, migration rollback/forward plan | O load/restore/incident/release smoke |
| B14 Historical compatibility | P0 / L1–L5 / B | D02, approved migrations | Users/session/link/history survive in-place update; no protected-record rewrite; adapters support old app during rollout | I old/new client contracts; N upgrade; O migration clone checks |
| B15 Cancellation/rehire lifecycle | P1 / L3 / R | D10,B05/F12 | Published policies, correct cancellation metadata/release; rehire creates new authorized request preserving old history | I idempotency/overlap/history; N both parties |
| B16 Promotional consent | P1 / L4 / R | D11,F14 | Separate opt-in, unsubscribe effective, server-side suppression, consent version/audit | I preferences/delivery suppression; N logout/multi-device |
| B17 Native acceptance closure | P1 / L1 baseline,L5 final / B | Available devices, F14 | Close prior notification gaps; all16screens and all roles actually exercised on candidate, no UI-only PASS | N offline/link/read errors/races/physical-device; complete regressions |
| O01 Rich decorative motion | P3 / L5 only if approved / O | All required work/accessibility | Optional motion never blocks launch/navigation; reduced-motion fallback | N performance/battery/accessibility |
| O02 GPS administrative auto-resolution | P2 / L2 investigation,L5 decision / O improvement | Trustworthy boundaries/licensing | Only if validated; manual canonical city fallback remains required. Do not infer borders from nearest city | I border/ambiguous/out-of-country; N fallback |

Automatic geographic resolution is optional because the required GPS/manual selection journey remains supported; eliminating manual fallback or silently excluding required worker coverage is not optional. Optional motion is not one of the sixteen required functional screens. No financial, chat, saved-worker, calendar, worker-team or admin requirement is placed in a post-launch bucket.

## Cross-cutting definition of done

Each feature closes only when source, API, database contract, permissions, negative cases and native interaction agree. Pass U/C/I gates and relevant N/X/O checks with dated evidence and explicit test counts. No bypassed failing tests, fake balances/ratings or swallowed errors as acceptance. Migrations run on a clone from the actual V12 baseline and old-data fixtures; constraints and histories stay intact. Test accounts/records are disposable. Network-dependent evidence that cannot run is BLOCKED, not PASS.

At each phase boundary: exact branch/HEAD/dirty manifest; source/config/dependency diff; relevant full regression; app build identity; new migrations and restore evidence; preserved-booking comparison; native gaps and security assessment; user approval to continue. L5 requires physical Android end-to-end customer→worker/team→admin flow, signed standalone app startup without Metro, and all R/B rows accepted. No total schedule or production approval is promised by this backlog.
