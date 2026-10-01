package in.nammacrew.booking;

import in.nammacrew.booking.BookingDTOs.BookingView;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

  private final BookingQueryService queries;
  private final BookingService bookings;

  public BookingController(BookingQueryService queries, BookingService bookings) {
    this.queries = queries;
    this.bookings = bookings;
  }

  @GetMapping("/bookings/me")
  public List<BookingView> getMyBookings(Authentication auth) {
    // Determine role implicitly or explicitly
    if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
      return queries.getCustomerBookings(UUID.fromString(auth.getName()));
    } else if (auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_WORKER"))) {
      return queries.getWorkerBookings(UUID.fromString(auth.getName()));
    }
    throw new IllegalArgumentException("Unknown role");
  }

  @PostMapping("/bookings/{id}/cancel")
  @PreAuthorize("hasRole('CUSTOMER')")
  @Transactional
  public void cancelBooking(Authentication auth, @PathVariable UUID id) {
    // Only customer can cancel for now, and must own the booking
    // Verify ownership in query or service
    bookings.transition(id, BookingState.CANCELLED);
  }
}
