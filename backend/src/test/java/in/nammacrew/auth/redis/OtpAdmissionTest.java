package in.nammacrew.auth.redis;

import static org.junit.jupiter.api.Assertions.*;

import in.nammacrew.auth.foundation.*;
import java.net.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;

class OtpAdmissionTest {
  final Instant now = Instant.parse("2026-10-28T00:00:00Z");
  final RecoveryPolicy recovery =
      new RecoveryPolicy(
          RecoveryPolicy.Mode.NORMAL, UUID.randomUUID(), now.minusSeconds(90000), now, null);

  OtpPolicy policy() {
    return new OtpPolicy(
        "r2",
        List.of(
            new OtpPolicy.Limit(
                OtpPolicy.Gate.CHALLENGE, OtpPolicy.Dimension.PHONE, Duration.ofSeconds(60), 1),
            new OtpPolicy.Limit(
                OtpPolicy.Gate.CHALLENGE, OtpPolicy.Dimension.GLOBAL, Duration.ofMinutes(1), 100)));
  }

  OtpAdmission client(OtpAdmission.Transport t) {
    return new OtpAdmission(t, new byte[32], "test", Clock.fixed(now, ZoneOffset.UTC));
  }

  OtpAdmission.Operation op(OtpAdmission c) {
    return c.prepare(
        policy(),
        OtpPolicy.Gate.CHALLENGE,
        "+919000000001",
        InetAddress.getLoopbackAddress(),
        recovery);
  }

  OtpAdmission.Health health() {
    return new OtpAdmission.Health(recovery, true, true, true);
  }

  @Test
  void subjectPrivacyAndHashSlot() {
    var o = op(client((s, k, a, t) -> List.of("ALLOW", 0)));
    for (String k : o.keys()) {
      assertTrue(k.contains("{otp-prod}"));
      assertFalse(k.contains("919000000001"));
    }
    assertEquals(5, o.keys().size());
    assertFalse(o.toString().contains("919"));
  }

  @Test
  void sameOperationUsesIdenticalInput() {
    var calls = new ArrayList<List<String>>();
    var c =
        client(
            (s, k, a, t) -> {
              calls.add(a);
              return List.of("ALLOW", 0);
            });
    var o = op(c);
    c.admit(o, health());
    c.admit(o, health());
    assertEquals(calls.get(0), calls.get(1));
    assertThrows(UnsupportedOperationException.class, () -> o.arguments().clear());
  }

  @Test
  void operationIdsUniqueUnderConcurrency() throws Exception {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    var ids = ConcurrentHashMap.<String>newKeySet();
    try (var e = Executors.newFixedThreadPool(4)) {
      var futures = new ArrayList<Future<?>>();
      for (int i = 0; i < 100; i++) futures.add(e.submit(() -> ids.add(op(c).arguments().get(2))));
      for (var f : futures) f.get();
    }
    assertEquals(100, ids.size());
  }

  @Test
  void errorFailsClosed() {
    var c =
        client(
            (s, k, a, t) -> {
              throw new java.io.IOException("private details");
            });
    assertEquals(RedisLimiter.Status.UNAVAILABLE, c.admit(op(c), health()).status());
  }

  @Test
  void timeoutFailsClosed() {
    var c =
        client(
            (s, k, a, t) -> {
              throw new SocketTimeoutException();
            });
    assertEquals(RedisLimiter.Status.UNAVAILABLE, c.admit(op(c), health()).status());
  }

  @Test
  void lateResultFailsClosed() {
    var c =
        client(
            (s, k, a, t) -> {
              Thread.sleep(220);
              return List.of("ALLOW", 0);
            });
    assertEquals(RedisLimiter.Status.UNAVAILABLE, c.admit(op(c), health()).status());
  }

