# Labourly P2 reliability hardening review — 2 November 2026

Status: PASS for this scoped development hardening gate; stop for review. This is not public-release approval.

## Scope and preservation

Branch: `main` (the actual branch at inspection). Existing working changes were preserved; the initial inventory is `.tools/p2-status-before.txt`. No commit, push, deployment, paid service, provider activation, normal backend restart, native build, or mobile production-code change was performed.

All PostgreSQL execution uses Testcontainers (`postgis/postgis:17-3.5`), either `jdbc:tc:` test URLs or the container's generated JDBC URL. The normal development database was not connected to. Protected records therefore were not queried or modified; this is preservation by isolation, not a newly executed production-record comparison. Migration source hashes before/after are in `.tools/p2-migration-before.csv` and `.tools/p2-migration-after.csv`; V1–V19 are unchanged.

## Model boundaries recorded before fixes

- START is allowed only at/after the booking's scheduled start, with two distinct quotation-derived participants confirming.
- COMPLETE is allowed after IN_PROGRESS, with both participants confirming. There is no scheduled-end-time restriction. Early mutually agreed completion is supported; completion before START is rejected. This policy was preserved.
- Booking dates and identity are immutable under the existing V7 database trigger. In-place rescheduling is unsupported. Cancellation/rebooking creates a separate booking identity; confirmations cannot silently carry over.
- Historical request-backed bookings have no quotation-derived participants. The lifecycle service denies access rather than inferring them. A compatible historical-booking workflow needs a separate decision.
- Cancellation remains restricted to CONFIRMED. Disputes/cancellation after work starts require support; no new policy was invented.
- Blocking is per conversation, not an account-wide ban. Unblock deletes only the requesting participant's block.
- Reports use the existing support intake. Another distinct report while an open support request exists returns a visible conflict; it is not silently accepted.
- Client message retry keys survive a failed send in the mounted chat only. They do not provide exactly-once delivery across app termination. Older clients without a key retain ordinary send semantics.

## Reproduced defects and narrow fixes

1. Lifecycle notifications fired on the first vote even though booking status had not transitioned. Tests expecting transition-only notifications failed (three assertions). The service now inserts exactly two BOOKING_UPDATED notifications only when both confirmations transition the status. Inserts share the booking transaction; rollback removes both. First-confirmation state remains visible through the lifecycle API/polling, without a notification prompt.
2. A stored-message replay returned sender label `Me`, whereas the first response returned the participant's display name. The replay assertion failed. New sends and replays now share sender-name resolution. The display name remains current profile data, not an immutable historical identity snapshot.

No migrations, authorization rules, rate limits, or marketplace contracts were changed.

## Verification matrix

| Requirement | Evidence / boundary |
|---|---|
| Two-party START and COMPLETE; duplicate confirmation | `twoParticipantsMustConfirmEachStage`; four votes total and four transition notifications across both stages |
| Concurrent START confirmations | `simultaneousConfirmationsTransitionOnce` |
| Concurrent confirmation/cancellation | `concurrentCancelAndSecondConfirmationHaveOneWinner`; one winner, final state agrees with winner, no invalid merged state |
| Cancelled booking cannot restart | `cancellationAfterOneConfirmationPreventsStart` |
| Premature START / COMPLETE; outsider denied | `futureBookingCannotStart`, `outsidersAndPrematureCompletionCannotMutate` |
| Rescheduling / stale votes | `scheduledDatesCannotChangeAndReuseVotes`; database rejects date change |
| Historical authorization | `historicalRequestBookingCannotInferLifecycleParticipants`; customer, worker and outsider all denied, zero votes |
| Committed, nonduplicate notifications | `onlyCommittedTransitionsNotifyAndRollbackLeavesNoVotes`; explicit outer rollback, safe retry, two notifications |
| Same key/body replay; mismatched body | `concurrentMessageRetryCreatesOneMessage` and `replayPreservesSenderLabelAndIsAllowedAfterBlockWithoutNewMessage` |
| Sender-scoped keys and legacy sends | `retryKeysAreSenderScopedAndLegacySendsStillWork`; separate sender records, separate legacy sends |
| Outsiders denied messages/block/report | `messageIsVisibleToBothParticipantsButNotOtherAccounts`, `reportsArePrivateAndUnauthorizedActionsRejected` |
| Both-way block and own-only unblock | `blockingStopsNewMessagesButPreservesHistoryAndOwnUnblock` |
| Committed replay after block creates no row | `replayPreservesSenderLabelAndIsAllowedAfterBlockWithoutNewMessage` |
| Concurrent send/block | `concurrentSendAndBlockSerializeWithoutPostBlockInsert`; either send wins before block or is rejected, subsequent sends denied in both directions |
| Failed report visible, draft preserved, retry | Existing mobile `chat-safety.test.tsx` component test |
| Failed confirmation retry and pending second vote | Existing mobile `booking-lifecycle.test.tsx` component tests |
| V17 → V18/V19 upgrade | `v17ChatAndHistoricalBookingSurviveV18AndV19`; entire historical booking row unchanged, old chat retained with null retry key, no inferred votes, legacy insert still accepted |
| SQL invariants | Same migration test: duplicate message key and vote rejected (23505); nonexistent block thread and vote booking rejected (23503). FKs establish record existence; participant authorization remains a service responsibility |

