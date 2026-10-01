package in.nammacrew.marketplace;

import in.nammacrew.booking.BookingService;
import in.nammacrew.booking.BookingState;
import in.nammacrew.marketplace.QuotationDTOs.QuoteView;
import in.nammacrew.marketplace.QuotationDTOs.SubmitQuoteRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuotationService {

  private final JdbcTemplate sql;
  private final BookingService bookings;

  public QuotationService(JdbcTemplate sql, BookingService bookings) {
    this.sql = sql;
    this.bookings = bookings;
  }

  @Transactional
  public UUID submitQuote(UUID workerId, UUID requirementId, SubmitQuoteRequest req) {
    // Check eligibility
    Boolean eligible =
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM labour_requirements WHERE id = ? AND status = 'OPEN')",
            Boolean.class,
            requirementId);
    if (eligible == null || !eligible) {
      throw new IllegalArgumentException("Requirement is not open");
    }

    UUID quoteId =
        sql.queryForObject(
            "INSERT INTO quotations(requirement_id, worker_id, amount, pricing_basis, starts_at, duration_days, worker_note) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
            UUID.class,
            requirementId,
            workerId,
            req.amount(),
            req.pricingBasis(),
            java.sql.Timestamp.from(req.startsAt()),
            req.durationDays(),
            req.workerNote());
    return quoteId;
  }

  @Transactional
  public UUID acceptQuote(UUID customerId, UUID quoteId) {
    // Lock quote and verify customer ownership
    QuoteView q =
        sql.queryForObject(
            "SELECT q.*, u.display_name as worker_name, lr.title as req_title "
                + "FROM quotations q "
                + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
                + "JOIN users u ON q.worker_id = u.id "
                + "WHERE q.id = ? AND lr.customer_id = ? FOR UPDATE",
            (rs, rowNum) ->
                new QuoteView(
                    UUID.fromString(rs.getString("id")),
                    UUID.fromString(rs.getString("requirement_id")),
                    UUID.fromString(rs.getString("worker_id")),
                    rs.getBigDecimal("amount"),
                    rs.getString("currency"),
                    rs.getString("pricing_basis"),
                    rs.getTimestamp("starts_at").toInstant(),
                    rs.getInt("duration_days"),
                    rs.getString("worker_note"),
                    rs.getString("status"),
                    rs.getTimestamp("created_at").toInstant(),
                    rs.getString("worker_name"),
                    null,
                    rs.getString("req_title")),
            quoteId,
            customerId);

    if (q == null) throw new IllegalArgumentException("Quote not found");
    if ("ACCEPTED".equals(q.status())) {
      // Idempotency: return existing booking ID
      return sql.queryForObject(
          "SELECT id FROM bookings WHERE quotation_id = ?", UUID.class, quoteId);
    }
    if (!"SUBMITTED".equals(q.status())) throw new IllegalStateException("Quote is not SUBMITTED");

    // Lock requirement to prevent concurrent acceptance of different quotes
    String reqStatus =
        sql.queryForObject(
            "SELECT status FROM labour_requirements WHERE id = ? FOR UPDATE",
            String.class,
            q.requirementId());
    if (!"OPEN".equals(reqStatus)) {
      throw new IllegalStateException("Requirement is no longer open");
    }

    // Close requirement and mark other quotes rejected
    sql.update("UPDATE quotations SET status = 'ACCEPTED' WHERE id = ?", quoteId);
    sql.update(
        "UPDATE quotations SET status = 'REJECTED' WHERE requirement_id = ? AND status = 'SUBMITTED' AND id != ?",
        q.requirementId(),
        quoteId);
    sql.update("UPDATE labour_requirements SET status = 'CLOSED' WHERE id = ?", q.requirementId());

    // Create booking
    UUID bookingId =
        sql.queryForObject(
            "INSERT INTO bookings(quotation_id, amount, currency, pricing_basis, starts_at, ends_at) "
                + "VALUES (?, ?, ?, ?, ?, ?::timestamptz + (? || ' days')::interval) RETURNING id",
            UUID.class,
            quoteId,
            q.amount(),
            q.currency(),
            q.pricingBasis(),
            java.sql.Timestamp.from(q.startsAt()),
            java.sql.Timestamp.from(q.startsAt()),
            q.durationDays());

    sql.update(
        "INSERT INTO booking_workers(booking_id, worker_id, starts_at, ends_at, reserved) "
            + "VALUES (?, ?, ?, ?::timestamptz + (? || ' days')::interval, false)",
        bookingId,
        q.workerId(),
        java.sql.Timestamp.from(q.startsAt()),
        java.sql.Timestamp.from(q.startsAt()),
        q.durationDays());

    // Trigger confirmation through Phase 1 invariant protections (auth enforced above at service
    // boundary)
    bookings.transitionInternal(bookingId, BookingState.CONFIRMED);
    return bookingId;
  }

  @Transactional
  public void rejectQuote(UUID customerId, UUID quoteId) {
    int rows =
        sql.update(
            "UPDATE quotations q SET status = 'REJECTED' "
                + "FROM labour_requirements lr "
                + "WHERE q.requirement_id = lr.id AND lr.customer_id = ? AND q.id = ? AND q.status = 'SUBMITTED'",
            customerId,
            quoteId);
    if (rows == 0) throw new IllegalArgumentException("Invalid quote or not authorized");
  }

  @Transactional
  public void withdrawQuote(UUID workerId, UUID quoteId) {
    int rows =
        sql.update(
            "UPDATE quotations SET status = 'WITHDRAWN' WHERE id = ? AND worker_id = ? AND status = 'SUBMITTED'",
            quoteId,
            workerId);
    if (rows == 0) throw new IllegalArgumentException("Invalid quote or not authorized");
  }

  public List<QuoteView> getRequirementQuotes(UUID customerId, UUID requirementId) {
    return sql.query(
        "SELECT q.*, null as worker_name, null as primary_trade, null as req_title "
            + "FROM quotations q "
            + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
            + "WHERE q.requirement_id = ? AND lr.customer_id = ? ORDER BY q.created_at DESC",
        (rs, rowNum) ->
            new QuoteView(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("requirement_id")),
                UUID.fromString(rs.getString("worker_id")),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getString("pricing_basis"),
                rs.getTimestamp("starts_at").toInstant(),
                rs.getInt("duration_days"),
                rs.getString("worker_note"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getString("worker_name"),
                rs.getString("primary_trade"),
                rs.getString("req_title")),
        requirementId,
        customerId);
  }

  public List<QuoteView> getMyQuotes(UUID workerId) {
    return sql.query(
        "SELECT q.*, null as worker_name, null as primary_trade, lr.title as req_title "
            + "FROM quotations q "
            + "JOIN labour_requirements lr ON q.requirement_id = lr.id "
            + "WHERE q.worker_id = ? ORDER BY q.created_at DESC",
        (rs, rowNum) ->
            new QuoteView(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("requirement_id")),
                UUID.fromString(rs.getString("worker_id")),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getString("pricing_basis"),
                rs.getTimestamp("starts_at").toInstant(),
                rs.getInt("duration_days"),
                rs.getString("worker_note"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getString("worker_name"),
                rs.getString("primary_trade"),
                rs.getString("req_title")),
        workerId);
  }
}
