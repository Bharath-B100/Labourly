package in.nammacrew.auth.foundation;

import static org.junit.jupiter.api.Assertions.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class OtpFoundationTest {
  final Instant now = Instant.parse("2026-10-27T00:00:00Z");

  @Test
  void policyIsImmutableAndRejectsDuplicates() {
    var l =
        new OtpPolicy.Limit(
            OtpPolicy.Gate.CHALLENGE, OtpPolicy.Dimension.PHONE, Duration.ofMinutes(1), 1);
    var list = new ArrayList<>(List.of(l));
    var p = new OtpPolicy("r2", list);
    list.clear();
    assertEquals(1, p.limits().size());
    assertThrows(UnsupportedOperationException.class, () -> p.limits().clear());
    assertThrows(IllegalArgumentException.class, () -> new OtpPolicy("r2", List.of(l, l)));
  }

  @Test
  void malformedPoliciesFailClosed() {
    for (var d :
        List.of(Duration.ZERO, Duration.ofNanos(1), Duration.ofDays(2), Duration.ofSeconds(-1)))
      assertThrows(
          IllegalArgumentException.class,
          () -> new OtpPolicy.Limit(OtpPolicy.Gate.VERIFY, OtpPolicy.Dimension.IP, d, 1));
    assertThrows(
        IllegalArgumentException.class, () -> new OtpPolicy("bad secret value", List.of()));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new OtpPolicy.Limit(
                OtpPolicy.Gate.VERIFY, OtpPolicy.Dimension.IP, Duration.ofSeconds(1), 0));
  }

  @ParameterizedTest
  @EnumSource(DeliveryRules.State.class)
  void unknownNeverBecomesSendable(DeliveryRules.State next) {
    assertEquals(
        Set.of(
                DeliveryRules.State.ACCEPTED,
                DeliveryRules.State.DELIVERED,
                DeliveryRules.State.FAILED)
            .contains(next),
        DeliveryRules.permits(DeliveryRules.State.UNKNOWN, next));
    assertFalse(
        DeliveryRules.claimable(
            next, List.of(new DeliveryRules.AttemptResult(DeliveryRules.Attempt.UNKNOWN, false))));
  }

  @ParameterizedTest
  @EnumSource(DeliveryRules.Attempt.class)
  void attemptHistoryControlsRetries(DeliveryRules.Attempt a) {
    var attempt =
        new DeliveryRules.AttemptResult(a, a == DeliveryRules.Attempt.DEFINITELY_NOT_SENT);
    assertEquals(
        a == DeliveryRules.Attempt.DEFINITELY_NOT_SENT,
        DeliveryRules.claimable(DeliveryRules.State.RETRY_WAIT, List.of(attempt)));
    assertFalse(
        DeliveryRules.claimable(DeliveryRules.State.RETRY_WAIT, Collections.nCopies(3, attempt)));
  }

  @Test
  void nonRetryableAndStartedCannotRetry() {
    assertFalse(
        DeliveryRules.claimable(
            DeliveryRules.State.PENDING,
            List.of(
                new DeliveryRules.AttemptResult(
                    DeliveryRules.Attempt.DEFINITELY_NOT_SENT, false))));
    assertThrows(
        IllegalArgumentException.class,
        () -> new DeliveryRules.AttemptResult(DeliveryRules.Attempt.UNKNOWN, true));
    assertTrue(DeliveryRules.claimable(DeliveryRules.State.PENDING, List.of()));
  }

  @Test
  void fencingExpiryAndLeaseBoundaries() {
    var owner = UUID.randomUUID();
    var generation = UUID.randomUUID();
    var p =
        new DeliveryRules.Permit(owner, 1, generation, now.plusSeconds(10), now.plusSeconds(15));
    assertTrue(p.eligible(owner, 1, generation, now, true, true, true));
    assertFalse(p.eligible(owner, 2, generation, now, true, true, true));
    assertFalse(p.eligible(owner, 1, UUID.randomUUID(), now, true, true, true));
    assertFalse(p.eligible(owner, 1, generation, now.plusMillis(1), true, true, true));
    assertFalse(p.eligible(owner, 1, generation, now, false, true, true));
    assertFalse(p.eligible(owner, 1, generation, now, true, true, false));
  }

  @Test
  void singleUsePermitIsConcurrentAndPauseFailsClosed() throws Exception {
    var guard = new DeliveryRules.SendOnce();
    var successes = new AtomicInteger();
    try (var pool = Executors.newFixedThreadPool(8)) {
      var jobs = new ArrayList<Future<?>>();
      for (int i = 0; i < 100; i++)
        jobs.add(
            pool.submit(
                () -> {
                  if (guard.consume(Duration.ZERO, false)) successes.incrementAndGet();
                }));
      for (var job : jobs) job.get();
    }
    assertEquals(1, successes.get());
    var paused = new DeliveryRules.SendOnce();
    assertFalse(paused.consume(Duration.ofMillis(1001), false));
    assertFalse(paused.consume(Duration.ZERO, false));
    assertFalse(new DeliveryRules.SendOnce().consume(Duration.ZERO, true));
  }

  @ParameterizedTest
  @EnumSource(DeliveryRules.State.class)
  void replayNeverSendsAndTerminalStatesReject(DeliveryRules.State state) {
    String key = "v1." + now.minusSeconds(400).getEpochSecond() + "." + UUID.randomUUID();
    var e = new IdempotencyDecision.Existing(true, false, false, now.plusSeconds(30), state);
    boolean terminal =
        Set.of(
                DeliveryRules.State.EXPIRED,
                DeliveryRules.State.CANCELLED,
                DeliveryRules.State.FAILED)
            .contains(state);
    assertEquals(
        terminal
            ? IdempotencyDecision.Result.INVALID_REQUEST
            : IdempotencyDecision.Result.REPLAY_ACKNOWLEDGEMENT,
        IdempotencyDecision.decide(key, now, true, e));
  }

  @Test
  void idempotencyBoundariesAndInvalidation() {
    for (long age : new long[] {-61, 301})
      assertEquals(
          IdempotencyDecision.Result.INVALID_REQUEST,
          IdempotencyDecision.decide(
              "v1." + now.minusSeconds(age).getEpochSecond() + "." + UUID.randomUUID(),
              now,
              true,
              null));
    for (long age : new long[] {-60, 300})
      assertEquals(
          IdempotencyDecision.Result.NORMAL_ADMISSION,
          IdempotencyDecision.decide(
              "v1." + now.minusSeconds(age).getEpochSecond() + "." + UUID.randomUUID(),
              now,
              true,
              null));
    assertEquals(
        IdempotencyDecision.Result.INVALID_REQUEST,
        IdempotencyDecision.decide("secret", now, true, null));
    assertEquals(
        IdempotencyDecision.Result.UNAVAILABLE, IdempotencyDecision.decide(null, now, false, null));
    var key = "v1." + now.getEpochSecond() + "." + UUID.randomUUID();
    for (var e :
        List.of(
            new IdempotencyDecision.Existing(
                false, false, false, now.plusSeconds(1), DeliveryRules.State.PENDING),
            new IdempotencyDecision.Existing(
                true, true, false, now.plusSeconds(1), DeliveryRules.State.DELIVERED),
            new IdempotencyDecision.Existing(
                true, false, true, now.plusSeconds(1), DeliveryRules.State.PENDING),
            new IdempotencyDecision.Existing(true, false, false, now, DeliveryRules.State.PENDING)))
      assertEquals(
          IdempotencyDecision.Result.INVALID_REQUEST,
          IdempotencyDecision.decide(key, now, true, e));
  }

  @Test
  void recoveryRequiresApprovalGenerationHistoryAndFixedLease() {
    var gen = UUID.randomUUID();
    var r =
        new RecoveryPolicy(RecoveryPolicy.Mode.RESTRICTED, gen, now, now, now.plusSeconds(3600));
    assertTrue(r.permits(now, gen, true, true, true));
    assertFalse(r.permits(now, gen, false, true, true));
    assertFalse(r.permits(now, gen, true, true, false));
    assertFalse(r.permits(now, UUID.randomUUID(), true, true, true));
    assertFalse(r.permits(now.plusSeconds(3600), gen, true, true, true));
    assertEquals(10, r.dispatchCap(Duration.ofMinutes(1)));
    var normal = new RecoveryPolicy(RecoveryPolicy.Mode.NORMAL, gen, now, null, null);
    assertFalse(normal.permits(now.plusSeconds(86399), gen, true, true, true));
    assertTrue(normal.permits(now.plusSeconds(86400), gen, true, true, true));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new RecoveryPolicy(
                RecoveryPolicy.Mode.RESTRICTED, gen, now, now, now.plusSeconds(3601)));
  }

  @Test
  void encryptionAuthenticatesContextAndCiphertextAndRedacts() {
    byte[] key = new byte[32];
    Arrays.fill(key, (byte) 7);
    var cipher = new OtpCipher(id -> new SecretKeySpec(key, "AES"));
    byte[] plain = "654321".getBytes(),
        aad = "delivery/challenge/provider/template/expiry".getBytes();
    var a = cipher.encrypt("test-key", plain, aad);
    var b = cipher.encrypt("test-key", plain, aad);
    assertArrayEquals(plain, cipher.decrypt(a, aad));
    assertFalse(Arrays.equals(a.nonce(), b.nonce()));
    assertThrows(IllegalStateException.class, () -> cipher.decrypt(a, "other".getBytes()));
    var bad = a.ciphertext();
    bad[0] ^= 1;
    assertThrows(
        IllegalStateException.class,
        () -> cipher.decrypt(new OtpCipher.Envelope(a.keyId(), a.nonce(), bad), aad));
    assertArrayEquals(plain, cipher.decrypt(a, aad));
    assertFalse(a.toString().contains("654321"));
    assertThrows(IllegalStateException.class, () -> new OtpCipher(id -> null).decrypt(a, aad));
    assertThrows(
        IllegalArgumentException.class, () -> cipher.encrypt("test-key", plain, new byte[0]));
  }

  @ParameterizedTest
  @EnumSource(SmsAdapter.Outcome.class)
  void fakeTransportHasNoNetworkAndRedacts(SmsAdapter.Outcome outcome) {
    var result =
        new SmsAdapter.Result(
            outcome,
            outcome == SmsAdapter.Outcome.ACCEPTED ? "private-id" : null,
            outcome == SmsAdapter.Outcome.DEFINITELY_NOT_SENT);
    var fake = new FakeSms(result);
    var command =
        new SmsAdapter.Command(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "+919000000001",
            "654321",
            "test",
            now.plusSeconds(60));
    assertEquals(result, fake.send(command));
    assertEquals(1, fake.calls);
    assertFalse(command.toString().contains("654321"));
    assertFalse(result.toString().contains("private-id"));
    assertThrows(
        SecurityException.class, () -> fake.authenticateCallback(new byte[0], Map.of(), "test"));
  }

  @Test
  void unsafeProviderRetryRejected() {
    assertThrows(
        IllegalArgumentException.class,
        () -> new SmsAdapter.Result(SmsAdapter.Outcome.UNKNOWN, null, true));
    assertThrows(
        IllegalArgumentException.class,
        () -> new SmsAdapter.Result(SmsAdapter.Outcome.ACCEPTED, null, false));
  }

  @Test
  void limiterResourceAndResultsFailClosed() {
    var script = RedisLimiter.script();
    assertTrue(script.contains("redis.call('TIME')"));
    assertTrue(script.indexOf("local retry=0") < script.indexOf("redis.call('ZADD'"));
    assertTrue(script.contains("count-caps[i]"));
    assertTrue(script.contains("windows[i]+60000"));
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE, RedisLimiter.parse(List.of("ALLOW", -1)).status());
    assertEquals(RedisLimiter.Status.DENY, RedisLimiter.parse(List.of("DENY", 123)).status());
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE, RedisLimiter.parse(List.of("garbage", 0)).status());
  }

  static final class FakeSms implements SmsAdapter {
    final Result result;
    int calls;

    FakeSms(Result r) {
      result = r;
    }

    public Result send(Command c) {
      Objects.requireNonNull(c);
      calls++;
      return result;
    }

    public Lookup lookup(String id) {
      return Lookup.UNKNOWN;
    }

    public Callback authenticateCallback(byte[] b, Map<String, String> h, String u) {
      throw new SecurityException("Unauthenticated callback");
    }
  }
}
