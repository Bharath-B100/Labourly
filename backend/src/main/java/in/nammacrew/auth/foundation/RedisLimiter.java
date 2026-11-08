package in.nammacrew.auth.foundation;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Script contract only. No Redis client, startup hook or authentication wiring. */
public final class RedisLimiter {
  private RedisLimiter() {}

  public enum Status {
    ALLOW,
    DENY,
    UNAVAILABLE
  }

  public record Result(Status status, long retryAtMillis) {
    public Result {
      Objects.requireNonNull(status);
      if (retryAtMillis < 0 || (status != Status.DENY && retryAtMillis != 0))
        throw new IllegalArgumentException("Invalid limiter result");
    }
  }

  public static Result parse(List<?> values) {
    if (values == null || values.size() != 2) return new Result(Status.UNAVAILABLE, 0);
    try {
      return new Result(
          Status.valueOf(values.get(0).toString()), Long.parseLong(values.get(1).toString()));
    } catch (RuntimeException e) {
      return new Result(Status.UNAVAILABLE, 0);
    }
  }

  public static String script() {
    try (var stream = RedisLimiter.class.getResourceAsStream("/otp/admit.lua")) {
      if (stream == null) throw new IllegalStateException("Missing limiter script");
      return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IllegalStateException("Cannot read limiter script");
    }
  }
}
