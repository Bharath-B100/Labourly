package in.nammacrew.auth.redis;

import static org.junit.jupiter.api.Assertions.*;

import in.nammacrew.auth.foundation.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Isolated real-Redis integration test suite. Only executes against a separately approved,
 * disposable Redis instance on loopback port 56379. Does not start Docker or Redis automatically.
 */
@EnabledIfEnvironmentVariable(named = "LABOURLY_REDIS_TEST_APPROVED", matches = "YES")
class RedisAdmissionIT {
  private final LoopbackRedisTransport t = new LoopbackRedisTransport(56379);
  private String testNamespace;
  private OtpAdmission c;
  private OtpAdmission.Operation op;
  private RecoveryPolicy r;

  @BeforeAll
  static void verifyDisposableEndpoint() throws Exception {
    var checkTransport = new LoopbackRedisTransport(56379);
    Object ping = checkTransport.command(List.of("PING"), Duration.ofMillis(200));
    assertEquals("PONG", ping, "Disposable Redis must be reachable on 127.0.0.1:56379");
    Object policy =
        checkTransport.command(
            List.of("CONFIG", "GET", "maxmemory-policy"), Duration.ofMillis(200));
    assertTrue(
        policy.toString().contains("noeviction"),
        "Target endpoint must be disposable container with noeviction policy");
    Object appendonly =
        checkTransport.command(List.of("CONFIG", "GET", "appendonly"), Duration.ofMillis(200));
    assertTrue(
        appendonly.toString().contains("no"),
        "Target endpoint must be disposable container with appendonly disabled");
  }

  Object cmd(String... args) throws Exception {
    if (args.length > 0) {
      String op = args[0].toUpperCase(Locale.ROOT);
      if ("FLUSHALL".equals(op) || "FLUSHDB".equals(op)) {
        throw new UnsupportedOperationException(
            "Destructive whole-database commands are strictly forbidden");
      }
    }
    return t.command(List.of(args), Duration.ofMillis(200));
  }

  @BeforeEach
  void fixture() throws Exception {
    testNamespace = "b2test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    r =
        new RecoveryPolicy(
            RecoveryPolicy.Mode.NORMAL,
            UUID.randomUUID(),
            Instant.now().minusSeconds(90000),
            Instant.now(),
            null);
    c = new OtpAdmission(t, new byte[32], testNamespace, Clock.systemUTC());
    op = prepare();
    cmd("SET", op.keys().get(0), op.arguments().get(0));
    cmd("SET", op.keys().get(2), "0");
  }

  @AfterEach
  void cleanup() {
    try {
      if (testNamespace != null) {
        Object keysObj = cmd("KEYS", testNamespace + ":*");
        if (keysObj instanceof List<?> keys) {
          for (Object k : keys) {
            cmd("DEL", k.toString());
          }
        }
      }
    } catch (Exception ignored) {
      // Best-effort disposable cleanup in isolated namespace; does not mask test failures
    }
  }

