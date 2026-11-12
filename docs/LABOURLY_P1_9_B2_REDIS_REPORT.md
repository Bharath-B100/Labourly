# P1.9 B2 Redis admission foundation — 2026-10-28

## Preflight
Branch main; pre-existing mobile and Stage A/B1/B1.5 work preserved. ADR R2 sections 16.1–16.4 and preceding stage reports reviewed.
Host snapshot: 16,437,396 KiB total, 3,228,860 KiB available (~3.1 GiB). No local Redis image, redis-cli or cached Lettuce/Jedis found. No dependencies downloaded; no Docker/Redis/database startup or database access. Preserved B1.5 resources not altered.

## Exact new files
- backend/src/main/java/in/nammacrew/auth/redis/OtpAdmission.java
- backend/src/main/java/in/nammacrew/auth/redis/LoopbackRedisTransport.java
- backend/src/test/java/in/nammacrew/auth/redis/OtpAdmissionTest.java
- backend/src/test/java/in/nammacrew/auth/redis/RedisAdmissionIT.java
- docs/LABOURLY_P1_9_B2_REDIS_REPORT.md

Existing RedisLimiter, admit.lua, OtpPolicy and RecoveryPolicy remain reused unchanged. No migration, dependency, mobile or authentication controller change.

## Architecture
OtpAdmission is explicitly constructed, has no Spring annotations or default activation. A transport receives the existing Lua and complete immutable operation. Each new operation receives a server UUID and fixed 60-second deadline. Replay reuses the same object/keys/arguments. Binding hashes the sorted complete policy, generation, mode, keys, limits and deadline. Quota keys do not change for capacity/version-only changes, avoiding quota resets; readiness token does change and must be operator-managed.
Phone uses strict canonical international form. IP accepts an InetAddress socket peer, not a forwarded header or hostname. HMAC-SHA256 domain separates phone/IP with an explicitly supplied key. All keys have one fixed Redis hash tag. Caller must prevent use of untrusted proxy headers; proxy-chain trust configuration is not implemented.
Restricted mode clamps global challenge/dispatch and phone verification windows. CLOSED, stale generation, expired approval, missing Redis health/history or operator approval fail closed. Runtime/readiness errors, malformed results and timeout quarantine the coordinator instance. No automatic retry, readiness creation or local reset API. A distributed closure/incident controller remains required.
Lua supplies atomic window evaluation, Redis TIME, clock watermark, cache binding, TTL nonrenewal, count-cap expiry rank and type checks. This task does not claim real execution of Lua.
LoopbackRedisTransport is a small bounded RESP2 test transport, fixed loopback and caller-selected port, no redirect/retry/auth/TLS or production activation. It is NOT an approved production Redis client. Socket read/connect budgets and late-result rejection are implemented; blocking socket writes cannot guarantee a strict whole-operation wall-clock deadline. Production transport needs a reviewed mature TLS/ACL-aware client with cancellation and hard deadlines. No paid or external service configured.

## Coverage and limits
Unit tests (19 in `OtpAdmissionTest`, 88 overall backend test suite) cover trusted identity construction/redaction, immutable replay, concurrent unique operation IDs, malformed response, transport error/timeout/late result, generation mismatch, missing evidence, restricted caps, policy-key stability, expiration, quarantine, different payload rejection, denial parsing, multi-window atomicity, and hash slot consistency.
Fifteen real Redis scenarios are prepared in `RedisAdmissionIT` but NOT RUN without approval:
1. Concurrent admission.
2. Same-operation replay.
3. Different-payload replay rejection.
4. Rolling-window expiration.
5. Denial without quota mutation.
6. TTL nonrenewal.
7. Redis restart and missing state.
8. Partial quota-key loss limitation.
9. Clock regression.
10. Script runtime errors.
11. Connection timeout and fail-closed behavior.
12. Recovery generation mismatch.
13. Restricted recovery policy.
14. Multi-window atomicity.
15. Redis cluster hash-slot consistency.
Actual process restart/recovery, real network loss/timeout, restricted-mode Lua integration and cluster topology execution are NOT proven. Shared hash-tag consistency is asserted in unit tests, not a live cluster test. No simplistic mock result is counted as Redis atomicity proof.
Partial quota-key loss is deliberately tested as a limitation: it can look like first use and allow admission unless external monitoring/durable budgets close the gate. Health booleans are trusted inputs, not evidence gathering; a later adapter must obtain them from durable operational state. Existing PostgreSQL caps remain necessary.
Policies are explicit and immutable, but this layer does not prove that an operator supplied every required ADR window or a shared request+verify global ingress budget. Full deployment policy assembly/validation, HMAC rotation overlap, policy-update coordination and trusted recovery-control source remain blockers. Do not activate with an arbitrary incomplete policy.

## Proposed isolated execution — approval required
No Redis image is local. First approve pulling an official Redis image and selecting/pinning its digest (candidate redis:7.4; version/security review needed before pull). No automatic pull authorized by this task.
Proposed container labourly-otp-b2-20261028; loopback 127.0.0.1:56379; memory limit 256 MiB; Redis maxmemory 64 MiB and noeviction. Dedicated new disposable volume only if restart/persistence tests are approved. No PostgreSQL connection, shared volume or Compose startup.
Recheck >=2 GiB free host memory and unused container/volume/port before startup; stop on conflicts. Confirm image digest and mounts, then create explicitly approved isolated container. Redis must never publish on all interfaces. No FLUSHALL or commands against an existing instance.
Tests currently opt in with LABOURLY_REDIS_TEST_APPROVED=YES and use only loopback port 56379, isolated namespace plus per-test generation UUID. Before execution, verify container identity and empty dedicated instance externally. Test code creates synthetic readiness markers; this is not a production bootstrap mechanism.
Approved future test command from backend:
    ./mvnw.cmd -o test -Dtest=RedisAdmissionIT -DfailIfNoTests=true
Do not execute until infrastructure proposal is accepted. Preserve sanitized evidence and resources pending cleanup approval.

## Compatibility and next gates
ProductionOtpProvider unchanged: HTTP 503. No OTP/JWT/refresh/logout/role/controller wiring. V1–V14 source unchanged and no databases accessed.
Next approvals: isolated image acquisition/startup and real Redis tests; production transport/dependency selection; complete launch policy validation; durable readiness/incident controller; safe multi-instance recovery. Existing verifier still needs invalidation checks before new OTP integration. Provider delivery remains unconfigured. No production-readiness claim.
