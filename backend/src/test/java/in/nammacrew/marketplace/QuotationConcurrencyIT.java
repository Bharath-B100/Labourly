package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;

import in.nammacrew.auth.AuthFailure;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

class QuotationConcurrencyIT extends QuotationTestSupport {
  @RepeatedTest(3)
  void testConcurrentAcceptanceOrOverlap() throws Exception {
    UUID a = quotations.submitQuote(worker1Id, reqId, request());
    UUID b = quotations.submitQuote(worker2Id, reqId, request());
    CyclicBarrier barrier = new CyclicBarrier(2);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var first = pool.submit(() -> accept(barrier, a));
      var second = pool.submit(() -> accept(barrier, b));
      assertNotEquals(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS));
    }
    assertEquals(1, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM quotations WHERE status='ACCEPTED'", Integer.class));
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM quotations WHERE status='REJECTED'", Integer.class));
    assertEquals("origin", sql.queryForObject("SHOW session_replication_role", String.class));
  }

  boolean accept(CyclicBarrier barrier, UUID quote) throws Exception {
    barrier.await(10, TimeUnit.SECONDS);
    try {
      quotations.acceptQuote(customerId, quote);
      return true;
    } catch (AuthFailure expected) {
      assertEquals(409, expected.status());
      return false;
    }
    // Unexpected SQL errors/deadlocks propagate and fail the test.
  }

  @Test
  void duplicateConcurrentAcceptReturnsSameBooking() throws Exception {
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());
    CyclicBarrier barrier = new CyclicBarrier(2);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<UUID> action =
          () -> {
            barrier.await(10, TimeUnit.SECONDS);
            return quotations.acceptQuote(customerId, quote);
          };
      var first = pool.submit(action);
      var second = pool.submit(action);
      assertEquals(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS));
    }
    assertEquals(1, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
  }
}
