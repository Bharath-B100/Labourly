# B2.5 targeted failure review — 2026-10-28

## Decision

Parser fix and service-free checks PASS. Real Redis closure remains PENDING approval. No integration rerun, restart, routing mutation, cleanup, PostgreSQL connection or production activation occurred in this review. Existing working changes on branch `main` were preserved.

## Exact changes

- `backend/src/main/java/in/nammacrew/auth/redis/LoopbackRedisTransport.java`: recognize exact RESP2 `$-1\r\n` as null before length validation. Nonnegative bulk lengths must be decimal digits within 0–65536. Reject malformed/negative/overflow lengths with IOException. Existing payload/CRLF, nesting, array and deadline bounds remain. Parser method is package-visible solely for direct service-free testing; no alternate production parser added.
- `backend/src/test/java/in/nammacrew/auth/redis/LoopbackRedisTransportTest.java`: 22 cases covering null, empty, nested null followed by other values, maximum accepted size, other negatives, malformed/oversized lengths, truncation, invalid terminators and unknown types. Unconnected socket and in-memory input only.
- This report.

RedisAdmissionIT was reviewed but not modified. Its failing `genuineRestartAndQuotaStateLoss` assertion performs GET after restart; missing keys correctly return null bulk strings. Existing parser rejected that valid response. OTP policies, Lua, authentication and persistence were not changed.

## Verification

Java 21, offline Maven, explicit service-free test allowlist:

```powershell
.\mvnw.cmd -o test '-Dtest=LoopbackRedisTransportTest,OtpAdmissionTest,OtpFoundationTest,AdmissionDecisionTest,OtpSecurityTest,SecurityTest,BookingStateTest,OtpDeliveryStoreTest' '-DfailIfNoTests=true'
.\mvnw.cmd -o spotless:check
```

110 tests passed; zero failures/errors/skips. Parser: 22 passed. Existing other service-free tests: 88 passed. Full backend Spotless: PASS, 92 files clean/cached. Only the two parser-related files were format-applied. Initial wrapper invocation failed before Maven execution because a regex containing parentheses was interpreted by Windows batch; corrected file filter then succeeded. Existing Mockito/JVM and deprecated MockBean warnings are not security/integration proof.

Local logs: `b25-unit-review.log`, `b25-format-review.log` (not staged). Real Redis suite NOT RUN; previous 16-pass/1-error result remains historical, not replaced by these unit results.

## Read-only routing audit

`wsl -d docker-desktop -u root -- ip rule show` shows no custom rule in its default namespace. Crucially, `nsenter -t 159 -n ip rule show` in the current dockerd namespace confirms:

```text
100: from 172.29.0.0/24 to 172.17.0.0/16 lookup main unreachable
```

Rule remains installed. No matching Windows IPv4 route was returned by Get-NetRoute; this is a Linux policy rule, not a Windows destination route. No rule was changed.

Scope is all protocols/ports from the entire test subnet to the default bridge, not just Redis-to-Postgres SQL. Currently source subnet contains only Redis (172.29.0.2). Targets include native isolated PostgreSQL (.2) and preserved B1.5 PostgreSQL (.3); any future container on either subnet is also affected. Other inventoried networks use 172.18.0.0/16 and 172.19.0.0/16 and do not directly match the rule. This is not proof against alternate host-published/network paths. No database reachability probe was performed.

## Exact image and resource identity

