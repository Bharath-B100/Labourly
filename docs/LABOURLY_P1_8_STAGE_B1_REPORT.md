# P1.8 Stage B1 � persistence foundation

## Preflight and key custody (before implementation)
Repository latest migration: V13. Proposed additive V14; historical migrations remain untouched.
Existing otp_challenges has a BCrypt code_hash, attempts, verified and expiry; nullable invalidation metadata is additive.
Existing auth uses pg_advisory_xact_lock(hashtextextended(phone,0)); persistence must use exactly the same phone lock.
Existing request provider call runs inside its transaction; this stage does not alter or call that path.
Existing verifier does not understand invalidation metadata. New persistence must remain unwired until a separately reviewed authentication integration.

Stage A OtpCipher.Keys supplies exportable 256-bit AES data keys by version. This supports the ADR's managed-secret-manager custody with in-process AES-GCM. It does NOT implement non-exportable KMS encryption or envelope encryption. No abstraction change, production key retrieval, generation, default/fallback keys or credentials is introduced. Repository accepts a validated encrypted Envelope, immutable context and BCrypt hash; encryption occurs outside its transaction. It never receives an OTP plaintext or cipher/key resolver.
Production custody/IAM/rotation approvals remain prerequisites for activation.

Migration risk: additive DDL takes locks on otp_challenges and index creation can block writes; apply only in an approved migration window, not this task. Flyway would discover V14 on a future ordinary startup, so do not restart against an existing database without migration approval. Roll back deployment by keeping new code unwired, not by dropping retained outbox/attempt evidence. A restore/forward-fix plan is required if V14 has been applied. No migration is applied in this task.

## Exact files added by this stage
1. backend/src/main/resources/db/migration/V14__otp_delivery_persistence.sql
2. backend/src/main/java/in/nammacrew/auth/persistence/OtpDeliveryStore.java
3. backend/src/test/java/in/nammacrew/auth/persistence/OtpDeliveryStoreTest.java
4. backend/src/test/java/in/nammacrew/auth/persistence/OtpDeliveryPersistenceIT.java
5. docs/LABOURLY_P1_8_STAGE_B1_REPORT.md

Existing Stage A, OtpSecurityTest, mobile changes and other untracked evidence predate this task and were preserved. No tracked backend source or historical migration was edited.

## Schema and persistence architecture
V14 adds nullable invalidation time/reason to otp_challenges, a timestamp index and four tables:
- otp_sms_outbox: one encrypted delivery intent per challenge, unique optional request HMAC, immutable context references, nonce/key version, expiry, claim owner/lease/fence/generation, bounded attempt count and polling indexes.
- otp_sms_attempts: durable STARTED accounting, unique job/attempt number and provider/message ID, retryability restricted to DEFINITELY_NOT_SENT.
- otp_sms_callback_events: normalized authenticated inbox, unique provider/dedupe hash, nullable attempt link and unresolved lookup index. No raw callback body, OTP or phone.
- otp_operational_control: singleton CLOSED by default, generation, mode, approval/quiescence timestamps and restricted lease. Repository exposes no operation to open recovery.

The store is explicitly constructed, without Spring annotations or scheduler. Every write uses an explicit REQUIRES_NEW READ_COMMITTED transaction, allowing rollback even without a Spring proxy; future callers must understand that it owns its transaction rather than nesting it inside an auth transaction.

Admission acquires the existing phone advisory lock then a separate shared global budget lock, checks durable recovery mode/generation, enforces phone 1/60s, 3/15m, 6/h, 10/day and normal global 100/min, 1000/h, 5000/day (restricted 10/min, 50/h, 100/day), cancels unsent prior jobs and inserts challenge plus encrypted intent atomically. Counts include existing challenge history, with exclusive lower time boundaries and conservative inclusion of future timestamps.
Unique request binding violations roll back the entire transaction; the existing HTTP API is not mapped to this new repository and receives no new replay behavior.

Candidate discovery does not grant a lease. Claim rechecks challenge/currentness/history under locks; STARTED insertion rechecks owner, fence, generation, 10-second lease margin, 15-second expiry margin and durable global dispatch history. DB time is refreshed after potentially blocking lock acquisition. STARTED and SENDING commit together. No provider/HTTP transport is invoked.
Stage A DeliveryRules supplies retry history, permit and transition rules. UNKNOWN cannot become sendable. Lease loss after STARTED quarantines the attempt and erases ciphertext. Only a proven retryable DEFINITELY_NOT_SENT outcome can return a job to RETRY_WAIT, with a three-attempt ceiling. Late accepted results may resolve UNKNOWN; negative lookup/results cannot authorize retry.

Cleanup has no scheduled caller. A bounded sweep erases expired payloads and recovers expired pre-send claims. Metadata purge selects only old outbox-owned terminal records, at least 48 hours after expiry. Callback dedupe is retained seven days; unresolved unlinked orphans expire after 24 hours. Before attempts are purged, retained callback links are detached and marked processed for retention purposes. Children are removed before outbox and its challenge. Legacy challenges, user/customer/worker/session/booking tables are not cleanup targets. This is implemented ordering, not database-tested proof.

