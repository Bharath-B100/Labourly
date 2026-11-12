# P1.7 Stage A â€” Provider-independent OTP foundation

Date: 2026-10-27. Status: implementation review gate; production delivery remains DISABLED.
No activation, infrastructure startup, provider credentials, migrations, dependency changes or Git operations.

## Architecture-to-code mapping and exact new files

All Java paths below are relative to backend/src/main/java/in/nammacrew/auth/foundation/.

| File | ADR R2 responsibility |
|---|---|
| OtpPolicy.java | Immutable explicitly supplied gate/dimension/window/cap policy; version, bounds, uniqueness and defensive-copy validation. No configured/default policy is activated. |
| RedisLimiter.java | Bundled Lua resource and strict fail-closed result parsing; no Redis client. |
| AdmissionDecision.java | Pure rolling-window decision oracle, exact expiry boundary and lowered-cap retry rank; not a second active limiter. |
| DeliveryRules.java | State transitions, retryable definitely-not-sent attempt history, three-attempt ceiling, UNKNOWN exclusion, owner/fence/generation/lease/expiry predicates, concurrent single-use local send permit. |
| SmsAdapter.java | Provider-independent send outcomes, lookup and authenticated callback contracts; redacted string representations. No provider implementation or Spring bean. |
| OtpCipher.java | AES-256-GCM, random 96-bit nonce, 128-bit tag, explicit key resolver, defensive envelope copies, generic failures. No key defaults or production keys. |
| OtpContext.java | Versioned canonical AAD binding delivery, challenge, provider, template version and expiry. |
| IdempotencyDecision.java | Pure optional-key admission/replay decisions; stale new keys and expired/superseded/verified/locked/failed bindings reject. Replay acknowledgement never authorizes another send. |
| RecoveryPolicy.java | Explicit CLOSED/RESTRICTED/NORMAL recovery models, generation and operator approval, durable-history prerequisite, 24-hour closed recovery and fixed one-hour restricted approval ceiling; dispatch cap selection. |

Other new files:
- backend/src/main/resources/otp/admit.lua
- backend/src/test/java/in/nammacrew/auth/foundation/OtpFoundationTest.java
- backend/src/test/java/in/nammacrew/auth/foundation/AdmissionDecisionTest.java
- docs/LABOURLY_P1_7_STAGE_A_REPORT.md (this report)

The test fake implements SmsAdapter with configured outcomes and a call counter; it performs no I/O and rejects unauthenticated callbacks. Test encryption uses fictional in-memory keys only.

## Redis contract

KEYS: approved generation/policy/mode readiness token, operation cache, monotonic clock watermark, unique same-slot window keys.
ARGV: exact readiness token, complete-input binding digest, server operation UUID, immutable deadline, then window/cap pairs.
Gate, version, generation and HMAC subject identity must be bound into canonical keys and input digest by the future trusted caller. Public clients must not construct them.

The script validates arguments/types/TTL, checks Redis TIME and watermark, refuses absent readiness or partial operation state, evaluates every rolling window before charging, caches ALLOW/DENY to the original deadline, and does not renew quota/cache TTL on denial/replay. Window entries expire at the exact lower boundary. A lowered cap uses rank count-cap. Generation and clock-control keys require durable operator-managed initialization, never automatic startup creation.

Important limits:
- No real Lua interpreter/Redis execution occurred. Resource checks and Java oracle tests do NOT establish Lua runtime correctness or distributed atomicity.
- Redis scripts do not roll back partial writes on runtime errors. Stage B must fail closed on timeout/error and close admission on suspected partial state.
- Missing individual quota keys cannot distinguish first use from lost history. External restart/eviction monitoring, durable recovery controls and PostgreSQL phone/dispatch caps remain mandatory.
- A cached ALLOW authorizes the same logical operation only. PostgreSQL uniqueness and transactional fencing are not implemented here.
- Inputs must use one stable policy/generation and Redis cluster slot. Gateway cardinality bounds and 200ms caller budget remain integration responsibilities.

## Compatibility