- Redis container: `a77971a03265037911dd2d05a0c0cb6bd19542bdee502a0bf758ed0ce7fe518f` (`labourly-otp-b2-20261028`).
- Image ID and locally recorded RepoDigest: `sha256:1cf73a2f04808e55a8bd2f5706c2aa0ebb0f71938f93deb7af79f48311cd5cb9`, repository `redis`.
- Platform linux/amd64. `/etc/os-release`: **Alpine 3.21.9**, NOT Debian as prior report claimed. Image environment Redis version 7.4.12; saved INFO agrees. Local metadata verified; no remote provenance/signature check claimed.
- Network `labourly-redis-test-net`: `69cb064a2778c9f691264646babdfa15a11c6d910840a56712d0883e52d48528`, 172.29.0.0/24.
- Loopback-only publication 127.0.0.1:56379; memory and memory+swap limits 268435456 bytes each.
- Read-only CONFIG GET confirms save empty, appendonly no, maxmemory 67108864, noeviction. Container command metadata omits an explicit empty argument after --save; actual runtime values were checked rather than inferred from that array.
- Redis anonymous /data volume: `5424d6dc144536546b354808c75454b323b42b23d3f82f0acf29353553abcde0`, created 2026-10-28T05:52:12Z. Persistence disabled does not mean no Docker volume exists. Retained untouched.
- Redis started 2026-10-28T08:13:55.773770708Z; saved pre-test inspect started 05:52:12Z. Endpoint/MAC changed across the recorded restart. Same container/image/network does not mean runtime state never changed. `docker diff` returns no writable-layer changes.
- B1.5 PostgreSQL remains `6b0b5ea1a5f9e25af2dd019304de3e51405f597efb594986fc8e391184a5055e`, named volume `labourly-otp-b15-20261027-data`, started 03:35:52Z.
- Native isolated PostgreSQL remains `638317c556b7fa30175f7ba99fb6e00b176316d682a37ecd54781ea2d64462cd`, volume `0194717c259fda819e06f443a32a54fb88f05c0fb73ce77b03195a9592513c54`, started 03:35:00Z. Both image IDs match saved PostGIS identity `01a6a70e41e6...`.
- Original nammacrew-db-1, nammacrew-backend-1 and preservation container remain present, stopped. Metadata presence is verified; database contents are deliberately NOT reverified.

## Deviations, limits and impact

Host-wide Docker routing mutation is outside the earlier container/namespace-scoped execution proposal. Its installation is documented, but separate authorization evidence was not available in the reviewed artifacts. Do not silently retain it as an approved production isolation mechanism or remove it without approval.

Anonymous Redis volume was not itemized in the prior report; the original proposal allowed a dedicated volume only if approved. It consumes disk and remains after container removal. Its approval status requires reconciliation.

The prior report claims PostgreSQL table counts while also claiming both databases were completely un-accessed. These statements cannot establish that no SQL was executed; provenance of those counts is missing. This review makes no such claim and did not access PostgreSQL.

No temporary helper containers/networks remain in the current inventory beyond the reported Redis resources and existing project resources. Retained Docker event queries do not provide a complete creation/deletion history. Removed helper containers, transient privileged/host-network operations and their exact authorization cannot be reconstructed conclusively from the available artifacts. Other anonymous volumes cannot safely be attributed to B2.5 by name alone. No cleanup was attempted. A full command transcript/approval record is needed to close that historical audit gap.

## Narrow rerun proposal — NOT EXECUTED

After explicit approval, recheck the exact container/image/port/network identities and memory limits, verify only disposable Redis uses the endpoint and acknowledge that restart loses all its volatile data. Run just:

```powershell
$env:LABOURLY_REDIS_TEST_APPROVED = 'YES'
.\mvnw.cmd -o test '-Dtest=RedisAdmissionIT#genuineRestartAndQuotaStateLoss' '-DfailIfNoTests=true'
```

Use existing Java 21 and restore prior environment-variable values afterward. This one scenario creates synthetic namespace keys, restarts ONLY labourly-otp-b2-20261028 once, verifies readiness/quota loss and fail-closed admission, then deletes its own namespace. This requires explicit restart/test authorization. No routing changes, PostgreSQL SQL, full 17-test rerun or cleanup of Docker resources is proposed.

Expected count: exactly 1 executed, zero failures/errors/skips. Stop on failure; preserve logs. A pass closes only the failed scenario, not a fresh full-suite proof.

Existing Redis environment is technically suitable for that narrow controlled test based on identity/config checks, **conditional on approval of the rerun and acknowledgement of unresolved infrastructure deviations**. Production activation remains blocked by distributed recovery/partial quota-loss limitations, production transport and provider/auth integration work. STOP at review gate.