## Verification
Database-free command (existing local JDK 21; backend directory):
mvnw.cmd -o test -Dtest=OtpDeliveryStoreTest,OtpFoundationTest,AdmissionDecisionTest,OtpSecurityTest,SecurityTest,BookingStateTest spotless:check

Formatting apply was restricted to the new persistence package. Full formatting check runs separately without that filter.
Initial formatter attempt found invalid Java regex escaping before tests; corrected. Intermediate runs passed 69 tests. Final verification: **69 tests passed, 0 failures, 0 errors, 0 skipped**:
- New OtpDeliveryStoreTest: 5
- Stage A OtpFoundationTest: 41
- Stage A AdmissionDecisionTest: 4
- Existing OtpSecurityTest: 15
- Existing SecurityTest: 3
- Existing BookingStateTest: 1

Full Spotless: **87 Java files clean**. Java 21 enforcement and compilation passed, including compilation of the 12 unexecuted integration scenarios. Final run: 16.860 seconds.
SQL was reviewed only; the final additional retention/foreign-key lookup indexes have not been executed, just like the rest of V14.
Local evidence: stage-b1-verified.log and backend/target/surefire-reports. Logs are ignored local artifacts, not committed.
Existing compiler MockBean deprecation and Mockito/JVM agent/class-sharing warnings remain; none suppressed.
No Docker, Redis, PostgreSQL, Testcontainers, HTTP server, Android tools or SMS were started.

### Integration tests — NOT RUN
OtpDeliveryPersistenceIT compiles, but was excluded from the unit test command. It has no Testcontainers or service startup.
Explicit approval environment flag, a localhost JDBC URL with database name labourly_otp_test_*, credentials and an EMPTY public schema are required before it applies V1–V14. It refuses a populated database; no Flyway clean or database creation is included. Do not set this flag or execute it until separately authorized.

Twelve prepared scenarios:
1. Migration head V14 and CLOSED mode denies admission.
2. Unique request binding failure rolls back both challenge and outbox.
3. Concurrent same-phone enqueue admits exactly one under cooldown.
4. Stale fence, duplicate STARTED, UNKNOWN quarantine and negative-result non-resend.
5. Expired pre-send claim is reclaimed with a higher fence.
6. Normal global admission includes pre-existing durable challenge history.
7. Restricted dispatch includes earlier normal-history attempts.
8. Callback deduplication and child-first retention purge.
9. Expired SENDING lease becomes UNKNOWN and destroys ciphertext.
10. Invalidation pair, payload pair and attempt uniqueness constraints.
11. Retry ceiling of three on definitive nonacceptance.
12. Seven-day callback dedupe survives attempt/outbox deletion.

Actual migrations, SQL execution, transaction rollback, multi-connection locking, constraint enforcement and cleanup remain UNVERIFIED until these tests run. The mocked rollback unit test is not a substitute.

## Security, compatibility and remaining risks
- ProductionOtpProvider, existing endpoints, JWT, refresh/logout, dev OTP and account routing are unchanged. Production delivery remains HTTP 503.
- Existing verifier ignores invalidation metadata. Do not wire the store to it or allow mixed old/new auth writers before a reviewed rollout/drain and verification update.
- Repository checks durable mode only. It intentionally cannot prove Redis readiness/history, IP admission, circuit health, trusted ingress or operator identities. Stage B2 must gate calls with these independent controls; no caller exists today.
- Encrypted Envelope authenticity/context binding is the trusted enqueue caller's responsibility. Repository validates shape and receives only a BCrypt-shaped hash; it cannot prove that callers actually hashed/encrypted a code. Future integration must use OtpCipher with matching OtpContext and suppress parameter/raw SQL/provider-body logging.
- No production key resolution, generation or fallback. Non-exportable KMS/envelope encryption would need separate abstraction/schema approval.
- Callback authentication is a caller contract, not inferred from its enum. This stage provides deduplicated storage, not a public callback endpoint, signature verification or receipt reconciliation worker.
- CLOSED initial control has no auto-promotion. Future operations must supply dual-approved recovery evidence; the repository cannot validate external approval identities.
- No claim of exactly-once SMS or prevention of a paused process sending late. The local single-use permit, transport deadlines, no automatic retries and provider guarantees remain dispatch-integration requirements.
- SQL NULL does not erase backups/WAL. Retention scheduling (including the 60-second ciphertext purge target), key rotation, backup retention, bounded worker execution and aggregate monitoring remain unactivated.
- Global advisory locking prioritizes correctness over throughput; load/lock-timeout and deadlock/failure-injection testing remain necessary.
- No live protected-record query was performed: no database access was authorized. No operation touched protected records.

## Remaining Stage B2 dependencies
Approve isolated PostgreSQL execution first and resolve any migration/concurrency failures. Then separately implement/test real Redis Lua admission, same-slot key binding, timeouts, replay/TTL and quota-loss recovery. Add trusted readiness proof and verification budgets without treating durable phone/dispatch counters as IP protection.
Provider adapters, callback authentication/reconciliation, dispatcher orchestration, production secret custody, optional public idempotency/mobile wording, production authentication activation and live SMS remain separately gated.

Recommendation: persistence implementation is ready for code review and authorized disposable-database testing; database verification and production activation remain BLOCKED. Stop at this review gate.
