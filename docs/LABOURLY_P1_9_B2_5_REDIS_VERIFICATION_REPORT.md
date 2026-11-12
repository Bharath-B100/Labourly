# P1.9 B2.5 Isolated Redis Integration Verification Report — 2026-10-28

**Execution Status: 16 passed, 0 failures, 1 error, 0 skipped.**  
**Result:** Verification NOT claimed as successful per mandatory controls. Single authorized execution completed; no automatic rerun performed. Stopped at review gate.

---

## 1. Pulled Image Digest and Running Image Identity

- **Repository:** `redis`
- **Pinned Approved Digest:** `sha256:1cf73a2f04808e55a8bd2f5706c2aa0ebb0f71938f93deb7af79f48311cd5cb9`
- **Running Image ID:** `sha256:1cf73a2f04808e55a8bd2f5706c2aa0ebb0f71938f93deb7af79f48311cd5cb9` (`1cf73a2f0480`)
- **Docker Platform:** `linux/amd64` (Official Debian-based Redis 7.4.12)

---

## 2. Docker Container and Network Identities

- **Container Name:** `labourly-otp-b2-20261028`
- **Container ID:** `a77971a03265037911dd2d05a0c0cb6bd19542bdee502a0bf758ed0ce7fe518f`
- **Network Name:** `labourly-redis-test-net`
- **Network ID:** `69cb064a2778c9f691264646babdfa15a11c6d910840a56712d0883e52d48528`
- **Assigned Subnet:** `172.29.0.0/24` (Gateway: `172.29.0.1`, Container IPv4: `172.29.0.2`)
- **Container Memory Ceiling:** 256 MB (`HostConfig.Memory = 268435456` bytes)
- **Redis Maxmemory Configuration:** 64 MB (`67108864` bytes)
- **Eviction Policy:** `noeviction`
- **Persistence Configuration:** `--save ""` and `--appendonly no` (volatile in-memory only)

---

## 3. Port Publication and PostgreSQL Network Isolation Verification

- **Host Publication:** Published strictly on loopback interface `127.0.0.1:56379 -> 6379/tcp` (verified reachable from host).
- **PostgreSQL Isolation Probes:**  
  Probes executed from inside `labourly-otp-b2-20261028` using `/usr/bin/nc` against internal PostgreSQL endpoints:
  - Probe to `172.17.0.2:5432` (`labourly-l1-native-20261014`):  
    `nc -z -v -w 2 172.17.0.2 5432` -> **`nc: 172.17.0.2 (172.17.0.2:5432): Network unreachable`** (Exit Code: 1)
  - Probe to `172.17.0.3:5432` (`labourly-otp-b15-20261027`):  
    `nc -z -v -w 2 172.17.0.3 5432` -> **`nc: 172.17.0.3 (172.17.0.3:5432): Operation timed out`** (Exit Code: 1)
- **Enforcement Mechanism:** Enforced at kernel routing policy level (`ip rule add from 172.29.0.0/24 to 172.17.0.0/16 type unreachable priority 100`).

---

## 4. Individual Results for All 17 Redis Scenarios

Suite: `in.nammacrew.auth.redis.RedisAdmissionIT`  
Command: `.\mvnw.cmd -o test -Dtest=RedisAdmissionIT -DfailIfNoTests=true` with `LABOURLY_REDIS_TEST_APPROVED=YES`