Controller inspection: lifecycle/chat/safety routes require CUSTOMER or WORKER and derive actor IDs from the authenticated principal, not a request-body user ID. New adversarial tests exercise actual transactional services against PostgreSQL; they are not new HTTP-controller or native-device acceptance tests. Existing selected authentication tests exercise their own HTTP flows.

## Runs and evidence

| Gate | Result | Exit code | Evidence |
|---|---|---|---|
| Consolidated selected backend suite | 66 passed, 0 failures, 0 errors, 0 skipped; Maven 1 min 55 s | 0 | `.tools/p2-backend-consolidated.log` |
| Backend Spotless | Passed (116 Java files considered; cache used) | 0 | `.tools/p2-backend-format.log` |
| Full mobile Jest | 221 passed / 39 suites, 0 failed; 106.144 s | 0 | `.tools/p2-mobile-tests.log` |
| Mobile TypeScript | Passed | 0 | `.tools/p2-mobile-types.log` |
| Mobile ESLint | Passed | 0 | `.tools/p2-mobile-lint.log` |
| Mobile Prettier | Passed | 0 | `.tools/p2-mobile-format.log` |

Backend breakdown from the single consolidated invocation: AuthenticationIT 17, GoogleAuthIT 8, MigrationIT 5, BookingLifecycleIT 9, ChatConcurrencyIT 8, QuotationConcurrencyIT 4, QuotationIT 6, NotificationIT 9. This is **not the entire backend suite** and is **not an accumulated rerun total**. Eight new adversarial/migration tests were added (four lifecycle, three chat, one migration); the existing lifecycle notification-count assertion was updated to the explicitly requested transition-only behavior.

Nonfatal warnings remain: Mockito dynamic agent attachment and JVM class-data-sharing warnings; mobile React `act(...)` warnings in discovery/chat/Action components and the reduced-motion test environment. These were preserved, not suppressed. ESLint and TypeScript emitted no diagnostic warnings. Native and real-device acceptance were NOT RUN.

Concurrency tests launch independent transactional calls behind barriers and assert persisted outcomes. A passing finite race run is not an exhaustive proof of all interleavings or a load test; serialization is additionally supported by inspected shared row locks. No production throughput/reliability claim is made.

First test-first run: 16 tests, 4 failures, 0 errors, 0 skipped; Maven exit 1. Failures reproduce the two defects above. Retained `.tools/p2-adversarial-before.log` and individual XML/text reports in `.tools/p2-first-failure-evidence/`. These failures are not erased or counted as successful coverage.

Backend command (Java 21, offline Maven):

```text
./mvnw.cmd -o test -Dtest=BookingLifecycleIT,ChatConcurrencyIT,MigrationIT,QuotationIT,QuotationConcurrencyIT,NotificationIT,AuthenticationIT,GoogleAuthIT -DfailIfNoTests=true
./mvnw.cmd -o spotless:check
```

Mobile commands: `node node_modules/jest/bin/jest.js --runInBand`, `npm run typecheck`, `npm run lint`, `npm run format:check`.

## Exact changed files for this review

- `backend/src/main/java/in/nammacrew/booking/BookingLifecycleService.java`
- `backend/src/main/java/in/nammacrew/chat/ChatService.java`
- `backend/src/test/java/in/nammacrew/booking/BookingLifecycleIT.java`
- `backend/src/test/java/in/nammacrew/chat/ChatConcurrencyIT.java`
- `backend/src/test/java/in/nammacrew/auth/MigrationIT.java`
- `docs/LABOURLY_P2_RELIABILITY_HARDENING_20261102.md`

Private/generated logs, snapshots, and Surefire artifacts are listed separately above; unrelated pre-existing changes are not attributed to this review.

## Risk register and next recommended order

| Priority | Remaining risk / limitation | Next action |
|---|---|---|
| P1 | Reports are intake, not a staffed moderation process; a second distinct incident can be blocked by the existing open-support limit | Define operator ownership and incident escalation before public launch; then design additive multi-incident intake if needed |
| P1 | Cancellation notification code catches exceptions; broader notification guarantees have not been proven by fault injection | Review cancellation failure semantics and durable delivery separately; no broad changes in this task |
| P1 | No real-device/network-loss or process-death acceptance in this review | Exercise customer and worker flows against a disposable environment before release |
| P2 | Historical request-backed lifecycle unsupported; in-progress cancellation/dispute policy undefined | Approve explicit policies before implementing additional transitions |
| P2 | Chat retry identifier is memory-only; old clients can send duplicates on retry | Define persistent pending-send UX and storage/retention before extending retries; never promise exactly-once transport |
| P2 | Participant membership is checked in services, not enforced by V18/V19 FKs | Keep database writes restricted to trusted application paths; separately evaluate stronger DB invariants if new writers are introduced |
| P2 | Current-state GETs use separate queries; concurrent updates can make a polled snapshot temporarily stale | Mutations remain authoritative under locks; add snapshot-specific concurrency tests if strict read consistency is required |

Order: review these narrow fixes → approve lifecycle/support policies → native two-account acceptance and network-loss tests → durable delivery/retry design. Background push, SMS, provider accounts and deployment remain outside this gate.