  OtpAdmission.Operation prepare() {
    return c.prepare(
        new OtpPolicy(
            "test",
            List.of(
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.CHALLENGE,
                    OtpPolicy.Dimension.GLOBAL,
                    Duration.ofMillis(1000),
                    1),
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.CHALLENGE,
                    OtpPolicy.Dimension.PHONE,
                    Duration.ofMillis(2000),
                    2))),
        OtpPolicy.Gate.CHALLENGE,
        "+919000000001",
        null,
        r);
  }

  RedisLimiter.Result admit(OtpAdmission.Operation o) {
    return c.admit(o, new OtpAdmission.Health(r, true, true, true));
  }

  @Test
  void concurrentAdmission() throws Exception {
    try (var e = Executors.newFixedThreadPool(2)) {
      var a = e.submit(() -> admit(prepare()));
      var b = e.submit(() -> admit(prepare()));
      var results = List.of(a.get(), b.get());
      long allowed = results.stream().filter(x -> x.status() == RedisLimiter.Status.ALLOW).count();
      long denied = results.stream().filter(x -> x.status() == RedisLimiter.Status.DENY).count();
      assertEquals(1, allowed, "Exactly one concurrent admission must be ALLOW");
      assertEquals(1, denied, "The competing admission must be DENY, not UNAVAILABLE or error");
      var deniedResult =
          results.stream()
              .filter(x -> x.status() == RedisLimiter.Status.DENY)
              .findFirst()
              .orElseThrow();
      assertTrue(
          deniedResult.retryAtMillis() > 0, "Denied admission must return positive retryAtMillis");
    }
  }

  @Test
  void sameOperationReplay() throws Exception {
    var first = admit(op);
    assertEquals(RedisLimiter.Status.ALLOW, first.status(), "First admission must be ALLOW");
    long ttlBefore = (Long) cmd("PTTL", op.keys().get(1));
    Thread.sleep(20);
    var replay = admit(op);
    assertEquals(
        RedisLimiter.Status.ALLOW, replay.status(), "Replay of same operation must be ALLOW");
    long ttlAfter = (Long) cmd("PTTL", op.keys().get(1));
    assertTrue(ttlAfter < ttlBefore, "Replay must preserve original deadline and not extend TTL");
    assertEquals(1L, cmd("ZCARD", op.keys().get(3)), "Replay must not add duplicate quota entries");
  }

  @Test
  void differentPayloadReplayRejection() throws Exception {
    admit(op);
    var alteredArgs = new ArrayList<>(op.arguments());
    alteredArgs.set(1, "a".repeat(64)); // altered binding digest
    var rawResult =
        t.evaluate(RedisLimiter.script(), op.keys(), alteredArgs, Duration.ofMillis(200));
    assertEquals(
        "UNAVAILABLE",
        rawResult.get(0),
        "Mismatched binding digest for same operation UUID must return UNAVAILABLE");
  }

  @Test
  void rollingWindowExpiration() throws Exception {
    var first = admit(op);
    assertEquals(RedisLimiter.Status.ALLOW, first.status());
    Thread.sleep(1050); // global window is 1000ms
    var second = admit(prepare());
    assertEquals(
        RedisLimiter.Status.ALLOW,
        second.status(),
        "New operation must be ALLOW after prior window expires");
  }

  @Test
  void denialWithoutQuotaMutation() throws Exception {
    var first = admit(op);
    assertEquals(RedisLimiter.Status.ALLOW, first.status());
    long ttlBefore = (Long) cmd("PTTL", op.keys().get(3));
    var denied = admit(prepare());
    assertEquals(RedisLimiter.Status.DENY, denied.status(), "Excess operation must be DENY");
    assertTrue(denied.retryAtMillis() > 0, "DENY result must include positive retryAtMillis");
    for (String key : op.keys().subList(3, 5)) {
      assertEquals(1L, cmd("ZCARD", key), "DENY must not insert into any quota window ZSet");
    }
    long ttlAfter = (Long) cmd("PTTL", op.keys().get(3));
    assertTrue(ttlAfter <= ttlBefore, "DENY must not renew or extend quota window TTL");
  }

  @Test
  void ttlNonrenewal() throws Exception {
    admit(op);
    long ttlBefore = (Long) cmd("PTTL", op.keys().get(3));
    Thread.sleep(50);
    var denied = admit(prepare());
    assertEquals(RedisLimiter.Status.DENY, denied.status());
    long ttlAfter = (Long) cmd("PTTL", op.keys().get(3));
    assertTrue(ttlAfter <= ttlBefore, "Denied admission check must never renew quota key TTL");
  }

  @Test
  void simulatedReadinessKeyDeletionFailsClosed() throws Exception {
    assertEquals("PONG", cmd("PING"), "Precondition: Redis must be reachable");
    cmd("DEL", op.keys().get(0)); // delete readiness key
    var result = admit(op);
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        result.status(),
        "Missing readiness key must cause immediate fail-closed UNAVAILABLE");
    assertEquals(0, result.retryAtMillis());
  }

  @Test
  void genuineRestartAndQuotaStateLoss() throws Exception {
    // 1. Establish initial readiness and verify admission succeeds
    assertEquals("PONG", cmd("PING"), "Precondition: Redis is running");
    var first = admit(op);
    assertEquals(RedisLimiter.Status.ALLOW, first.status(), "Initial admission must succeed");
    assertTrue(
        (Long) cmd("ZCARD", op.keys().get(3)) > 0, "Quota state must be created in Redis memory");

    // 2. Perform genuine restart of the approved disposable container
    int exitCode =
        new ProcessBuilder("docker", "restart", "labourly-otp-b2-20261028").start().waitFor();
    assertEquals(0, exitCode, "Container restart must succeed");

    // 3. Poll loopback socket until Redis daemon accepts connections again
    boolean reconnected = false;
    for (int i = 0; i < 50; i++) {
      try {
        if ("PONG".equals(cmd("PING"))) {
          reconnected = true;
          break;
        }
      } catch (Exception ignored) {
        Thread.sleep(100);
      }
    }
    assertTrue(reconnected, "Redis container must reconnect within 5 seconds post-restart");

    // 4. Verify volatile state loss: readiness token and quota keys wiped
    assertNull(cmd("GET", op.keys().get(0)), "Readiness token must be absent post-restart");
    assertEquals(0L, cmd("ZCARD", op.keys().get(3)), "Quota state must be absent post-restart");

    // 5. Post-restart admission without re-initialization must fail closed
    var postRestart = admit(op);
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        postRestart.status(),
        "Post-restart uninitialized Redis without approved readiness token must fail closed");
    assertEquals(0, postRestart.retryAtMillis());
  }

  @Test
  void partialQuotaKeyLossLimitation() throws Exception {
    admit(op);
    // Simulate partial quota key loss (e.g. specific ZSet deleted or evicted)
    cmd("DEL", op.keys().get(3));
    // As documented in ADR R2 section 4: Lua alone cannot distinguish a missing subject key from
    // first use.
    // External generation rotation, monitoring, and PostgreSQL durable dispatch caps are required
    // backstops.
    var result = admit(prepare());
    assertEquals(
        RedisLimiter.Status.ALLOW,
        result.status(),
        "Partial key loss limitation: missing quota key looks like first use to Lua unless readiness rotates");
  }

  @Test
  void clockRegression() throws Exception {
    assertEquals("PONG", cmd("PING"));
    // Set clock watermark 60s ahead of current time
    cmd("SET", op.keys().get(2), Long.toString(System.currentTimeMillis() + 60000));
    var result = admit(op);
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        result.status(),
        "Clock regression behind watermark must return UNAVAILABLE");
  }

  @Test
  void scriptRuntimeErrors() {
    var bad =
        new OtpAdmission(
            (s, k, a, d) -> t.evaluate("error('synthetic runtime failure')", k, a, d),
            new byte[32],
            testNamespace,
            Clock.systemUTC());
    var result = bad.admit(op, new OtpAdmission.Health(r, true, true, true));
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        result.status(),
        "Script runtime errors must fail closed as UNAVAILABLE");
  }

  @Test
  void connectionTimeoutAndFailClosed() {
    var unreachable = new LoopbackRedisTransport(56378); // port with no listener
    var timeoutClient =
        new OtpAdmission(unreachable, new byte[32], testNamespace, Clock.systemUTC());
    long startNanos = System.nanoTime();
    var result = timeoutClient.admit(op, new OtpAdmission.Health(r, true, true, true));
    long elapsedMillis = (System.nanoTime() - startNanos) / 1_000_000;
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        result.status(),
        "Connection timeout must fail closed as UNAVAILABLE");
    assertTrue(
        elapsedMillis <= 300,
        "Monotonic elapsed time ("
            + elapsedMillis
            + " ms) must respect deadline budget within OS scheduling tolerance");
  }

  @Test
  void recoveryGenerationMismatch() throws Exception {
    assertEquals("PONG", cmd("PING"));
    cmd("SET", op.keys().get(0), "mismatched-generation-token");
    var result = admit(op);
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        result.status(),
        "Readiness generation token mismatch must return UNAVAILABLE");
    assertEquals(0, result.retryAtMillis());
  }

  @Test
  void restrictedRecoveryPolicy() throws Exception {
    var restricted =
        new RecoveryPolicy(
            RecoveryPolicy.Mode.RESTRICTED,
            r.generation(),
            Instant.now().minusSeconds(90000),
            Instant.now(),
            Instant.now().plusSeconds(60));
    var restrictedOp =
        c.prepare(
            new OtpPolicy(
                "test",
                List.of(
                    new OtpPolicy.Limit(
                        OtpPolicy.Gate.CHALLENGE,
                        OtpPolicy.Dimension.GLOBAL,
                        Duration.ofMinutes(1),
                        100))),
            OtpPolicy.Gate.CHALLENGE,
            "+919000000001",
            null,
            restricted);
    assertTrue(
        restrictedOp.arguments().contains("10"),
        "Global challenge capacity 100 must be clamped to restricted cap 10");
  }

  @Test
  void multiWindowAtomicity() throws Exception {
    var first = admit(op); // Global cap is 1; this consumes it
    assertEquals(RedisLimiter.Status.ALLOW, first.status());
    var second = prepare(); // Competing operation sharing the exhausted global window
    var result = admit(second);
    assertEquals(RedisLimiter.Status.DENY, result.status(), "Exhausted window must deny operation");
    // Verify atomicity: phone window had capacity 2, but because global was 1/1, phone was NOT
    // incremented
    assertEquals(1L, cmd("ZCARD", op.keys().get(3)), "Global window count must remain 1");
    assertEquals(
        1L, cmd("ZCARD", op.keys().get(4)), "Phone window count must remain 1 (all or nothing)");
  }

  @Test
  void redisClusterHashSlotConsistency() {
    for (String key : op.keys()) {
      assertTrue(key.contains("{otp-prod}"), "Key must contain {otp-prod} hash tag: " + key);
    }
  }

  @Test
  void noevictionOomFailsClosed() throws Exception {
    // Isolate OOM scenario: set maxmemory to 1024 bytes on the disposable container
    // so genuine write commands trigger Redis -OOM without affecting other tests.
    try {
      cmd("CONFIG", "SET", "maxmemory", "1024");

      // Direct raw write must receive Redis OOM rejection
      var exception =
          assertThrows(Exception.class, () -> cmd("SET", testNamespace + ":oom_probe", "data"));
      assertTrue(
          exception.getMessage().contains("OOM"),
          "Direct command must receive Redis OOM error: " + exception.getMessage());

      // Admission attempt against live Redis under OOM must fail closed to UNAVAILABLE
      var result = admit(prepare());
      assertEquals(
          RedisLimiter.Status.UNAVAILABLE,
          result.status(),
          "Actual Redis noeviction OOM must cause application-level UNAVAILABLE");
      assertEquals(0, result.retryAtMillis());
    } finally {
      // Restore standard 64mb memory ceiling so no subsequent test is contaminated
      cmd("CONFIG", "SET", "maxmemory", "67108864");
    }
  }
}
