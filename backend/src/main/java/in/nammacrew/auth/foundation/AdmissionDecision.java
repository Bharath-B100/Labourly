package in.nammacrew.auth.foundation;

import java.util.*;

/** Pure rolling-window oracle for testing the Lua contract; not an alternative active limiter. */
public final class AdmissionDecision {
  private AdmissionDecision() {}

  public record Window(long durationMillis, int capacity, List<Long> scores) {
    public Window {
      if (durationMillis < 1 || durationMillis > 86400000 || capacity < 1 || capacity > 100000)
        throw new IllegalArgumentException("Invalid window");
      scores = List.copyOf(scores);
      if (scores.stream().anyMatch(s -> s < 0)) throw new IllegalArgumentException("Invalid score");
    }
  }

  public static RedisLimiter.Result decide(long now, List<Window> windows) {
    if (now < 86400000 || windows == null || windows.isEmpty() || windows.size() > 64)
      throw new IllegalArgumentException("Invalid admission");
    long retry = 0;
    for (var w : windows) {
      if (w.scores().stream().anyMatch(s -> s > now))
        return new RedisLimiter.Result(RedisLimiter.Status.UNAVAILABLE, 0);
      var live = w.scores().stream().filter(s -> s > now - w.durationMillis()).sorted().toList();
      if (live.size() >= w.capacity())
        retry =
            Math.max(
                retry, Math.addExact(live.get(live.size() - w.capacity()), w.durationMillis()));
    }
    return new RedisLimiter.Result(
        retry == 0 ? RedisLimiter.Status.ALLOW : RedisLimiter.Status.DENY, retry);
  }
}
