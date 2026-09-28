package in.nammacrew.booking;

public enum BookingState {
  PENDING,
  CONFIRMED,
  IN_PROGRESS,
  COMPLETED,
  CANCELLED;

  public boolean canTransitionTo(BookingState next) {
    return switch (this) {
      case PENDING -> next == CONFIRMED || next == CANCELLED;
      case CONFIRMED -> next == IN_PROGRESS || next == CANCELLED;
      case IN_PROGRESS -> next == COMPLETED;
      case COMPLETED, CANCELLED -> false;
    };
  }
}
