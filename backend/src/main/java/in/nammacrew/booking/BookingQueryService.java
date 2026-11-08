package in.nammacrew.booking;

import in.nammacrew.booking.BookingDTOs.BookingView;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class BookingQueryService {

  private final JdbcTemplate sql;

  private static final String SELECT_BOOKING =
      "SELECT b.cancel_reason, b.cancelled_at, actor.display_name AS cancelled_by_name, "
          + "CASE WHEN b.cancelled_by=lr.customer_id THEN 'CUSTOMER' WHEN b.cancelled_by=q.worker_id THEN 'WORKER' ELSE NULL END AS cancelled_by_role, "
          + "b.id, b.status, b.starts_at, b.ends_at, b.amount, b.currency, b.pricing_basis, "
          + "lr.id as req_id, lr.title as req_title, lr.customer_id as customer_id, "
          + "u.id as worker_id, u.display_name as worker_name "
          + "FROM bookings b "
          + "JOIN quotations q ON b.quotation_id = q.id "
          + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
          + "JOIN users u ON q.worker_id = u.id "
          + "LEFT JOIN users actor ON actor.id=b.cancelled_by ";

  private static BookingView mapRow(java.sql.ResultSet rs, int rowNum)
      throws java.sql.SQLException {
    return new BookingView(
        UUID.fromString(rs.getString("id")),
        UUID.fromString(rs.getString("req_id")),
        rs.getString("req_title"),
        UUID.fromString(rs.getString("worker_id")),
        rs.getString("worker_name"),
        rs.getBigDecimal("amount"),
        rs.getString("currency"),
        rs.getString("pricing_basis"),
        rs.getTimestamp("starts_at").toInstant(),
        rs.getTimestamp("ends_at").toInstant(),
        rs.getString("status"),
        rs.getString("cancel_reason"),
        rs.getString("cancelled_by_name"),
        rs.getString("cancelled_by_role"),
        rs.getTimestamp("cancelled_at") == null
            ? null
            : rs.getTimestamp("cancelled_at").toInstant(),
        UUID.fromString(rs.getString("customer_id")));
  }

  public BookingQueryService(JdbcTemplate sql) {
    this.sql = sql;
  }

  public List<BookingView> getCustomerBookings(UUID customerId) {
    return sql.query(
        SELECT_BOOKING + "WHERE lr.customer_id = ? ORDER BY b.starts_at DESC",
        BookingQueryService::mapRow,
        customerId);
  }

  public List<BookingView> getWorkerBookings(UUID workerId) {
    return sql.query(
        SELECT_BOOKING + "WHERE q.worker_id = ? ORDER BY b.starts_at DESC",
        BookingQueryService::mapRow,
        workerId);
  }

  public BookingView getBookingDetails(UUID userId, UUID bookingId) {
    List<BookingView> results =
        sql.query(
            SELECT_BOOKING + "WHERE b.id = ? AND (lr.customer_id = ? OR q.worker_id = ?)",
            BookingQueryService::mapRow,
            bookingId,
            userId,
            userId);
    if (results.isEmpty()) throw new in.nammacrew.auth.AuthFailure(404, "Booking not found.");
    return results.get(0);
  }

  /** Returns the booking if the caller is either the customer or the worker */
  public Optional<BookingView> getBookingForUser(UUID bookingId, UUID callerId) {
    List<BookingView> results =
        sql.query(
            SELECT_BOOKING + "WHERE b.id = ? AND (lr.customer_id = ? OR q.worker_id = ?)",
            BookingQueryService::mapRow,
            bookingId,
            callerId,
            callerId);
    return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
  }
}
