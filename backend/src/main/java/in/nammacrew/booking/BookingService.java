package in.nammacrew.booking;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
  private final BookingRepository bookings;

  public BookingService(BookingRepository bookings) {
    this.bookings = bookings;
  }

  // Internal foundation only: no HTTP mutation endpoint in Phase 1.
  @Transactional
  @PreAuthorize("hasRole('ADMIN')")
  public void transition(UUID id, BookingState next) {
    transitionInternal(id, next);
  }

  /**
   * Unsecured transition for internal service-to-service calls (e.g. QuotationService accepting a
   * quote). Callers must ensure authorization has already been enforced at the calling layer.
   */
  @Transactional
  public void transitionInternal(UUID id, BookingState next) {
    Booking booking =
        bookings
            .findForUpdate(id)
            .orElseThrow(() -> new IllegalArgumentException("Unknown booking"));
    booking.transitionTo(next);
    // PostgreSQL synchronizes assignment reservations and enforces exclusion atomically.
    bookings.flush();
  }
}
