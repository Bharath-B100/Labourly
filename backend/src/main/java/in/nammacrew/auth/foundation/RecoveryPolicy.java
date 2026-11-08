package in.nammacrew.auth.foundation;

import java.time.*;
import java.util.*;

public record RecoveryPolicy(
    Mode mode, UUID generation, Instant quiescedAt, Instant approvedAt, Instant restrictedUntil) {
  public enum Mode {
    CLOSED,
    RESTRICTED,
    NORMAL
  }

  public RecoveryPolicy {
    Objects.requireNonNull(mode);
    Objects.requireNonNull(generation);
    Objects.requireNonNull(quiescedAt);
    if (mode == Mode.RESTRICTED
        && (approvedAt == null
            || restrictedUntil == null
            || approvedAt.isBefore(quiescedAt)
            || !restrictedUntil.isAfter(approvedAt)
            || restrictedUntil.isAfter(approvedAt.plusSeconds(3600))))
      throw new IllegalArgumentException("Restricted expiry required");
  }

  public boolean permits(
      Instant now,
      UUID redisGeneration,
      boolean operatorApproved,
      boolean redisHealthy,
      boolean durableHistoryComplete) {
    Objects.requireNonNull(now);
    if (!operatorApproved
        || !redisHealthy
        || !durableHistoryComplete
        || !generation.equals(redisGeneration)
        || now.isBefore(quiescedAt)) return false;
    return switch (mode) {
      case CLOSED -> false;
      case NORMAL -> !now.isBefore(quiescedAt.plus(Duration.ofDays(1)));
      case RESTRICTED -> !now.isBefore(approvedAt) && now.isBefore(restrictedUntil);
    };
  }

  public int dispatchCap(Duration window) {
    Objects.requireNonNull(window);
    if (mode == Mode.CLOSED) return 0;
    if (window.equals(Duration.ofMinutes(1))) return mode == Mode.RESTRICTED ? 10 : 100;
    if (window.equals(Duration.ofHours(1))) return mode == Mode.RESTRICTED ? 50 : 1000;
    if (window.equals(Duration.ofDays(1))) return mode == Mode.RESTRICTED ? 100 : 5000;
    throw new IllegalArgumentException("Unsupported recovery window");
  }
}
