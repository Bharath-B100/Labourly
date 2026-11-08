package in.nammacrew.auth.foundation;

import java.time.*;
import java.util.*;

public final class IdempotencyDecision {
  private IdempotencyDecision() {}

  public enum Result {
    NORMAL_ADMISSION,
    REPLAY_ACKNOWLEDGEMENT,
    INVALID_REQUEST,
    UNAVAILABLE
  }

  public record Existing(
      boolean current,
      boolean verified,
      boolean locked,
      Instant expiresAt,
      DeliveryRules.State delivery) {
    public Existing {
      Objects.requireNonNull(expiresAt);
      Objects.requireNonNull(delivery);
    }
  }

  public static Result decide(String key, Instant now, boolean ingressReady, Existing existing) {
    Objects.requireNonNull(now);
    if (!ingressReady) return Result.UNAVAILABLE;
    if (key == null) return Result.NORMAL_ADMISSION;
    if (key.length() > 64
        || !key.matches(
            "v1\\.[0-9]{1,12}\\.[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"))
      return Result.INVALID_REQUEST;
    Instant issued;
    try {
      issued = Instant.ofEpochSecond(Long.parseLong(key.split("\\.")[1]));
    } catch (RuntimeException e) {
      return Result.INVALID_REQUEST;
    }
    if (existing == null)
      return issued.isBefore(now.minusSeconds(300)) || issued.isAfter(now.plusSeconds(60))
          ? Result.INVALID_REQUEST
          : Result.NORMAL_ADMISSION;
    if (!existing.current()
        || existing.verified()
        || existing.locked()
        || !existing.expiresAt().isAfter(now)
        || Set.of(
                DeliveryRules.State.FAILED,
                DeliveryRules.State.CANCELLED,
                DeliveryRules.State.EXPIRED)
            .contains(existing.delivery())) return Result.INVALID_REQUEST;
    return Result.REPLAY_ACKNOWLEDGEMENT;
  }
}
