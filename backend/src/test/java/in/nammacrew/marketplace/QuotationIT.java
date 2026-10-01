package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuotationIT {

  @Autowired JdbcTemplate sql;
  @Autowired QuotationService quotations;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  @Test
  void testSubmitAndAcceptQuote() {
    UUID customerId = UUID.randomUUID();
    UUID workerId = UUID.randomUUID();
    UUID categoryId = UUID.randomUUID();

    // Setup base data
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888881', 'C', 'ACTIVE')",
        customerId);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')",
        customerId);

    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888882', 'W', 'ACTIVE')",
        workerId);
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES (?, 'Q_TRADE', 'Q Trade')",
        categoryId);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled) VALUES (?, ?, true)",
        workerId,
        categoryId);

    UUID requirementId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id, customer_id, category_id, state_code, city, status, title, description, starts_at, ends_at, worker_count) "
            + "VALUES (?, ?, ?, 'KA', 'Bangalore', 'OPEN', 'Need help', 'Desc', now(), now() + interval '1 day', 1)",
        requirementId,
        customerId,
        categoryId);

    QuotationDTOs.SubmitQuoteRequest req =
        new QuotationDTOs.SubmitQuoteRequest(
            new BigDecimal("1500.00"), "PER_DAY", Instant.now(), 2, "I can do this");

    UUID quoteId = quotations.submitQuote(workerId, requirementId, req);
    assertNotNull(quoteId);

    // List quotes
    var quotes = quotations.getRequirementQuotes(customerId, requirementId);
    assertEquals(1, quotes.size());
    assertEquals("SUBMITTED", quotes.get(0).status());

    var myQuotes = quotations.getMyQuotes(workerId);
    assertEquals(1, myQuotes.size());

    // Accept quote
    UUID bookingId = quotations.acceptQuote(customerId, quoteId);
    assertNotNull(bookingId);

    // Verify requirement is CLOSED
    String reqStatus =
        sql.queryForObject(
            "SELECT status FROM labour_requirements WHERE id = ?", String.class, requirementId);
    assertEquals("CLOSED", reqStatus);

    // Verify quote is ACCEPTED
    String quoteStatus =
        sql.queryForObject("SELECT status FROM quotations WHERE id = ?", String.class, quoteId);
    assertEquals("ACCEPTED", quoteStatus);

    // Verify booking
    String bookingStatus =
        sql.queryForObject("SELECT status FROM bookings WHERE id = ?", String.class, bookingId);
    assertEquals("CONFIRMED", bookingStatus);

    // Verify idempotency
    UUID duplicateAcceptId = quotations.acceptQuote(customerId, quoteId);
    assertEquals(bookingId, duplicateAcceptId);
  }
}
