package in.nammacrew.auth.foundation;

import static org.junit.jupiter.api.Assertions.*;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class AdmissionDecisionTest {
  @Test
  void allWindowsMustAdmitAndInputUnchanged() {
    var small = new AdmissionDecision.Window(1000, 2, List.of(100000000L));
    var large = new AdmissionDecision.Window(60000, 1, List.of(100000000L));
    assertEquals(
        RedisLimiter.Status.DENY,
        AdmissionDecision.decide(100000001, List.of(small, large)).status());
    assertEquals(1, small.scores().size());
  }

  @Test
  void expiryBoundaryAndLoweredCapacityRank() {
    assertEquals(
        RedisLimiter.Status.ALLOW,
        AdmissionDecision.decide(
                100001000, List.of(new AdmissionDecision.Window(1000, 1, List.of(100000000L))))
            .status());
    assertEquals(
        100001002,
        AdmissionDecision.decide(
                100000010,
                List.of(
                    new AdmissionDecision.Window(
                        1000, 1, List.of(100000000L, 100000001L, 100000002L))))
            .retryAtMillis());
  }

  @Test
  void futureClockStateAndMalformedInputsFailClosed() {
    assertEquals(
        RedisLimiter.Status.UNAVAILABLE,
        AdmissionDecision.decide(
                100000000, List.of(new AdmissionDecision.Window(1000, 1, List.of(100000001L))))
            .status());
    assertThrows(
        IllegalArgumentException.class, () -> AdmissionDecision.decide(100000000, List.of()));
  }

  @Test
  void contextBindsEveryIdentityAndExpiry() {
    var d = UUID.randomUUID();
    var c = UUID.randomUUID();
    var now = Instant.EPOCH;
    var a = new OtpContext(d, c, "fake", "v1", now);
    assertFalse(Arrays.equals(a.aad(), new OtpContext(d, c, "fake", "v2", now).aad()));
    assertFalse(
        Arrays.equals(a.aad(), new OtpContext(d, c, "fake", "v1", now.plusSeconds(1)).aad()));
    assertThrows(IllegalArgumentException.class, () -> new OtpContext(d, c, "fake|bad", "v1", now));
  }
}
