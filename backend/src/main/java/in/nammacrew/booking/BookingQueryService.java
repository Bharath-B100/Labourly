package in.nammacrew.booking;

import in.nammacrew.booking.BookingDTOs.BookingView;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class BookingQueryService {

  private final JdbcTemplate sql;

  public BookingQueryService(JdbcTemplate sql) {
    this.sql = sql;
  }

  public List<BookingView> getCustomerBookings(UUID customerId) {
    return sql.query(
        "SELECT b.id, b.status, b.starts_at, b.ends_at, b.amount, b.currency, b.pricing_basis, "
            + "lr.id as req_id, lr.title as req_title, u.id as worker_id, u.display_name as worker_name "
            + "FROM bookings b "
            + "JOIN quotations q ON b.quotation_id = q.id "
            + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
            + "JOIN users u ON q.worker_id = u.id "
            + "WHERE lr.customer_id = ? "
            + "ORDER BY b.starts_at DESC",
        (rs, rowNum) ->
            new BookingView(
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
                rs.getString("status")),
        customerId);
  }

  public List<BookingView> getWorkerBookings(UUID workerId) {
    return sql.query(
        "SELECT b.id, b.status, b.starts_at, b.ends_at, b.amount, b.currency, b.pricing_basis, "
            + "lr.id as req_id, lr.title as req_title, u.id as worker_id, u.display_name as worker_name "
            + "FROM bookings b "
            + "JOIN quotations q ON b.quotation_id = q.id "
            + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
            + "JOIN users u ON q.worker_id = u.id "
            + "WHERE q.worker_id = ? "
            + "ORDER BY b.starts_at DESC",
        (rs, rowNum) ->
            new BookingView(
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
                rs.getString("status")),
        workerId);
  }
}
