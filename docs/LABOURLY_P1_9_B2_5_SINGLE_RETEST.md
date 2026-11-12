# B2.5 single-scenario retest preflight — 2026-10-28

## Authorized execution update — 14:56 IST

After the user explicitly waived the RAM concern, identities/configuration were rechecked and exactly one invocation executed. The earlier preflight block below is retained as history, not the final result.

**PASS: 1 test, 0 failures, 0 errors, 0 skipped. Maven exit code explicitly captured: 0.**

```powershell
.\mvnw.cmd -o test '-Dtest=RedisAdmissionIT#genuineRestartAndQuotaStateLoss' '-DfailIfNoTests=true'
```

Java 21 selected for this invocation. LABOURLY_REDIS_TEST_APPROVED=YES set only in the invocation process; both it and JAVA_HOME restored to prior values in finally. No retry and no full-suite run.

Surefire individual testcase: `genuineRestartAndQuotaStateLoss`, 0.947 seconds. Suite elapsed 1.010 seconds. Maven total 5.114 seconds, completed 2026-10-28T14:56:38+05:30. Source result: `backend/target/surefire-reports/TEST-in.nammacrew.auth.redis.RedisAdmissionIT.xml`; only testcase/count evidence extracted here because raw XML may include environment properties. Invocation log: `b25-single-retest.log`; explicit exit evidence: `b25-single-retest-exit.txt`.

All scenario assertions executed successfully: initial ALLOW, existing quota state, successful single container restart, missing readiness token parsed as null, zero quota count after restart, subsequent UNAVAILABLE with retryAtMillis zero. This confirms the corrected parser against real Redis for the formerly failing scenario, not a new 17-test full-suite result.

Sanitized Redis lifecycle log excerpt (UTC):

```text
09:26:37.433488051 Received SIGTERM scheduling shutdown
09:26:37.523640548 User requested shutdown
09:26:37.523758801 Redis is now ready to exit
09:26:38.056524358 Redis is starting
09:26:38.056543851 Redis version=7.4.12, bits=64
09:26:38.059524947 Server initialized
09:26:38.059718748 Ready to accept connections tcp
```

Container StartedAt changed from 2026-10-28T08:13:55.773770708Z to 2026-10-28T09:26:37.85214679Z. Container/image IDs, network ID, anonymous volume, loopback publication and routing rule listed below remain the same. Post-restart CONFIG GET confirms empty save, appendonly no, 64 MiB maxmemory and noeviction. PostgreSQL container start timestamps below remain unchanged; no PostgreSQL connection or migration was performed.

Only this report updated; no application source edits. No Docker resources created/deleted, routing changes, backend restart, SMS, commits, pushes, tags or deployment. Existing infrastructure audit uncertainties remain documented in the failure review; this pass does not resolve historical authorization/provenance gaps or authorize production OTP. STOP at review gate.

## Earlier preflight (superseded by explicit RAM waiver)

Status: BLOCKED BEFORE EXECUTION. Snapshot: 14:50 IST.

The authorized test `RedisAdmissionIT#genuineRestartAndQuotaStateLoss` was NOT RUN. No Maven invocation, test approval environment variable, restart or retry occurred. No new Surefire result or Maven exit code exists for this attempt; neither is reported as passing.

## Verified read-only

- Branch: main. Existing tracked and untracked working changes preserved.
- Running Redis container: a77971a03265037911dd2d05a0c0cb6bd19542bdee502a0bf758ed0ce7fe518f.
- Image ID and RepoDigest: sha256:1cf73a2f04808e55a8bd2f5706c2aa0ebb0f71938f93deb7af79f48311cd5cb9; linux/amd64.
- Network: labourly-redis-test-net, ID 69cb064a2778c9f691264646babdfa15a11c6d910840a56712d0883e52d48528; 172.29.0.2/24.
- Port: 127.0.0.1:56379 -> 6379/tcp only.
- Container memory and memory+swap: 268435456 bytes each. Runtime maxmemory 67108864; noeviction; save empty; appendonly no.
- Anonymous /data volume: 5424d6dc144536546b354808c75454b323b42b23d3f82f0acf29353553abcde0, unchanged.
- dockerd network namespace rule remains: priority 100, from 172.29.0.0/24 to 172.17.0.0/16 lookup main unreachable. No rule mutation.
- Redis start timestamp unchanged: 2026-10-28T08:13:55.773770708Z.
- PostgreSQL container metadata only inspected: B1.5 6b0b5ea1a5f9... started 03:35:52.842742678Z; native isolated 638317c556b7... started 03:35:00.333660384Z. Neither database accessed or included in test scope.
- Test source contains one docker restart command targeting only labourly-otp-b2-20261028. No execution occurred.

## Blocking prerequisite

Available physical RAM measured 1,259,000 KiB, then 1,295,640 KiB (1.24 GiB). This does not meet the documented B2 execution proposal's >=2 GiB free-host-memory prerequisite. No processes were terminated or resources reconfigured to force execution.

## Next gate

Free unused host applications, then recheck memory and resource identities before using the existing single-scenario authorization. The authorized attempt remains unused. No full-suite execution, cleanup, routing changes, PostgreSQL access, migrations, source changes or Git operations were performed. This report is the only added file in this turn.
