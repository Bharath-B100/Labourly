package in.nammacrew.booking;

import in.nammacrew.notification.NotificationService;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
  private final BookingRepository bookings;
  private final org.springframework.jdbc.core.JdbcTemplate jdbc;
  private final NotificationService notifications;

  public BookingService(
      BookingRepository bookings,
      org.springframework.jdbc.core.JdbcTemplate jdbc,
      NotificationService notifications) {
    this.bookings = bookings;
    this.jdbc = jdbc;
    this.notifications = notifications;
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

  @Transactional
  public void cancelBooking(UUID userId, UUID bookingId, String reason) {
    if (reason == null || reason.isBlank() || reason.trim().length() > 2000) {
      throw new in.nammacrew.auth.AuthFailure(
          400, "Provide a cancellation reason of 1–2000 characters.");
    }
    // We must verify the user is either the customer or the worker of this booking.
    // We use JdbcTemplate since the JPA entity is minimal and doesn't map all joins.
    Boolean isParticipant =
        jdbc.queryForObject(
            "SELECT EXISTS("
                + "SELECT 1 FROM bookings b "
                + "LEFT JOIN quotations q ON b.quotation_id = q.id "
                + "LEFT JOIN labour_requirements lr ON q.requirement_id = lr.id "
                + "LEFT JOIN booking_workers bw ON b.id = bw.booking_id "
                + "WHERE b.id = ? AND (lr.customer_id = ? OR bw.worker_id = ?))",
            Boolean.class,
            bookingId,
            userId,
            userId);

    if (isParticipant == null || !isParticipant) {
      throw new in.nammacrew.auth.AuthFailure(404, "Booking not found.");
    }
    Booking booking =
        bookings
            .findForUpdate(bookingId)
            .orElseThrow(() -> new in.nammacrew.auth.AuthFailure(404, "Booking not found."));
    if (booking.getStatus() != BookingState.CONFIRMED)
      throw new in.nammacrew.auth.AuthFailure(409, "Only confirmed bookings can be cancelled.");
    booking.transitionTo(BookingState.CANCELLED);
    bookings.flush();
    jdbc.update(
        "UPDATE bookings SET cancelled_by = ?, cancel_reason = ?, cancelled_at = now() WHERE id = ?",
        userId,
        reason.trim(),
        bookingId);

    try {
      var participants =
          jdbc.queryForList(
              "SELECT lr.customer_id, bw.worker_id "
                  + "FROM bookings b "
                  + "LEFT JOIN quotations q ON b.quotation_id = q.id "
                  + "LEFT JOIN labour_requirements lr ON q.requirement_id = lr.id "
                  + "LEFT JOIN booking_workers bw ON b.id = bw.booking_id "
                  + "WHERE b.id = ?",
              bookingId);
      if (!participants.isEmpty()) {
        var row = participants.get(0);
        UUID customerId = (UUID) row.get("customer_id");
        UUID workerId = (UUID) row.get("worker_id");
        UUID recipient = userId.equals(customerId) ? workerId : customerId;
        if (recipient != null) {
          notifications.sendNotification(
              recipient,
              "Booking Cancelled",
              (userId.equals(customerId) ? "Customer" : "Worker")
                  + " cancelled the booking. Reason: "
                  + reason.trim(),
              "BOOKING_CANCELLED",
              bookingId);
        }
      }
    } catch (Exception ignored) {
    }
  }
}