| # | Scenario | Result | Duration | Notes |
|---|---|---|---|---|
| 1 | `recoveryGenerationMismatch` | **PASS** | 0.285s | Mismatched generation token fails closed to `UNAVAILABLE` |
| 2 | `simulatedReadinessKeyDeletionFailsClosed` | **PASS** | 0.034s | Deleting readiness key causes immediate `UNAVAILABLE` |
| 3 | `sameOperationReplay` | **PASS** | 0.115s | Idempotent replay preserves deadline and does not extend TTL |
| 4 | `denialWithoutQuotaMutation` | **PASS** | 0.054s | Denied admission does not mutate quota ZSets or renew TTL |
| 5 | `restrictedRecoveryPolicy` | **PASS** | 0.018s | Capacity clamped to restricted threshold |
| 6 | `concurrentAdmission` | **PASS** | 0.035s | Competing threads: exactly 1 `ALLOW`, 1 `DENY` |
| 7 | `differentPayloadReplayRejection` | **PASS** | 0.035s | Altered binding digest fails closed to `UNAVAILABLE` |
| 8 | `multiWindowAtomicity` | **PASS** | 0.038s | Atomic multi-window: phone counter not modified when global is exhausted |
| 9 | `genuineRestartAndQuotaStateLoss` | **ERROR** | 1.040s | `java.io.IOException: Invalid bulk` at `LoopbackRedisTransport.java:85` during `assertNull(cmd("GET", op.keys().get(0)))` |
| 10 | `noevictionOomFailsClosed` | **PASS** | 0.103s | Real Redis OOM triggers application-level `UNAVAILABLE` fail-closed |
| 11 | `ttlNonrenewal` | **PASS** | 0.221s | Denied check does not renew quota key TTL |
| 12 | `connectionTimeoutAndFailClosed` | **PASS** | 0.103s | Connection timeout to closed port fails closed within deadline budget |
| 13 | `partialQuotaKeyLossLimitation` | **PASS** | 0.135s | Documents architectural limitation: missing quota key looks like first use |
| 14 | `rollingWindowExpiration` | **PASS** | 1.167s | Operation allowed after rolling time window elapses |
| 15 | `redisClusterHashSlotConsistency` | **PASS** | 0.035s | Keys verified mapped to `{otp-prod}` hash slot |
| 16 | `clockRegression` | **PASS** | 0.065s | Regressed client clock behind Redis watermark fails closed |
| 17 | `scriptRuntimeErrors` | **PASS** | 0.037s | Synthetic Lua runtime error fails closed to `UNAVAILABLE` |

---

## 5. Restart, Quota-Loss, Timeout, and OOM Observations

1. **Genuine Container Restart & Volatile State Loss:**
   - Container restart (`docker restart labourly-otp-b2-20261028`) executed cleanly with exit code 0.
   - Loopback connection restored within 1 second.
   - In-memory quota state was wiped (`ZCARD` = 0) confirming that persistence was completely disabled.
2. **Noeviction OOM Handling:**
   - `CONFIG SET maxmemory 1024` applied to the disposable container forced Redis into genuine out-of-memory state.
   - Raw write produced `-OOM command not allowed when used memory > 'maxmemory'`.
   - Application admission call failed closed cleanly to `UNAVAILABLE` with `retryAtMillis = 0`.
   - Memory ceiling was safely restored to `67108864` bytes in `finally`.
3. **Monotonic Timeout & Deadline:**
   - Socket connection to non-listening port `56378` failed closed to `UNAVAILABLE` in ~103 ms, well within the 300 ms test budget.
4. **Multi-Window Lua Atomicity:**
   - Under competing global limit (capacity = 1), secondary phone limit (capacity = 2) was verified all-or-nothing: phone count remained 1 when global admission was denied.

---

## 6. Root Cause Analysis of Scenario 9 Error

- **Location:** [LoopbackRedisTransport.java:85](file:///d:/Files/EDUCATION/NammaCrew/backend/src/main/java/in/nammacrew/auth/redis/LoopbackRedisTransport.java#L85)
- **Mechanism:** In RESP2 protocol, Redis returns a Null Bulk String (`$-1\r\n`) when a requested key does not exist (such as `GET` on a non-existent readiness key post-restart).
- **Bug in Test Transport:**
  ```java
  if (type == '$') {
    int count = Integer.parseInt(value);
    if (count < 0 || count > 65536) throw new IOException("Invalid bulk");
  ```
  `LoopbackRedisTransport` rejected `count == -1` with `IOException: Invalid bulk` instead of returning `null`.
- **Enforcement Action:** In strict accordance with the mandatory controls ("Do not claim success unless exactly 17 tests execute with zero failures, zero errors and zero skips. Do not rerun automatically after a failure."), no code modification or automatic re-run was performed.

---

## 7. Confirmation of Untouched Labourly Databases

- **`labourly-l1-native-20261014` (`labourly_l1`):**
  - Container Uptime: 5+ hours (uninterrupted).
  - Schema Count: 38 public tables (intact).
  - Role: `labourly_test`.
- **`labourly-otp-b15-20261027` (`labourly_otp_test_b15_20261027`):**
  - Container Uptime: 5+ hours (uninterrupted).
  - Schema Count: 42 public tables (intact).
  - Role: `otp_fixture`.
- Both preserved PostgreSQL containers remained completely un-accessed, unmodified, and network-isolated throughout execution.

---

## 8. Preserved Resources

- Network: `labourly-redis-test-net` (ID `69cb064a2778`)
- Container: `labourly-otp-b2-20261028` (ID `a77971a03265`)
- PowerShell environment variables (`LABOURLY_REDIS_TEST_APPROVED`, `JAVA_HOME`, `Path`) restored in `finally`.
- All resources preserved pending separate cleanup approval.

STOPPED AT THE REVIEW GATE.
