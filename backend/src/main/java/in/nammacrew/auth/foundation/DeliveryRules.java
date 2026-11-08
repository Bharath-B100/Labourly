package in.nammacrew.auth.foundation;

import java.time.*;
import java.util.*;

public final class DeliveryRules {
  private DeliveryRules() {}

  public enum State {
    PENDING,
    CLAIMED,
    SENDING,
    RETRY_WAIT,
    ACCEPTED,
    DELIVERED,
    FAILED,
    UNKNOWN,
    EXPIRED,
    CANCELLED
  }

  public enum Attempt {
    STARTED,
    DEFINITELY_NOT_SENT,
    REJECTED,
    UNKNOWN,
    ACCEPTED,
    DELIVERED,
    UNDELIVERED
  }

  public record AttemptResult(Attempt outcome, boolean retryable) {
    public AttemptResult {
      Objects.requireNonNull(outcome);
      if (retryable && outcome != Attempt.DEFINITELY_NOT_SENT)
        throw new IllegalArgumentException("Unsafe retry");
    }
  }

  public static boolean permits(State from, State to) {
    Objects.requireNonNull(from);
    Objects.requireNonNull(to);
    return switch (from) {
      case PENDING, RETRY_WAIT ->
          Set.of(State.CLAIMED, State.EXPIRED, State.CANCELLED).contains(to);
      case CLAIMED ->
          Set.of(State.SENDING, State.PENDING, State.EXPIRED, State.CANCELLED).contains(to);
      case SENDING ->
          Set.of(State.ACCEPTED, State.FAILED, State.UNKNOWN, State.RETRY_WAIT).contains(to);
      case ACCEPTED -> to == State.DELIVERED || to == State.FAILED;
      case UNKNOWN -> to == State.ACCEPTED || to == State.DELIVERED || to == State.FAILED;
      default -> false;
    };
  }

  /** Repository must enforce this predicate atomically with claim/attempt insertion. */
  public static boolean claimable(State state, List<AttemptResult> attempts) {
    Objects.requireNonNull(state);
    attempts = List.copyOf(attempts);
    return (state == State.PENDING || state == State.RETRY_WAIT)
        && attempts.size() < 3
        && attempts.stream()
            .allMatch(a -> a.outcome() == Attempt.DEFINITELY_NOT_SENT && a.retryable());
  }

  public record Permit(
      UUID owner, long fence, UUID generation, Instant leaseUntil, Instant expiresAt) {
    public Permit {
      Objects.requireNonNull(owner);
      Objects.requireNonNull(generation);
      Objects.requireNonNull(leaseUntil);
      Objects.requireNonNull(expiresAt);
      if (fence < 1) throw new IllegalArgumentException("Invalid fence");
    }

    public boolean eligible(
        UUID actualOwner,
        long actualFence,
        UUID activeGeneration,
        Instant now,
        boolean currentChallenge,
        boolean activeChallenge,
        boolean recoveryOpen) {
      Objects.requireNonNull(now);
      return owner.equals(actualOwner)
          && fence == actualFence
          && generation.equals(activeGeneration)
          && currentChallenge
          && activeChallenge
          && recoveryOpen
          && !leaseUntil.isBefore(now.plusSeconds(10))
          && !expiresAt.isBefore(now.plusSeconds(15));
    }
  }

  /** In-process single-use guard only, not distributed fencing. */
  public static final class SendOnce {
    private final java.util.concurrent.atomic.AtomicBoolean used =
        new java.util.concurrent.atomic.AtomicBoolean();

    public boolean consume(Duration elapsed, boolean cancelled) {
      Objects.requireNonNull(elapsed);
      return used.compareAndSet(false, true)
          && !cancelled
          && !elapsed.isNegative()
          && elapsed.compareTo(Duration.ofSeconds(1)) <= 0;
    }
  }
}