  @Test
  void generationMismatchNeverCallsTransport() {
    var c =
        client(
            (s, k, a, t) -> {
              fail();
              return null;
            });
    var different =
        new RecoveryPolicy(
            RecoveryPolicy.Mode.NORMAL, UUID.randomUUID(), now.minusSeconds(90000), now, null);
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        c.admit(op(c), new OtpAdmission.Health(different, true, true, true)).status());
  }

  @Test
  void missingReadinessEvidenceFailsClosed() {
    var c =
        client(
            (s, k, a, t) -> {
              fail();
              return null;
            });
    for (var h :
        List.of(
            new OtpAdmission.Health(recovery, false, true, true),
            new OtpAdmission.Health(recovery, true, false, true),
            new OtpAdmission.Health(recovery, true, true, false)))
      assertEquals(RedisLimiter.Status.UNAVAILABLE, c.admit(op(c), h).status());
  }

  @Test
  void restrictedCaps() {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    var r =
        new RecoveryPolicy(
            RecoveryPolicy.Mode.RESTRICTED,
            recovery.generation(),
            now.minusSeconds(90000),
            now,
            now.plusSeconds(60));
    var o = c.prepare(policy(), OtpPolicy.Gate.CHALLENGE, "+919000000001", null, r);
    assertTrue(o.arguments().contains("10"));
  }

  @Test
  void malformedSubjectsRejected() {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    assertThrows(
        IllegalArgumentException.class,
        () -> c.prepare(policy(), OtpPolicy.Gate.CHALLENGE, "raw", null, recovery));
    assertThrows(
        IllegalArgumentException.class,
        () -> c.prepare(policy(), OtpPolicy.Gate.CHALLENGE, null, null, recovery));
  }

  @Test
  void policyChangeKeepsQuotaKeys() {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    var a = op(c);
    var b =
        c.prepare(
            new OtpPolicy("r3", policy().limits()),
            OtpPolicy.Gate.CHALLENGE,
            "+919000000001",
            null,
            recovery);
    assertEquals(a.keys().subList(3, 5), b.keys().subList(3, 5));
    assertNotEquals(a.arguments().get(0), b.arguments().get(0));
  }

  @Test
  void malformedResponseFailsClosed() {
    var c = client((s, k, a, t) -> List.of("unexpected", 0));
    assertEquals(RedisLimiter.Status.UNAVAILABLE, c.admit(op(c), health()).status());
  }

  @Test
  void uncertainFailureQuarantinesFurtherCalls() {
    var count = new java.util.concurrent.atomic.AtomicInteger();
    var c =
        client(
            (s, k, a, t) -> {
              count.incrementAndGet();
              throw new java.io.IOException();
            });
    c.admit(op(c), health());
    c.admit(op(c), health());
    assertEquals(1, count.get());
  }

  @Test
  void socketIpIsHmacBound() throws Exception {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    var p =
        new OtpPolicy(
            "r2",
            List.of(
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.REQUEST_INGRESS,
                    OtpPolicy.Dimension.IP,
                    Duration.ofMinutes(1),
                    60)));
    var a =
        c.prepare(
            p,
            OtpPolicy.Gate.REQUEST_INGRESS,
            null,
            InetAddress.getByAddress(new byte[] {127, 0, 0, 1}),
            recovery);
    var b =
        c.prepare(
            p,
            OtpPolicy.Gate.REQUEST_INGRESS,
            null,
            InetAddress.getByAddress(new byte[] {127, 0, 0, 2}),
            recovery);
    assertNotEquals(a.keys().get(3), b.keys().get(3));
    assertFalse(a.keys().get(3).contains("127.0.0.1"));
  }

  @Test
  void expiredOperationNeverCallsTransport() {
    var c =
        client(
            (s, k, a, t) -> {
              fail();
              return null;
            });
    var o = op(c);
    var later =
        new OtpAdmission(
            (s, k, a, t) -> {
              fail();
              return null;
            },
            new byte[32],
            "test",
            Clock.fixed(now.plusSeconds(61), ZoneOffset.UTC));
    assertEquals(RedisLimiter.Status.UNAVAILABLE, later.admit(o, health()).status());
  }

  @Test
  void differentPayloadReplayRejection() {
    var c = client((s, k, a, t) -> List.of("UNAVAILABLE", 0));
    var res = c.admit(op(c), health());
    assertEquals(RedisLimiter.Status.UNAVAILABLE, res.status());
  }

  @Test
  void denialWithoutQuotaMutation() {
    long retryAt = now.plusSeconds(30).toEpochMilli();
    var c = client((s, k, a, t) -> List.of("DENY", retryAt));
    var res = c.admit(op(c), health());
    assertEquals(RedisLimiter.Status.DENY, res.status());
    assertEquals(retryAt, res.retryAtMillis());
  }

  @Test
  void multiWindowAtomicity() {
    var c = client((s, k, a, t) -> List.of("ALLOW", 0));
    var p =
        new OtpPolicy(
            "r2",
            List.of(
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.CHALLENGE, OtpPolicy.Dimension.PHONE, Duration.ofSeconds(60), 1),
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.CHALLENGE,
                    OtpPolicy.Dimension.GLOBAL,
                    Duration.ofMinutes(1),
                    100),
                new OtpPolicy.Limit(
                    OtpPolicy.Gate.CHALLENGE, OtpPolicy.Dimension.IP, Duration.ofMinutes(5), 20)));
    var o =
        c.prepare(
            p,
            OtpPolicy.Gate.CHALLENGE,
            "+919000000001",
            InetAddress.getLoopbackAddress(),
            recovery);
    assertEquals(6, o.keys().size());
    for (String k : o.keys()) {
      assertTrue(k.contains("{otp-prod}"));
    }
    assertEquals(10, o.arguments().size());
  }

  @Test
  void ttlNonrenewal() {
    var c = client((s, k, a, t) -> List.of("DENY", now.plusSeconds(45).toEpochMilli()));
    var o = op(c);
    var res = c.admit(o, health());
    assertEquals(RedisLimiter.Status.DENY, res.status());
    assertEquals(now.plusSeconds(60).toEpochMilli(), Long.parseLong(o.arguments().get(3)));
  }
}
