package in.nammacrew.booking;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class BookingStateTest {
  @Test
  void onlyDocumentedTransitionsAreAllowed() {
    int allowed = 0;
    for (BookingState from : BookingState.values())
      for (BookingState to : BookingState.values()) if (from.canTransitionTo(to)) allowed++;
    assertEquals(5, allowed);
    assertTrue(BookingState.PENDING.canTransitionTo(BookingState.CONFIRMED));
    assertFalse(BookingState.COMPLETED.canTransitionTo(BookingState.CONFIRMED));
    assertFalse(BookingState.IN_PROGRESS.canTransitionTo(BookingState.CANCELLED));
  }
}
