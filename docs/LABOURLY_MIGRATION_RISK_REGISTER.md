# LABOURLY migration and risk register

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

14 October 2026. Proposed controls only. No global rename, data migration, branch change or provider setup performed. Risk priority describes release impact; owners below are accountable roles to be assigned by the project owner, not people already assigned.

## Compatibility migration plan

| Surface / current state | Proposed change and compatibility control | Validation / rollback |
| --- | --- | --- |
| Display brand NammaCrew | Change approved visible strings/assets to LABOURLY after inventory; preserve user-entered text and historical event content | Search scoped UI/admin/docs/assets; native snapshots; previous assets can be restored |
| Icon/native launch/login animation | Replace all actual referenced density/adaptive/splash assets plus accessibility labels/permission copy; native rebuild required | Cold/warm/reduced-motion and installed update tests; retain old artifact |
| Android `in.nammacrew.mobile` / iOS same identifier | Recommend retain existing installed identity for display-only rebrand. Changing ID is a separate new-app migration; do not assume name and package must match | Approve signing/store owner, inspect certificates without exposing keys; test signed in-place upgrade. Different ID cannot automatically read old sandbox/SecureStore |
| Signing | Keep signing lineage and package unless explicitly approved; current debug APK is not production signing evidence | Secure key backup/ownership, matching-cert update test; never generate/replace production key silently |
| Expo slug `nammacrew`, no `eas.json` found | Inventory linked project/account/update channels before renaming slug or creating EAS project; configured projectId not found in inspected app.json | Validate native config/runtime/update compatibility against installed SDK docs at implementation time. No new account/build service in L0 |
| Scheme `nammacrew` | Recommend retain old scheme alias while adding approved Labourly scheme; domains/app links require ownership verification | Old/new auth/notification links, cold start/logged out/wrong role/invalid IDs; avoid blind stored-link replacement |
| API `/api/v1`, Java `in.nammacrew`, database names | Keep stable initially. Visible API title/docs can rebrand separately. Internal namespace rename adds no customer value and increases risk | Old-client contract tests; no endpoint/base URL break, approved deprecation period for later versioning |
| Auth/session storage | Preserve storage keys, session IDs, JWT signing/claims/issuer expectations and server revocation semantics unless reviewed | Installed update logged-in/expired/revoked/dual-role tests; avoid forced sign-out or token exposure; key rotation needs planned overlap |
| Flyway V1–V12 | Never edit applied migrations. Add next unused version (V13 only if still unused when implementation begins), version-reserve with other work | Compare checksums to live history; expand/backfill/validate before constraints; clone migration tests and restore rehearsal; forward fix preferred after writes |
| Existing users/bookings/quotes | Preserve UUIDs, ownership, agreed amounts/units, status and immutable histories. New fields nullable/defaulted with explicit legacy behavior | Deep-row comparison of protected3bookings/4quotes/3reservations; no reinterpretation of synthetic verification, teamSize or historical pricing |
| Notification V12 records | Retain IDs, recipients, read timestamps, type/reference meaning and event history. Add outbox/device/prefs without rewriting old events | Old/new payload adapters, dedup, auth validation, historical message vs current booking state; no duplicate replay blast |
| Admin | Rebrand shell separately from implementing secure admin features; no fictional dashboard metrics | Admin feature/API ACL tests; role-based data access and audit; no direct DB shortcuts |
| Location catalogue | Preserve GeoNames/license notices and authoritative crosswalk provenance. Never substitute nearest city for verified GPS boundary | Multi-state/district/radius regression, canonical IDs stable, unresolved districts remain explicit |

Use expand/contract: release compatible server fields first, test old mobile reads/writes, release new app, monitor and only later remove deprecated paths after approved adoption window. Financial/history writes must be compensating events, not deletes during rollback. Data backups and restore drills require separate approval and environment readiness; none was performed during L0.

## Risks and minimum corrective actions

