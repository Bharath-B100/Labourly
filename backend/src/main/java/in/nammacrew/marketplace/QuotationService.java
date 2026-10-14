package in.nammacrew.marketplace;

import in.nammacrew.auth.AuthFailure;
import in.nammacrew.booking.BookingService;
import in.nammacrew.booking.BookingState;
import in.nammacrew.marketplace.QuotationDTOs.QuoteView;
import in.nammacrew.marketplace.QuotationDTOs.SubmitQuoteRequest;
import in.nammacrew.notification.NotificationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuotationService {
  private final JdbcTemplate sql;
  private final BookingService bookings;
  private final ServiceCoverage coverage;
  private final NotificationService notifications;
  private static final String VIEW =
      "SELECT q.*, b.id AS booking_id, b.status AS booking_status, u.display_name AS worker_name, c.name AS primary_trade, lr.title AS req_title FROM quotations q LEFT JOIN bookings b ON b.quotation_id=q.id JOIN labour_requirements lr ON q.requirement_id=lr.id JOIN users u ON q.worker_id=u.id JOIN worker_profiles wp ON wp.user_id=u.id LEFT JOIN labour_categories c ON wp.primary_trade_id=c.id ";

  public QuotationService(
      JdbcTemplate sql,
      BookingService bookings,
      ServiceCoverage coverage,
      NotificationService notifications) {
    this.sql = sql;
    this.bookings = bookings;
    this.coverage = coverage;
    this.notifications = notifications;
  }

  private void validate(SubmitQuoteRequest req) {
    if (req == null
        || req.amount() == null
        || req.amount().signum() <= 0
        || req.amount().compareTo(new BigDecimal("9999999999.99")) > 0
        || req.amount().stripTrailingZeros().scale() > 2
        || req.pricingBasis() == null
        || !Set.of("FIXED_TOTAL", "PER_DAY", "PER_WORKER_PER_DAY").contains(req.pricingBasis())
        || req.startsAt() == null
        || req.durationDays() < 1
        || req.durationDays() > 3650
        || (req.workerNote() != null && req.workerNote().length() > 2000))
      throw new AuthFailure(
          400,
          "Provide a positive amount with at most two decimals, a valid pricing basis, start time and duration (1–3650 days); notes must be at most 2000 characters.");
  }

  private String lockRequirement(UUID id) {
    var states =
        sql.query(
            "SELECT status FROM labour_requirements WHERE id=? FOR UPDATE",
            (rs, n) -> rs.getString(1),
            id);
    if (states.isEmpty()) throw new AuthFailure(404, "Requirement not found.");
    return states.get(0);
  }

  private void open(String status) {
    if (!"OPEN".equals(status)) throw new AuthFailure(409, "Requirement is no longer open.");
  }

  private UUID ownedRequirement(UUID actor, UUID quote, boolean customer) {
    var ids =
        sql.query(
            "SELECT q.requirement_id FROM quotations q LEFT JOIN bookings b ON b.quotation_id=q.id JOIN labour_requirements lr ON lr.id=q.requirement_id WHERE q.id=? AND "
                + (customer ? "lr.customer_id" : "q.worker_id")
                + "=?",
            (rs, n) -> rs.getObject(1, UUID.class),
            quote,
            actor);
    if (ids.isEmpty()) throw new AuthFailure(404, "Quotation not found.");
    return ids.get(0);
  }

  private QuoteView view(UUID quote) {
    return sql.queryForObject(VIEW + "WHERE q.id=? FOR UPDATE OF q", this::map, quote);
  }

  private QuoteView map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new QuoteView(
        rs.getObject("id", UUID.class),
        rs.getObject("requirement_id", UUID.class),
        rs.getObject("worker_id", UUID.class),
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
        rs.getString("req_title"),
        rs.getObject("booking_id", UUID.class),
        rs.getString("booking_status"));
  }

  private void submitted(QuoteView q) {
    if (!"SUBMITTED".equals(q.status()))
      throw new AuthFailure(409, "Quotation is no longer submitted.");
  }

  @Transactional
  public UUID submitQuote(UUID worker, UUID requirement, SubmitQuoteRequest req) {
    validate(req);
    open(lockRequirement(requirement));
    coverage.requireQuotation(worker, requirement, req.startsAt(), req.durationDays());
    Boolean eligible =
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM worker_profiles wp JOIN users u ON u.id=wp.user_id JOIN labour_requirements lr ON lr.id=? WHERE wp.user_id=? AND u.status='ACTIVE' AND u.onboarding_state='COMPLETED' AND wp.primary_trade_id=lr.category_id AND wp.availability_status='AVAILABLE')",
            Boolean.class,
            requirement,
            worker);
    if (!Boolean.TRUE.equals(eligible))
      throw new AuthFailure(
          403, "A completed active and available worker profile in the required trade is needed.");
    UUID quoteId =
        sql.queryForObject(
            "INSERT INTO quotations(requirement_id,worker_id,amount,pricing_basis,starts_at,duration_days,worker_note) VALUES (?,?,?,?,?,?,?) RETURNING id",
            UUID.class,
            requirement,
            worker,
            req.amount(),
            req.pricingBasis(),
            java.sql.Timestamp.from(req.startsAt()),
            req.durationDays(),
            req.workerNote());
    try {
      var reqInfo =
          sql.queryForMap(
              "SELECT customer_id, title FROM labour_requirements WHERE id=?", requirement);
      UUID customerId = (UUID) reqInfo.get("customer_id");
      String reqTitle = (String) reqInfo.get("title");
      String workerName =
          sql.queryForObject("SELECT display_name FROM users WHERE id=?", String.class, worker);
      notifications.sendNotification(
          customerId,
          "New Quote Received",
          (workerName != null ? workerName : "A worker")
              + " submitted a quote of ₹"
              + req.amount()
              + " for '"
              + reqTitle
              + "'.",
          "QUOTE_RECEIVED",
          requirement);
    } catch (Exception ignored) {
    }
    return quoteId;
  }

  @Transactional
  public UUID acceptQuote(UUID customer, UUID quote) {
    UUID requirement = ownedRequirement(customer, quote, true);
    String status = lockRequirement(requirement);
    QuoteView q = view(quote);
    if ("ACCEPTED".equals(q.status()))
      return sql.queryForObject("SELECT id FROM bookings WHERE quotation_id=?", UUID.class, quote);
    open(status);
    submitted(q);
    coverage.lockWorker(q.workerId());

    Boolean eligible =
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM worker_profiles wp JOIN users u ON u.id=wp.user_id JOIN labour_requirements lr ON lr.id=? WHERE wp.user_id=? AND u.status='ACTIVE' AND u.onboarding_state='COMPLETED' AND wp.primary_trade_id=lr.category_id AND wp.availability_status='AVAILABLE')",
            Boolean.class,
            requirement,
            q.workerId());
    if (!Boolean.TRUE.equals(eligible))
      throw new AuthFailure(403, "The worker is no longer eligible for this requirement.");

    if (!q.startsAt().isAfter(java.time.Instant.now()))
      throw new AuthFailure(403, "The quoted start time has already passed.");
    coverage.requireQuotation(q.workerId(), requirement, q.startsAt(), q.durationDays());

    sql.update("UPDATE quotations SET status='ACCEPTED' WHERE id=?", quote);
    var losingWorkers =
        sql.queryForList(
            "UPDATE quotations SET status='REJECTED' WHERE requirement_id=? AND status='SUBMITTED' AND id<>? RETURNING worker_id",
            UUID.class,
            requirement,
            quote);
    sql.update("UPDATE labour_requirements SET status='CLOSED' WHERE id=?", requirement);
    UUID booking =
        sql.queryForObject(
            "INSERT INTO bookings(quotation_id,amount,currency,pricing_basis,starts_at,ends_at) VALUES (?,?,?,?,?,?::timestamptz + (? * interval '24 hours')) RETURNING id",
            UUID.class,
            quote,
            q.amount(),
            q.currency(),
            q.pricingBasis(),
            java.sql.Timestamp.from(q.startsAt()),
            java.sql.Timestamp.from(q.startsAt()),
            q.durationDays());
    sql.update(
        "INSERT INTO booking_workers(booking_id,worker_id,starts_at,ends_at,reserved) SELECT id,?,starts_at,ends_at,false FROM bookings WHERE id=?",
        q.workerId(),
        booking);
    bookings.transitionInternal(booking, BookingState.CONFIRMED);
    for (UUID losingWorker : losingWorkers) {
      notifications.sendNotification(
          losingWorker,
          "Quote Not Selected",
          "Another quote for '" + q.requirementTitle() + "' was selected.",
          "QUOTE_REJECTED",
          requirement);
    }
    try {
      notifications.sendNotification(
          q.workerId(),
          "Quote Accepted!",
          "Your quote of ₹"
              + q.amount()
              + " for '"
              + q.requirementTitle()
              + "' was accepted. Booking confirmed!",
          "QUOTE_ACCEPTED",
          booking);
    } catch (Exception ignored) {
    }
    return booking;
  }

  @Transactional
  public void rejectQuote(UUID customer, UUID quote) {
    open(lockRequirement(ownedRequirement(customer, quote, true)));
    QuoteView q = view(quote);
    submitted(q);
    sql.update("UPDATE quotations SET status='REJECTED' WHERE id=?", quote);
    try {
      notifications.sendNotification(
          q.workerId(),
          "Quote Not Selected",
          "Your quote for '" + q.requirementTitle() + "' was not selected.",
          "QUOTE_REJECTED",
          q.requirementId());
    } catch (Exception ignored) {
    }
  }

  @Transactional
  public void withdrawQuote(UUID worker, UUID quote) {
    open(lockRequirement(ownedRequirement(worker, quote, false)));
    submitted(view(quote));
    sql.update("UPDATE quotations SET status='WITHDRAWN' WHERE id=?", quote);
  }

  @Transactional
  public void editQuote(UUID worker, UUID quote, SubmitQuoteRequest req) {
    validate(req);
    UUID requirement = ownedRequirement(worker, quote, false);
    open(lockRequirement(requirement));
    coverage.requireQuotation(worker, requirement, req.startsAt(), req.durationDays());
    submitted(view(quote));
    sql.update(
        "UPDATE quotations SET amount=?,pricing_basis=?,starts_at=?,duration_days=?,worker_note=? WHERE id=?",
        req.amount(),
        req.pricingBasis(),
        java.sql.Timestamp.from(req.startsAt()),
        req.durationDays(),
        req.workerNote(),
        quote);
  }

  public List<QuoteView> getRequirementQuotes(UUID customer, UUID requirement) {
    if (!Boolean.TRUE.equals(
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM labour_requirements WHERE id=? AND customer_id=?)",
            Boolean.class,
            requirement,
            customer))) throw new AuthFailure(404, "Requirement not found.");
    return sql.query(
        VIEW + "WHERE q.requirement_id=? ORDER BY q.created_at DESC", this::map, requirement);
  }

  public List<QuoteView> getMyQuotes(UUID worker) {
    return sql.query(VIEW + "WHERE q.worker_id=? ORDER BY q.created_at DESC", this::map, worker);
  }
}
