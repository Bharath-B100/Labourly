package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Concurrency test for quote acceptance. Must NOT be @Transactional so that each call to
 * acceptQuote runs in its own independent transaction and real DB-level locking is exercised.
 */
@SpringBootTest
@ActiveProfiles("test")
class QuotationConcurrencyIT {

  @Autowired JdbcTemplate sql;
  @Autowired QuotationService quotations;

  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  // Cleanup IDs set during the test so we can delete committed rows afterwards
  private UUID reqId;
  private UUID customerId;

  @AfterEach
  void cleanup() {
    // Bypass row-level triggers (guard_booking_worker) which block deletion of
    // booking_workers for non-PENDING bookings. Safe here: test DB is ephemeral.
    sql.execute("SET session_replication_role = replica");
    try {
      if (reqId != null) {
        sql.update(
            "DELETE FROM booking_workers WHERE booking_id IN "
                + "(SELECT b.id FROM bookings b JOIN quotations q ON b.quotation_id = q.id WHERE q.requirement_id = ?)",
            reqId);
        sql.update(
            "DELETE FROM bookings WHERE quotation_id IN (SELECT id FROM quotations WHERE requirement_id = ?)",
            reqId);
        sql.update("DELETE FROM quotations WHERE requirement_id = ?", reqId);
        sql.update("DELETE FROM labour_requirements WHERE id = ?", reqId);
      }
      if (customerId != null) {
        sql.update("DELETE FROM customer_profiles WHERE user_id = ?", customerId);
        sql.update("DELETE FROM users WHERE id = ?", customerId);
      }
    } finally {
      sql.execute("SET session_replication_role = DEFAULT");
    }
  }

  @Test
  void testConcurrentAcceptanceOrOverlap() throws Exception {
    customerId = UUID.randomUUID();
    UUID worker1Id = UUID.randomUUID();
    UUID worker2Id = UUID.randomUUID();
    UUID categoryId = UUID.randomUUID();
    reqId = UUID.randomUUID();

    // Setup — committed immediately (no outer transaction)
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888885', 'C2', 'ACTIVE')",
        customerId);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')",
        customerId);
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888886', 'W2', 'ACTIVE')",
        worker1Id);
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888887', 'W3', 'ACTIVE')",
        worker2Id);
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES (?, 'Q2_TRADE', 'Q2 Trade')",
        categoryId);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled) VALUES (?, ?, true)",
        worker1Id,
        categoryId);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled) VALUES (?, ?, true)",
        worker2Id,
        categoryId);
    sql.update(
        "INSERT INTO labour_requirements(id, customer_id, category_id, state_code, city, status, title, description, starts_at, ends_at, worker_count) "
            + "VALUES (?, ?, ?, 'KA', 'Bangalore', 'OPEN', 'Concurrency test', 'Desc', now(), now() + interval '1 day', 1)",
        reqId,
        customerId,
        categoryId);

    QuotationDTOs.SubmitQuoteRequest req =
        new QuotationDTOs.SubmitQuoteRequest(
            new BigDecimal("1500.00"), "PER_DAY", Instant.now(), 2, "Note");
    UUID quote1 = quotations.submitQuote(worker1Id, reqId, req);
    UUID quote2 = quotations.submitQuote(worker2Id, reqId, req);

    CyclicBarrier barrier = new CyclicBarrier(2);
    try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
      Future<Boolean> a =
          executor.submit(
              () -> {
                barrier.await();
                try {
                  quotations.acceptQuote(customerId, quote1);
                  return true;
                } catch (Exception e) {
                  return false;
                }
              });
      Future<Boolean> b =
          executor.submit(
              () -> {
                barrier.await();
                try {
                  quotations.acceptQuote(customerId, quote2);
                  return true;
                } catch (Exception e) {
                  return false;
                }
              });

      boolean resA = a.get(15, TimeUnit.SECONDS);
      boolean resB = b.get(15, TimeUnit.SECONDS);

      // Exactly one must succeed
      assertNotEquals(resA, resB, "Expected exactly one concurrent accept to succeed");

      // Verify exactly one booking exists
      int bookingCount =
          sql.queryForObject(
              "SELECT count(*) FROM bookings b JOIN quotations q ON b.quotation_id = q.id WHERE q.requirement_id = ?",
              Integer.class,
              reqId);
      assertEquals(1, bookingCount);
    }
  }
}