| ID | Priority / risk | Evidence / impact | Minimal control and phase | Owner / status |
| --- | --- | --- | --- | --- |
| R01 | P0 lost uncommitted product | 64 tracked modifications,346 untracked at L0; applied V8–V12 source currently untracked | Reviewed full checkpoint including untracked/needed ignored files; no reset/clean/stash as shortcut, L1 | Engineering lead / awaiting checkpoint approval |
| R02 | P0 database evidence stale | Container stopped; latest preservation evidence Oct13 | Approved read-only current check then consistent backup+clone restore before migration | Data steward / BLOCKED current-state verification |
| R03 | P1 reference adaptation decisions | Actual supplied image saved at docs/reference/crewza/crewza-16-screens.png; all16screens reviewed, byte identity verified | Missing-image blocker cleared. Approve adapted Labourly navigation/type/layout and explicit auth/video/wallet scope; image does not prove motion or functionality | Product/design / image review complete, product decisions pending |
| R04 | P0 misleading price/trust | Worker profile static4.9(120),500/day alert-only CTA; synthetic badge source | Replace with real/empty states and approved hire contract; never imply KYC; L1–L3 | Product/backend/mobile / confirmed gap |
| R05 | P0 production authentication unavailable | ProductionOtpProvider throws503 | Approved SMS provider, threat/abuse tests and dev isolation; L1 | Security/backend / pending |
| R06 | P0 unknown vulnerabilities | Backend UNASSESSED; historical JS high/critical advisories | Reliable official-data scan/reachability and compatible remediation; signed artifact evidence; L1/L5 | Security / unresolved, no secure claim |
| R07 | P0 package/signing break | Display name coupled mistakenly to application identity | Retain ID/keys by default; explicit migration decision and in-place update tests | Release owner / approval required |
| R08 | P0 unsafe team reservations | Team fields/base tables do not implement assigned-member capacity | Define roster/consent/substitution and per-person locking/exclusion; L3 | Product/backend / D06 pending |
| R09 | P0 monetary harm | No payment ledger/provider; policies unknown | Approve model/provider/legal review before schema; idempotent signed events, reconciled accounting; L4 | Finance/security/backend / D08 pending |
| R10 | P1 phone/chat abuse | No communication authorization/retention contract | Define access/masking/block/report; scope realtime and media; L4 | Product/privacy / D07 pending |
| R11 | P1 geographic ambiguity | GPS radius-only; unresolved catalogue districts; radius does not prove jurisdiction | Manual canonical fallback, explicit labels, shared eligibility; verified boundary service only if approved | Location/backend / known limitation |
| R12 | P1 lifecycle disagreement | Enum states not full completion/attendance/dispute operation; cancellation doesn't reopen jobs | Approve lifecycle/fees/no-show/repost contract, append audit records and test state transitions; L3 | Product/operations / D10 pending |
| R13 | P1 lost/duplicate notifications | Capped broadcast/broad catch; no durable push/outbox | Event IDs/outbox/retry/dead-letter, token cleanup/consent and physical testing; L3–L4 | Backend/mobile/ops / pending |
| R14 | P0 insecure operations | Admin shell only; no real moderation/verification/finance workflows | Server permission matrix, scoped admin accounts, audit reasons, sensitive-action reauth; L1/L3/L4 | Operations/security / pending |
| R15 | P1 inaccessible palette use | Yellow-white1.51:1; grey-white1.24:1 | Charcoal labels/outlines, text+icon status,200% font/TalkBack; L1/L5 | Design/mobile / specification ready |
| R16 | P1 test evidence overclaim | Old milestone says93/inactive backend; later report94, partial native | Pin source+artifact+date; close native gaps, reconcile evidence before any freeze; L1/L5 | QA / pending |
| R17 | P1 runtime/build constraints | Restricted network, low RAM/emulator ANR, existing Windows SDK path workarounds | Offline caches/trusted sources, bounded downloads, device/load test plan; no toolchain/security reset | Engineering/release / ongoing |
| R18 | P0 data/privacy compliance gap | KYC/media/communication/money increase sensitive data | Approved data map, consent/retention/deletion and operational access before external integration; do not claim compliance from this plan | Privacy/product / review required |
| R19 | P1 scope silently cut | 16customer screens plus worker/team/admin beyondreference | All required backlog rows launch-blocking; explicit approval required for any reduction | Product / no reduction approved |
| R20 | P1 apparent team/rating/availability support | Tables, enums, fixture labels and global AVAILABLE can mislead | Acceptance requires working API+UI+data; schedule-specific eligibility distinct from global availability | QA/product / documented |

## Approval boundaries

Approve checkpoint/branch, design/reference and business contracts before L1. Provider accounts, financial services, signing changes, production deployment and paid services each require explicit approval. No P0/P1 risk is waived by accepting this planning document. Required public-launch features remain required even when scheduled in later phases. Optional visual polish may be removed without removing functional scope; other scope changes must be recorded and approved.

**L0 complete as documentation; no migration executed.**