No existing controllers, AuthService, repositories, JWT/refresh/session logic, providers, application configuration, pom.xml or migrations changed.
New classes have no Spring component annotations, startup hooks or callers in authentication.
ProductionOtpProvider still throws 503. Existing development OTP and production-isolation tests are included.
Pre-existing mobile edits, prior OtpSecurityTest and other reports were left intact.
No database was accessed; protected-record comparison was NOT RUN, rather than asserted from a database read.

## Verification

Commands, from backend with the existing local JDK 21:
- mvnw.cmd -o -DspotlessFiles=.*foundation.* spotless:apply
- mvnw.cmd -o test -Dtest=OtpFoundationTest,AdmissionDecisionTest,OtpSecurityTest,SecurityTest,BookingStateTest spotless:check

Final result: **64 tests passed, 0 failures, 0 errors, 0 skipped**.
- OtpFoundationTest: 41
- AdmissionDecisionTest: 4
- OtpSecurityTest (existing): 15
- SecurityTest (existing): 3
- BookingStateTest (existing): 1

Full backend Spotless check: **84 Java files clean, 0 requiring changes**.
Final run duration: 18.303 seconds. Local raw log: stage-a-verified.log (ignored local evidence); XML evidence: backend/target/surefire-reports/TEST-*.xml.
Compiler and Java 21 enforcement passed. Maven test compilation includes integration-test sources but Surefire selects only the named database-free tests; no integration test was executed.

Coverage includes policy immutability/malformed limits, UNKNOWN transition table and attempt quarantine, retry ceiling, stale fencing/lease/expiry boundaries, concurrent single-use permits and paused permits, replay states/time boundaries, recovery approval/generation/history, authenticated encryption/tampering/redaction, canonical context, fake outcomes, fail-closed limiter results, rolling multi-window denial and expiry/rank decisions.

Warnings: existing Spring MockBean deprecations, Mockito dynamic-agent/self-attachment warning and JVM class-sharing warning. No warnings were suppressed. No dedicated static-analysis plugin is configured beyond compiler/Java-version enforcement and formatting.

## Stage B dependencies and unresolved decisions

1. Approve isolated Redis/PostgreSQL integration and additive schema work separately. Implement durable outbox, attempt ledger, uniqueness, phone locks and atomic fencing with the same predicates.
2. Execute real Lua tests: simultaneous admission, operation replay/binding collision, TTL nonrenewal, Redis restart/eviction, partial key loss, clock regression, runtime error/timeout and cluster-slot behavior. Current resource/oracle tests are not this proof.
3. Wire full approved numeric policies (including phone/IP/combined ingress/verification), trusted key derivation and digest, readiness generation, durable recovery quotas and monitoring. RecoveryPolicy models dispatch caps only; it does not enforce phone/verification budgets or activate recovery.
4. Implement expiry/reconciliation worker behavior and transaction guards. State transition permission is necessary, not sufficient: SENDING to RETRY_WAIT requires proven retryable nonacceptance and durable attempt updates. UNKNOWN must never be routed back to dispatch, including after lookup absence.
5. Review the final-check pause gap: an in-process single-use permit cannot prevent an indefinitely paused worker from resuming after a DB check. Provider-side guarantees are still provisional; no exactly-once claim.
6. Implement 48-hour public-idempotency binding retention and caller identity/request matching in PostgreSQL. Existing replay model assumes the caller supplied an authorized matching binding. No public header or mobile UX change has been activated.
7. Approve key custody, rotation, deletion, backup retention and restoration. Current key abstraction expects exportable 32-byte AES material; a non-exportable KMS/HSM implementation requires a separate reviewed abstraction. Do not generate fallback keys.
8. MSG91 remains provisional; API, callback authentication/replay, lookup semantics and idempotency evidence must be confirmed before adapter work. Twilio remains an alternative, not automatic failover.
9. Provider contract tests precede any explicitly approved live SMS activation. Production remains unavailable meanwhile.

Recommendation: review Stage A foundations only. NOT production OTP readiness; no authorization to start Stage B is assumed.
