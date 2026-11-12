# B1.5 isolated verification — approval proposal

Status: AWAITING APPROVAL. No Docker commands, database connections, SQL, migrations or tests executed.

## Preflight findings
Branch main; HEAD 781f44de6d9dce02a51d3e1979f512a5b1837cac. Existing working changes preserved.
Source migrations V1–V14 exist; V14 is new/untracked. Actual database Flyway history NOT queried.
Normal .env DB: nammacrew. Application fallback: localhost:5432/nammacrew. Compose: db:5432/nammacrew, host loopback port 5432, postgres_data volume.
Production runtime overrides are unknown; none will be used. Test uses a dedicated DataSource without Spring/Testcontainers configuration.
No listener found on proposed port 55484; recheck before creation.

## Proposed disposable identity
Container: labourly-otp-b15-20261027
NEW volume: labourly-otp-b15-20261027-data
Image: local postgis/postgis:17-3.5, pinned to inspected image ID
Initial admin DB: postgres (new container only)
Test DB: labourly_otp_test_b15_20261027
Role: otp_fixture
JDBC: jdbc:postgresql://127.0.0.1:55484/labourly_otp_test_b15_20261027
Publication: 127.0.0.1:55484 -> container 5432
Password: random disposable value, process environment only; never print.
No existing data directory/volume mounted. The test database is created from template0, avoiding PostGIS extension tables initialized in the image's admin DB.

## Exact proposed PowerShell commands — NOT EXECUTED
Execute stepwise after approval; check every exit code, stop on failure. If Docker is stopped, its startup also needs approval. Require no existing exact container/volume or port listener; no reuse. If image is absent, stop rather than pull without approval.

    Get-NetTCPConnection -State Listen -LocalPort 55484 -ErrorAction SilentlyContinue
    docker container ls -a --filter name=labourly-otp-b15-20261027 --format "{{.Names}}"
    docker volume ls --filter name=labourly-otp-b15-20261027-data --format "{{.Name}}"
    docker image inspect postgis/postgis:17-3.5 --format "{{.Id}} {{json .RepoDigests}}"
    $otpImageId = docker image inspect postgis/postgis:17-3.5 --format "{{.Id}}"
    $otpPassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $otpPreviousPassword = $env:POSTGRES_PASSWORD
    $env:POSTGRES_PASSWORD = $otpPassword
    docker create --name labourly-otp-b15-20261027 --label labourly.purpose=otp-b15-disposable --publish 127.0.0.1:55484:5432 --mount type=volume,source=labourly-otp-b15-20261027-data,target=/var/lib/postgresql/data --env POSTGRES_USER=otp_fixture --env POSTGRES_DB=postgres --env POSTGRES_PASSWORD $otpImageId
    $env:POSTGRES_PASSWORD = $otpPreviousPassword
    docker inspect labourly-otp-b15-20261027 --format "{{.Id}} {{.Image}} {{json .Mounts}} {{json .HostConfig.PortBindings}} {{json .Config.Labels}}"

Verify exact container/image/label, sole new data mount and loopback publication before startup or SQL. Never print full inspect (contains credentials). Stop on mismatch.

    docker start labourly-otp-b15-20261027
    docker exec labourly-otp-b15-20261027 pg_isready -U otp_fixture -d postgres
    docker exec labourly-otp-b15-20261027 createdb -U otp_fixture --template=template0 --owner=otp_fixture labourly_otp_test_b15_20261027
    docker exec labourly-otp-b15-20261027 psql -X -v ON_ERROR_STOP=1 -U otp_fixture -d labourly_otp_test_b15_20261027 -c "SELECT current_database(),current_user; SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'; SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'; SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public';"

Use bounded readiness checks before createdb. Require exact DB/user and all three schema counts zero. Repeat identity/empty checks through dedicated JDBC before migration.

## Test-only corrections proposed before execution
1. Empty-schema guard currently checks tables only. Add pg_class/pg_proc/pg_type plus exact current_database/current_user assertions.
2. CLOSED scenario sets CLOSED itself. Assert initial CLOSED immediately after migrate, before BeforeEach sets NORMAL.
3. Assert all successful V1–V14 history/validation and V14 indexes/constraints explicitly.
Broad RuntimeException assertions must be checked against actual failures so unrelated SQL errors do not masquerade as successful quota/fencing protection.
No application/historical migration changes proposed; test changes not made yet.

After these guards pass:

    $env:JAVA_HOME = 'D:\Files\EDUCATION\NammaCrew\.tools\jdk21-local\jdk-21.0.12.1+1'
    $env:LABOURLY_OTP_DB_TEST_APPROVED = 'YES'
    $env:LABOURLY_OTP_TEST_JDBC_URL = 'jdbc:postgresql://127.0.0.1:55484/labourly_otp_test_b15_20261027'
    $env:LABOURLY_OTP_TEST_USER = 'otp_fixture'
    $env:LABOURLY_OTP_TEST_PASSWORD = $otpPassword
    Set-Location D:\Files\EDUCATION\NammaCrew\backend
    ./mvnw.cmd -o test '-Dtest=OtpDeliveryPersistenceIT' '-DfailIfNoTests=true'

Capture previous environment values and restore in finally, including password on failed creation. These are reviewed actions, not an unchecked batch. Surefire selects only this class; it internally applies V1–V14. No verify, full integration suite, Spring Boot or Flyway clean. Preserve evidence before separately agreed cleanup. No automatic rerun against the populated database.

## All 12 scenarios: NOT RUN
1. migrationsAndClosedDefaultConstraint
2. atomicRollbackOnUniqueBinding
3. concurrentPhoneCooldown
4. fencingAndUnknownNeverResent
5. claimLeaseRecoveryChangesFence
6. globalAdmissionCountsExistingHistory
7. restrictedDispatchCountsNormalHistory
8. callbackDeduplicationAndCleanupOrdering
9. expiredSendingLeaseQuarantinesAndErasesCiphertext
10. constraintPairsAndAttemptUniqueness
11. retryRequiresDefiniteNonAcceptanceAndHasCeiling
12. callbackDedupeSurvivesAttemptRetentionPurge

SQL failures and concurrency/transaction outcomes: unassessed, not passing. Runtime container identity and empty schema remain pending approved creation/checks. No normal database connection is required.

Remaining gates: Redis admission/readiness/recovery (B2); invalidation-aware authentication integration; provider callbacks/delivery; production key custody. No SMS activation.

Approval requested for the exact new disposable environment, identity checks, test-only corrections and execution of only these tests/migrations. No existing database changes.
