# B1.5 isolated PostgreSQL verification — 2026-10-28

Result: **12 passed, 0 failures, 0 errors, 0 skipped.** Single execution; no populated-database rerun.

## Isolation and identity
Container: labourly-otp-b15-20261027
Container ID: 6b0b5ea1a5f9e25af2dd019304de3e51405f597efb594986fc8e391184a5055e
New volume: labourly-otp-b15-20261027-data
Image ID/digest: sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6
Image PGDATA and sole data mount: /var/lib/postgresql/data
Database: labourly_otp_test_b15_20261027
Role: otp_fixture
JDBC: jdbc:postgresql://127.0.0.1:55484/labourly_otp_test_b15_20261027
PostgreSQL: 17.5. Host publication exclusively 127.0.0.1:55484.
Container/volume/port absence verified before creation. Mount/image/label/port verified before startup. Database created from template0. Exact DB/user verified through psql and JDBC; public relations/routines/types all zero before migration.
No connection to nammacrew; no existing volume mounted. No normal backend restart.

## Commands executed
Approved docker image inspect, container/volume list and host port checks; docker create pinned to the above image with a new named volume and loopback publication; selected-field docker inspect; docker start; bounded pg_isready; createdb --template=template0 --owner=otp_fixture labourly_otp_test_b15_20261027; psql -X -v ON_ERROR_STOP=1 identity/schema-count queries. Exact command forms are in LABOURLY_P1_8_B1_5_VERIFICATION_PROPOSAL.md.
Only selected test class executed from backend with local JDK 21:

    ./mvnw.cmd -o test '-Dtest=OtpDeliveryPersistenceIT' '-DfailIfNoTests=true'

Dedicated LABOURLY_OTP_TEST_* variables supplied the exact URL/user and disposable random password. Prior process environment restored in finally. No password printed or persisted in reports; Docker metadata still contains the disposable password, accessible to local Docker administrators. Container and volume retained pending separately approved cleanup.

## Migrations and assertions
V1–V14 applied successfully to an empty disposable schema; Flyway validate passed after migration. Initial CLOSED state verified before fixture setup. All 14 successful versions, ten named V14 indexes (valid/ready), and the invalidation constraint were asserted.
No unexpected SQL/migration failure occurred.
Expected failures were verified precisely: 23505 otp_outbox_request_key_idx; 23505 otp_sms_attempts_outbox_id_attempt_no_key; 23514 otp_invalidation_pair; 23514 otp_sms_outbox_check. Domain guards asserted exact IllegalStateException type/messages rather than arbitrary RuntimeException.

## Individual scenarios
| Scenario | Result | Seconds |
|---|---|---|
| claimLeaseRecoveryChangesFence | PASS | 1.099 |
| restrictedDispatchCountsNormalHistory | PASS | 1.315 |
| callbackDeduplicationAndCleanupOrdering | PASS | 0.746 |
| concurrentPhoneCooldown | PASS | 0.183 |
| fencingAndUnknownNeverResent | PASS | 0.652 |
| migrationsAndClosedDefaultConstraint | PASS | 0.186 |
| retryRequiresDefiniteNonAcceptanceAndHasCeiling | PASS | 1.044 |
| atomicRollbackOnUniqueBinding | PASS | 0.469 |
| expiredSendingLeaseQuarantinesAndErasesCiphertext | PASS | 0.519 |
| globalAdmissionCountsExistingHistory | PASS | 2.968 |
| constraintPairsAndAttemptUniqueness | PASS | 0.372 |
| callbackDedupeSurvivesAttemptRetentionPurge | PASS | 0.616 |

Concurrent same-phone requests admitted exactly one operation. Unique-binding rejection left only one challenge/outbox, demonstrating transaction rollback. Stale fences and duplicate STARTED were rejected. Global and restricted dispatch limits counted prior history. UNKNOWN resisted retry and lease-expired SENDING erased payloads. Retry ceiling, callback dedupe and child-first cleanup passed the selected scenarios. This is bounded integration evidence, not exhaustive load/crash testing.

## Changes and evidence
Only approved test-source corrections in backend/src/test/java/in/nammacrew/auth/persistence/OtpDeliveryPersistenceIT.java; no application source or migration modifications in B1.5.
Reports: this file and the B1.5 status/proposal documents.
Compilation/targeted formatting completed before execution. Existing MockBean deprecation warnings remain.
Raw local log: stage-b15-integration.log. Sanitized individual results: this report. Surefire XML/text remain in backend/target/surefire-reports; XML may include process environment/properties, so do not publish raw XML without redaction.
Maven BUILD SUCCESS, 1 minute 12 seconds; test class 20.65 seconds.

## Remaining gates
Real Redis Lua admission, distributed replay/TTL/restart/loss recovery and readiness remain B2. Existing OTP verifier still ignores invalidation metadata; do not wire the new workflow until it is fixed and tested under separate authorization. Provider callbacks, dispatch orchestration, key custody and production SMS are not proven or activated. No production-readiness claim.
No cleanup, Git write, deployment, Redis, provider, mobile or Android action performed. STOP at review gate.
