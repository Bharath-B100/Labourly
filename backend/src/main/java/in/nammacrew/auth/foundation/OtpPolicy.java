package in.nammacrew.auth.foundation;

import java.time.Duration;
import java.util.*;

/** Explicit values only: not a Spring bean or active configuration default. */
public record OtpPolicy(String version, List<Limit> limits) {
  public enum Gate {
    REQUEST_INGRESS,
    VERIFY_INGRESS,
    CHALLENGE,
    VERIFY,
    DISPATCH
  }

  public enum Dimension {
    PHONE,
    IP,
    GLOBAL,
    DEVICE
  }

  public record Limit(Gate gate, Dimension dimension, Duration window, int capacity) {
    public Limit {
      Objects.requireNonNull(gate);
      Objects.requireNonNull(dimension);
      Objects.requireNonNull(window);
      if (window.isZero()
          || window.isNegative()
          || window.compareTo(Duration.ofDays(1)) > 0
          || window.toMillis() < 1
          || window.toNanos() % 1_000_000 != 0
          || capacity < 1
          || capacity > 100_000) throw new IllegalArgumentException("Invalid limit");
    }
  }

  public OtpPolicy {
    if (version == null || !version.matches("[a-zA-Z0-9_-]{1,64}"))
      throw new IllegalArgumentException("Invalid policy version");
    limits = List.copyOf(limits);
    if (limits.isEmpty() || limits.size() > 64)
      throw new IllegalArgumentException("Invalid limit count");
    var unique = new HashSet<String>();
    for (var l : limits)
      if (!unique.add(l.gate() + ":" + l.dimension() + ":" + l.window()))
        throw new IllegalArgumentException("Duplicate limit");
  }
}
